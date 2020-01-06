import webpackMockServer from "./src/index";

const { app } = webpackMockServer;

app.get("d", (_req, res) => {
  return res.json();
});
