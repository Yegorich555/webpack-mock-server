/* eslint-disable import/first */
import path from "path";

// add NODE_PATH if file moved into tmp dir
process.env.NODE_PATH = path.join(process.cwd(), "node_modules");
if (process.mainModule) process.mainModule.paths.push(process.env.NODE_PATH); // fix for "NODE_PATH sometimes doesn't work"

// eslint-disable-next-line import/no-extraneous-dependencies
import express from "express";
import log from "./log";
import provideRoutes from "./provideRoutes";
import NetError from "./declarations/net-error";

const app = express();
app.set("json spaces", 2); // prettify json-response

const mockedInfoPath = "/";
app.get(mockedInfoPath, (_req, res) => {
  try {
    const routes = provideRoutes(app, mockedInfoPath);
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

    log.error("", ex as Error);
  }
});

// todo const mockApi = require("../webpack.mock").default;
// mockApi(app);

function listen(port: number): void {
  app
    .listen(port, function listenCallback() {
      process.send && process.send({ port });
      log.info("Started at", `http://localhost:${port}/`);
    })
    .on("error", function listenErrorCallback(err: NetError) {
      if (err.errno === "EADDRINUSE" || err.errno === "EACCES") {
        listen(port + 1);
      } else {
        log.error("", err);
      }
    });
}
const defPort = process.env.webpackMockPort || "8069";
listen(Number(defPort));
