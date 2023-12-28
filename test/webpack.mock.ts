/* eslint-disable import/no-dynamic-require */
import nodePath from "path";
import webpackMockServer from "../src/index";
import testAddon from "../webpack.test.mockOut";

export { testAddon };

export default webpackMockServer.add((app) => {
  app.get("/testDefaultExport", (_req, res) => {
    const response = [];
    for (let i = 0; i < 101; ++i) {
      response.push({
        firstName: "Jane",
        lastName: "Doe",
        lastDate: new Date(),
        page: { number: 1 } as IPage,
      });
    }
    res.json(response);
  });
  app.get("/testResponseFromJsonFile", (_req, res) => {
    res.sendFile(nodePath.join(__dirname, "./response.json"));
  });
  app.get("/testResponseFromJsonFile2", (_req, res) => {
    const resolvedPath = require.resolve(
      nodePath.join(__dirname, "./response.json")
    );
    // removing NodeJS cache for getting the latest file
    delete require.cache[resolvedPath];
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    res.json(require(resolvedPath));
  });
  app.get("/testResponseFromJsonFile2_alt", (_req, res) => {
    const resolvedPath = require.resolve("./response.json", {
      // option 'paths' available from NodeJS v8.9.0
      paths: [__dirname],
    });
    // removing NodeJS cache for getting the latest file
    delete require.cache[resolvedPath];
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    res.json(require(resolvedPath));
  });
  app.post("/testUploadFile", (req, res) => {
    console.warn(req.file, req.files);
    res.json(req.fileDownloadUrls && req.fileDownloadUrls[0]);
  });
});

export const result2 = webpackMockServer.add((app) => {
  app.get(["/getFavIcon"], (_req, res) => {
    // res.type("application/...");
    res.download("public/favicon.ico", "favicon.ico");
  });

  app.post(["/testPost"], (req, res) => {
    res.json({ success: !!req.body, gotBody: req.body || null });
  });

  ["get", "post", "put", "delete"].forEach((method) => {
    for (let i = 0; i < 2; ++i) {
      const route = `/test${method}${i + 1}`;
      // @ts-ignore
      app[method](route, (_req, res) => {
        res.json({
          route,
          method,
          date: new Date(),
          num: i,
        });
      });
    }
  });
});
