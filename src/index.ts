/* eslint-disable @typescript-eslint/no-namespace */
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
import NetError from "./netError";

const webpackMockServer = {
  /**
   * Applies webpackMiddleware on existed express-application
   * @param app express application that is used for mapping-routes
   * @param extendOptions MockServerOptions that overrides default options
   */
  use(
    app: ExpressApp,
    extendOptions: MockServerOptions | undefined = undefined
  ): void {
    const opt = {
      ...defOptions,
      ...extendOptions,
    } as MockServerOptions;
    opt.compilerOptions = {
      ...defOptions.compilerOptions,
      ...extendOptions?.compilerOptions,
      ...defOptions.strictCompilerOptions,
    };
    log.verbose = opt.verbose;

    let isDefined = false;

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

        function parentServerCallback(err?: NetError): void {
          if (isDefined) {
            return;
          }
          isDefined = true;

          disposeAll.forEach((d) => d());
          disposeAll = [];
          const address = server.address() as AddressInfo;
          const parentPort = address?.port || err?.port || 8080;
          log.debug("Parent server is started. Starting mock-server...");
          // set another port because of httpServer in the same process overrides previous listener
          if (opt.port === parentPort) {
            ++opt.port;
          }

          try {
            compiler(
              opt.entry,
              opt.tsConfigFileName,
              opt.compilerOptions,
              (outFileNames) => {
                mockServer(outFileNames, opt, (port) => {
                  mockServerMiddleware(app, port);
                });
              }
            );
          } catch (ex) {
            log.error("Unable to start server\n", ex as Error);
          }
        }

        server.once("listening", parentServerCallback);
        server.once("error", parentServerCallback);
        return server as T;
      };
    }

    setupHook.call(this, http);
    setupHook.call(this, https);
  },
  /**
   * Add mock functions into webpackMockServer
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
  },
};

export = webpackMockServer;

declare global {
  namespace Express {
    interface Request {
      /** Urls that can be used for downloading uploaded files
       * Uploading files automatically stores it's in memory
       * As alternative you can check req.file and req.files for getting file-names */
      fileDownloadUrls?: string[];
    }
    namespace Multer {
      interface File {
        downloadUrl: string;
      }
    }
  }
}
