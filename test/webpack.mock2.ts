import { Application } from "express";

export default (app: Application): void => {
  app.get("/test2", (_req, res) => {
    const response = [];
    for (let i = 0; i < 101; ++i) {
      response.push({
        lastDate: new Date()
      });
    }
    res.json(response);
  });
};
