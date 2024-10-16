/* eslint-disable @typescript-eslint/no-namespace */
import { Application as ExpressApp } from "express";
import compiler from "./compiler";
import log from "./log";
import mockServer from "./mockServer";
import mockServerHelper, { MockServerHelper } from "./mockServerHelper";
import mockServerMiddleware from "./mockServerMiddleware";
import MockServerOptions, { defOptions } from "./mockServerOptions";

const webpackMockServer = {
  /** Applies webpackMiddleware on existed express-application
   * @param app express application that is used for mapping-routes
   * @param extendOptions MockServerOptions that overrides default options */
  use(app: ExpressApp, extendOptions: MockServerOptions | undefined = undefined): void {
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

    // important to apply middleware before we made hook otherwise post/put request will be rejected
    mockServerMiddleware(app, opt.port);

    try {
      log.debug("Starting mock-server...");
      compiler(opt.entry, opt.tsConfigFileName, opt.compilerOptions, (outFileNames) => {
        mockServer(outFileNames, opt, (port) => {
          mockServerMiddleware(app, port);
        });
      });
    } catch (ex) {
      log.error("Unable to start server\n", ex as Error);
    }
  },

  /** Add mock functions into webpackMockServer
   * @param mockFunction */
  add(mockFunction: (app: ExpressApp, helper: MockServerHelper) => void): (app: ExpressApp) => void {
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
       * Uploading files automatically stores ones into memory
       * As alternative you can check req.files for getting fileName `originalname` & form `fieldname` */
      fileDownloadUrls?: string[];
    }
    namespace Multer {
      interface File {
        downloadUrl: string;
      }
    }
  }
}
