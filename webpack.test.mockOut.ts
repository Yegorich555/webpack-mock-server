import { Application } from "express";

export default (app: Application): void => {
  app.get("/testExportOut", (_req, res) => {
    res.json("Ok");
  });
};
