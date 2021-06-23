import { Application as ExpressApp } from "express";
import http, { Server } from "http";
import https from "https";
import { AddressInfo } from "net";
import compiler from "./compiler";
import log from "./log";
import mockServer from "./mockServer";
import mockServerHelper, { MockServerHelper } from "./mockServerHelper";
import mockServerMiddleware from "./mockServerMiddleware";
import MockServerOptions, { defOptions } from "./mockServerOptions";

const webpackMockServer = {
  /**
   * Applies wepackMiddleware on existed express-application
   * @param app expressjs application that is used for mapping-routes
   * @param extendOptions MockServerOptions that overrides default options
   */
  use(
    app: ExpressApp,
    extendOptions: MockServerOptions | undefined = undefined
  ): void {
    const opt = {
      ...defOptions,
      ...extendOptions
    } as MockServerOptions;
    opt.compilerOptions = {
      ...defOptions.compilerOptions,
      ...extendOptions?.compilerOptions,
      ...defOptions.strictCompilerOptions
    };
    log.verbose = opt.verbose;

    console.warn(app);
    // important to apply middleware before we made hook otherwise post/put request will be rejected
    mockServerMiddleware(app, opt.port);

    let disposeAll: Array<() => void> = [];
    function setupHook<T extends Server>(httpOrHttps: {
      createServer: () => T;
    }): void {
      const prev = httpOrHttps.createServer;

      disposeAll.push(() => {
        // eslint-disable-next-line no-param-reassign
        httpOrHttps.createServer = prev;
      });

      // eslint-disable-next-line no-param-reassign
      httpOrHttps.createServer = function hook(): T {
        // @ts-ignore
        const server = prev.apply(this, arguments);
        server.once("listening", () => {
          disposeAll.forEach(d => d());
          disposeAll = [];
          const address = server.address() as AddressInfo;
          const parentPort = (address && address.port) || 8080;
          log.debug("Parent server is started. Starting mock-server...");
          // set another port because of httpServer in the same process overrides previous listenere
          if (opt.port === parentPort) {
            ++opt.port;
          }
          try {
            compiler(
              opt.entry,
              opt.tsConfigFileName,
              opt.compilerOptions,
              outFileNames => {
                mockServer(outFileNames, opt, port => {
                  mockServerMiddleware(app, port);
                });
              }
            );
          } catch (ex) {
            log.error("Unable to start server\n", ex);
          }
        });
        return server as T;
      };
    }

    setupHook.call(this, http);
    setupHook.call(this, https);
  },
  /**
   * Add mock functions into webackMockServer
   * @param mockFunction
   */
  add(
    mockFunction: (app: ExpressApp, helper: MockServerHelper) => void
  ): (app: ExpressApp) => void {
    return (app: ExpressApp): void => {
      mockFunction(app, mockServerHelper);
    };
  },
  /** Default MockServer options (readonly) */
  get defaultOptions(): MockServerOptions {
    return JSON.parse(JSON.stringify(defOptions));
  }
};

export = webpackMockServer;
