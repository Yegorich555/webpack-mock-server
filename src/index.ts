import { Application as ExpressApp } from "express";
import http, { Server } from "http";
import { AddressInfo } from "net";
import log from "./log";
import MockServerOptions, { defOptions } from "./mockServerOptions";
import mockServer from "./mockServer";
import compiler from "./compiler";
import mockServerMiddleware from "./mockServerMiddleware";
import mockServerHelper, { MockServerHelper } from "./mockServerHelper";

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

    // important to apply middleware before we made hook otherwise post/put request will be rejected
    mockServerMiddleware(app, opt.port);

    const prev = http.createServer;
    http.createServer = function hook(): Server {
      // @ts-ignore
      const server = prev.apply(this, arguments);
      server.once("listening", () => {
        http.createServer = prev; // remove hook because another child-server will be started
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
      return server;
    };
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
