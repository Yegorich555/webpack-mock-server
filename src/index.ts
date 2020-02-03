import { Application as ExpressApp } from "express";
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
    try {
      const opt = { ...defOptions, ...extendOptions };
      opt.compilerOptions = {
        ...defOptions.compilerOptions,
        ...extendOptions?.compilerOptions,
        ...defOptions.strictCompilerOptions
      };
      log.verbose = opt.verbose;

      mockServerMiddleware(app, 0);

      compiler(
        opt.entry,
        opt.tsConfigFileName,
        opt.compilerOptions,
        outFileNames => {
          mockServer(outFileNames, opt.port, port => {
            mockServerMiddleware(app, port);
          });
        }
      );
    } catch (ex) {
      log.error("Unable to start server", ex);
    }
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

export default webpackMockServer;
