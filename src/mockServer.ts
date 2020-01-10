// eslint-disable-next-line import/no-extraneous-dependencies
import express from "express";
import log from "./logger";
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

// const mockApi = require("../webpack.mock").default;
// mockApi(app);

function listen(port: number): void {
  app
    .listen(port, function listenCallback() {
      // todo handle portNumber
      log.info("Started at", `http://localhost:${port}/`);
    })
    .on("error", function listenErrorCallback(err: NetError) {
      if (err.errno === "EADDRINUSE" || err.errno === "EACCES") {
        listen(port + 1);
      } else {
        console.log(err);
      }
    });
}

listen(80); // todo reload with the previous portNumber
