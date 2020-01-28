import { Application } from "express";

export default (app: Application): void => {
  app.get("/test", (_req, res) => {
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
};