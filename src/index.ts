// eslint-disable-next-line import/no-extraneous-dependencies
import express, { Application as ExpressApp } from "express";
import http from "http";
import startServer from "./startServer";
import log from "./logger"; // todo autoimport doesn't work for index.ts file
import NetError from "./declarations/net-error";
import MockServerOptions, { defOptions } from "./mockServerOptions";

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

      if (clientReq.url === "/" || !storedPort) {
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
  use(app: ExpressApp, options: MockServerOptions | undefined): void {
    try {
      const opt = { ...defOptions, ...options };
      log.verbose = opt.verbose;

      addProxyToMockServer(app);
      // todo search for tsconfig.json in parent module
      startServer(opt, port => {
        storedPort = port;
      });
    } catch (ex) {
      log.error("Unable to start server.", ex);
    }
  },
  app: express() // todo remove this
};

export default webpackMockServer;
