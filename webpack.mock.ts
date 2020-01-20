import { Application } from "express";

export default (app: Application): void => {
  app.get("/test", (_req, res) => {
    res.json("Test Is Fine");
  });
};
