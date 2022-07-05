import { Application } from "express";

export default (app: Application): void => {
  app.get("/testExportOut", (_req, res) => {
    res.json("Ok");
  });
  app.post("/testPostMock", (req, res) => {
    res.json({ body: req.body || null, success: true });
  });
};
