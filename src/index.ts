import { Application as ExpressApp } from "express";
import http from "http";
import log from "./log";
import NetError from "./netError";
import MockServerOptions, { defOptions } from "./mockServerOptions";
import mockServer from "./mockServer";
import compiler from "./compiler";
import clearNodeCache from "./clearNodeCache";

let storedPort = 0;
function addProxyToMockServer(app: ExpressApp): void {
  let wasError = false;

  // proxy for webpack
  app.use(function handle(clientReq, clientRes, next) {
    try {
      const options = {
        hostname: "localhost",
        port: storedPort,
        path: clientReq.url,
        method: clientReq.method,
        headers: clientReq.headers
      };

      if (
        clientReq.url === "/" ||
        clientReq.url.startsWith("/?") ||
        clientReq.url.startsWith("?") ||
        !storedPort
      ) {
        next();
        return;
      }

      const proxy = http.request(options, function callback(res) {
        wasError = false;

        if (res.statusCode === 404) {
          next();
        } else if (res) {
          clientRes.writeHead(res.statusCode || 200, res.headers);
          res.pipe(clientRes, {
            end: true
          });
        }
      });

      clientReq
        .pipe(proxy, {
          end: true
        })
        .on("error", function onError(ex: NetError) {
          if (!wasError) {
            wasError = true;
            if (ex.code === "ECONNREFUSED") {
              log.error(
                `Server is not available on ${ex.address}${
                  ex.port ? `:${ex.port}` : ""
                }`
              );
            } else {
              log.error("", ex);
            }
          }
          next();
        });
    } catch (ex) {
      log.error(ex);
      next();
    }
  });
}

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

      addProxyToMockServer(app);
      compiler(
        opt.entry,
        opt.tsConfigFileName,
        opt.compilerOptions,
        (outFileNames, outDir) => {
          clearNodeCache(outDir);
          mockServer(outFileNames, opt.port, port => {
            storedPort = port;
          });
        }
      );
    } catch (ex) {
      log.error("Unable to start server", ex);
    }
  }
};

export default webpackMockServer;
