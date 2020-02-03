import { Application as ExpressApp } from "express";
import log from "./log";
import MockServerOptions, { defOptions } from "./mockServerOptions";
import mockServer from "./mockServer";
import compiler from "./compiler";
import clearNodeCache from "./clearNodeCache";
import mockServerMiddleware from "./mockServerMiddleware";

const webpackMockServer = {
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
        (outFileNames, outDir) => {
          clearNodeCache(outDir);
          mockServer(outFileNames, opt.port, port => {
            mockServerMiddleware(app, port);
          });
        }
      );
    } catch (ex) {
      log.error("Unable to start server", ex);
    }
  }
};

export default webpackMockServer;
