import { Application as ExpressApp } from "express";
import http from "http";
import NetError from "./netError";
import log from "./log";

let storedPort = 0;
let isDone = false;
export default function mockServerMiddleware(
  app: ExpressApp,
  port: number
): void {
  storedPort = port;

  if (isDone) {
    return;
  }
  let wasError = false;
  isDone = true;
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
          clientRes.writeHead(201 || res.statusCode || 200, res.headers);
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
