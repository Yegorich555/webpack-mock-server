// eslint-disable-next-line import/no-extraneous-dependencies
import express, { Application as ExpressApp } from "express";
import http from "http";
import startServer from "./startServer";
import log from "./logger";
import NetError from "./declarations/net-error";

function addProxyToMockServer(app: ExpressApp, port: number): void {
  let wasError = false;

  // proxy for webpack
  app.use(function handle(clientReq, clientRes, next) {
    try {
      const options = {
        hostname: "localhost",
        port,
        path: clientReq.url,
        method: clientReq.method,
        headers: clientReq.headers
      };

      if (clientReq.url === "/") {
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
  use(app: ExpressApp): void {
    try {
      const port = startServer();

      addProxyToMockServer(app, port);
    } catch (ex) {
      log.error("Unable to start server.", ex);
    }
  },
  app: express()
};

export default webpackMockServer;
