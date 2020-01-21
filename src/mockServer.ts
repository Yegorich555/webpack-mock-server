import express, { Application } from "express";
import { Server } from "http";
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
function requireUncached(str: string, ignoreCache = true): any {
  if (ignoreCache) {
    delete require.cache[require.resolve(str)];
  }
  // eslint-disable-next-line import/no-dynamic-require, global-require, @typescript-eslint/no-var-requires
  const m = require(str);
  // eslint-disable-next-line no-unused-expressions
  return m.default ? m.default : m;
}

export default function mockServer(
  attachedFileNames: string[],
  defPort: number,
  listenCallback: (port: number, server: Server) => void
): Application {
  close();
  app = express();
  app.set("json spaces", 2); // prettify json-response

  const mockedInfoPath = "/";
  app.get(mockedInfoPath, (_req, res) => {
    try {
      const routes = provideRoutes(app, mockedInfoPath);
      // todo create user friendly view
      const html = `
      <h1>Routes: </h1>
      <ul>${routes
        .map(r => {
          const isGet = r.method.includes("get");
          return `
            <li>
              ${r.method}: ${isGet ? `<a href=${r.path}>${r.path}</a>` : r.path}
            </li>
            `;
        })
        .join("")}
      </ul>
      `;
      res.send(html);
    } catch (ex) {
      res.send("Mock server is ready");
      log.error("Exception in provideRoutes()", ex as Error);
    }
  });

  // todo improve this by getting written files from compiler
  attachedFileNames.forEach(v => requireUncached(v, true)(app));

  function listen(port: number): void {
    server = app
      .listen(port, function gotPort() {
        if (port !== previousPort) {
          log.info("Started at", `http://localhost:${port}/`);
          previousPort = port;
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
  listen(defPort);

  return app;
}

/*
 *  self-destroying
 */
process.on("SIGINT", () => close()); // handle termination by Ctrl+C
process.on("beforeExit", () => close());
