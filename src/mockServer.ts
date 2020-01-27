import express, { Application } from "express";
import { Server } from "http";
import nodePath from "path";
import fs from "fs";
import log from "./log";
import provideRoutes from "./provideRoutes";
import NetError from "./netError";

let app: Application;
let server: Server | undefined;
let previousPort = 0;

function close(callback?: (err?: Error) => void): void {
  server && server.close(callback);
  server = undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function requireDefault(str: string): any {
  // eslint-disable-next-line import/no-dynamic-require, global-require, @typescript-eslint/no-var-requires
  const m = require(str);
  // eslint-disable-next-line no-unused-expressions
  const f = m.default ? m.default : m;
  if (typeof f !== "function") {
    log.error(`Expected [export default function] in module ${str}`);
    // todo maybe search for multiple export functions
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return (): void => {};
  }
  return f;
}

export default function mockServer(
  attachedFileNames: string[],
  defPort: number,
  listenCallback: (port: number, server: Server) => void
): Application {
  log.debug("restarting/starting mock-server");
  close();
  app = express();
  app.set("json spaces", 2); // prettify json-response

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
    attachedFileNames.forEach(v => requireDefault(v)(app));
    listen(defPort);
  } catch (ex) {
    log.error("Exception during attaching node-modules", ex);
  }

  return app;
}

/*
 *  self-destroying
 */
process.on("SIGINT", () => close()); // handle termination by Ctrl+C
process.on("beforeExit", () => close());
