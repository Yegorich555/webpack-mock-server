import nodePath from "path";
import webpackMockServer from "../src/index";
import testAddon from "../webpack.test.mockOut";

export { testAddon };

export default webpackMockServer.add(app => {
  app.get("/testDefaultExport", (_req, res) => {
    const response = [];
    for (let i = 0; i < 101; ++i) {
      response.push({
        firstName: "Jane",
        lastName: "Doe",
        lastDate: new Date()
      });
    }
    res.json(response);
  });
  app.get("/testResponseFromJsonFile", (_req, res) => {
    res.sendFile(nodePath.join(__dirname, "./response.json"));
  });
  app.get("/testResponseFromJsonFile2", (_req, res) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    res.json(require("./response.json"));
  });
});

export const result2 = webpackMockServer.add(app => {
  app.get(["/getFavIcon"], (_req, res) => {
    // res.type("application/...");
    res.download("public/favicon.ico", "favicon.ico");
  });

  app.post(["/testPost"], (_req, res) => {
    const response = [];
    for (let i = 0; i < 20; ++i) {
      response.push({
        bestAddress1: "101 Main St",
        bestAddress2: "",
        bestCountry: "US",
        lastDate: new Date()
      });
    }
    res.json(response);
  });

  ["get", "post", "put", "delete"].forEach(method => {
    for (let i = 0; i < 2; ++i) {
      const route = `/test${method}${i + 1}`;
      // @ts-ignore
      app[method](route, (_req, res) => {
        res.json({
          route,
          method,
          date: new Date(),
          num: i
        });
      });
    }
  });
});
