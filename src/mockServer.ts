import express, { Application } from "express";
import { Server } from "http";
import nodePath from "path";
import fs from "fs";
import log from "./log";
import provideRoutes from "./provideRoutes";
import NetError from "./netError";
import { OutputMockFile } from "./compilerOutRootFiles";
import MockServerOptions from "./mockServerOptions";
import multer from "multer";

let app: Application;
let server: Server | undefined;
let previousPort = 0;

function close(callback?: (err?: Error) => void): void {
  server && server.close(callback);
  server = undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function requireDefault(file: OutputMockFile): (usedApp: Application) => void {
  // eslint-disable-next-line import/no-dynamic-require, global-require, @typescript-eslint/no-var-requires
  const m = require(file.path);

  const arr: Array<(usedApp: Application) => void> = [];
  function moduleEachWrapper(usedApp: Application): void {
    arr.forEach(f => f(usedApp));
  }

  Object.keys(m).forEach(key => {
    const f = m[key];
    if (typeof f !== "function") {
      log.error(
        `Wrong 'export ${key} = ${f}' from ${file.rootName}: expected exporting only functions`
      );
    } else {
      arr.push(f);
    }
  });

  return moduleEachWrapper;
}

let isFirstStart = true;
export default function mockServer(
  attachedFileNames: OutputMockFile[],
  options: MockServerOptions,
  listenCallback: (port: number, server: Server) => void
): Application {
  log.debug(!server ? "starting" : "re-starting");

  /*
   *  self-destroying
   */
  if (isFirstStart) {
    process.on("SIGINT", () => close()); // handle termination by Ctrl+C
    process.on("beforeExit", () => close());
    isFirstStart = false;
  }

  close();
  app = express();
  app.set("json spaces", 2); // prettify json-response
  app.use(express.json());
  app.use(express.urlencoded({ extended: true })); // support form-urlencoded
  app.use(express.text()); // support ordinary text
  app.use(multer().none()); // support multipart/form-data

  options.before && app.use(options.before);

  // logMiddleware
  if (options.logRequests || options.logResponses) {
    app.use((req, res, next) => {
      if (options.logRequests) {
        log.info(`Got request: ${req.method}`, req.url, {
          httpVersion: req.httpVersion,
          headers: req.headers,
          params: req.params,
          cookies: req.cookies
        });
      }

      if (!options.logResponses) {
        next();
        return;
      }

      const oldWrite = res.write;
      const oldEnd = res.end;
      const chunks: (Buffer | Uint8Array | string)[] = [];

      // @ts-ignore
      res.write = function hookWrite(chunk): boolean {
        chunks.push(chunk);
        // @ts-ignore
        return oldWrite.apply(res, arguments);
      };

      // @ts-ignore
      res.end = function hookEnd(chunk): void {
        if (chunk) {
          chunks.push(chunk);
        }
        // @ts-ignore
        oldEnd.apply(res, arguments);
      };

      res.once("finish", () => {
        const headers = res.getHeaders();
        const contentType = (headers["content-type"] as string) || "";
        const isJson = contentType.startsWith("application/json");
        const isText = contentType.startsWith("text/");
        // eslint-disable-next-line @typescript-eslint/ban-types
        let body: Object | string | undefined;

        try {
          if (chunks.length) {
            const isBufferArray = !chunks.some(
              v => !v || !(v instanceof Buffer || v instanceof Uint8Array)
            );

            // @ts-ignore
            if (isJson) {
              let str = "";
              if (isBufferArray) {
                str = Buffer.concat(chunks as Buffer[]).toString("utf8");
              } else {
                str = chunks.join("\n");
              }
              body = str && JSON.parse(str);
            } else if (isText) {
              body = chunks.join("\n");
            } else if (isBufferArray) {
              body = "[byteArray]";
            } else {
              body = chunks;
            }
          }
        } catch (ex) {
          log.error("", ex);
        }

        log.info(`Sent response for ${req.method}`, req.url, {
          headers: { ...headers }, // it fixes [Object: null prototype] in console
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          body
        });
      });

      next();
    });
  }

  const mockedInfoPath = "/";
  app.get(mockedInfoPath, (_req, res) => {
    try {
      const routes = provideRoutes(app, mockedInfoPath);
      const html = fs
        .readFileSync(
          nodePath.resolve(__dirname, "../public/index.html"),
          "utf8"
        )
        .replace("{routes}", JSON.stringify(routes));
      res.send(html);
    } catch (ex) {
      res.send("Mock server is ready");
      log.error("Exception in provideRoutes()", ex as Error);
    }
  });

  // provides favicon only in case if request to this server directly but not to via ParentProxyServer
  app.get("/favicon.ico", (req, res, next) => {
    const hostHeader = req.header("host");
    // in this case previousPort == currentPort
    if (hostHeader && hostHeader.includes(`:${previousPort}`)) {
      res.sendFile(require.resolve("../public/favicon.ico"));
    } else {
      next();
    }
  });

  function listen(port: number): void {
    server = app
      .listen(port, function gotPort() {
        if (port !== previousPort) {
          log.info("Started at", `http://localhost:${port}/`);
          previousPort = port;
        } else {
          log.debug("Started at", `http://localhost:${port}/`);
        }
        listenCallback && listenCallback(port, server as Server);
      })
      .on("error", function listenErrorCallback(err: NetError) {
        if (err.code === "EADDRINUSE" || err.code === "EACCES") {
          listen(port + 1);
        } else {
          log.error("", err);
        }
      });
  }

  try {
    if (attachedFileNames.length === 0) {
      log.error("There are no rootFiles");
    } else {
      log.debug(
        "import rootFiles:",
        "",
        attachedFileNames.map(v => v.path)
      );
      attachedFileNames.forEach(v => requireDefault(v)(app));
    }
    listen(options.port);
  } catch (ex) {
    log.error("Exception during attaching node-modules", ex);
  }

  return app;
}
