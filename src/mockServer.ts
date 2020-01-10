// eslint-disable-next-line import/no-extraneous-dependencies
import express from "express";
import { AddressInfo } from "net";
import log from "./logger";
import provideRoutes from "./provideRoutes";

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

const mockPort = 8079;

const listener = app.listen(mockPort, function listenCallback() {
  const address = listener.address() as AddressInfo;
  log.info("Started at", `http://localhost:${address && address.port}/`);
});
