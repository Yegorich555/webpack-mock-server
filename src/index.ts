// eslint-disable-next-line import/no-extraneous-dependencies
import express, { Application as ExpressApp } from "express"; // todo remove as dependency
import http from "http";
import tsNodeDev from "ts-node-dev";
import log from "./logger";
import mockPort from "./mockPort";

// fix for error-extending in nodejs: https://github.com/nodejs/node/blob/4bec6d13f9e9068fba778d0c806a2ca1335c8180/lib/internal/errors.js#L545
interface NetError extends Error {
  errno: string;
  code: string;
  syscall: string;
  address: string;
  port: string | undefined;
}

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
              log.error(ex);
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
  run(): void {
    const args = {
      script: "./mockServer.ts",
      scriptArgs: [],
      nodeArgs: [],
      opts: {
        respawn: true, // node-dev: keep watching for changes after the script has exited
        notify: false, // node-dev: switch off desktop notifications
        debug: false, // ts-node-dev: switch off debug-info
        // transpileOnly: true, // ts-node: ignore type checking for faster builds
        ignoreDiagnostics: false,
        compilerOptions: JSON.stringify({
          // ts-node options instead of tsconfig.json
          allowJs: true,
          module: "commonjs",
          esModuleInterop: true
        })
      }
    };

    tsNodeDev(args.script, args.scriptArgs, args.nodeArgs, args.opts);
  },
  use(app: ExpressApp): void {
    try {
      webpackMockServer.run(); // TODO get port from

      addProxyToMockServer(app, mockPort);
    } catch (ex) {
      log.error("Unable to start server.", ex);
    }
  },
  app: express()
};

export default webpackMockServer;
