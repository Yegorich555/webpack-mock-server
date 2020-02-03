import webpackMockServer from "../src/index";

export default webpackMockServer.add((app, helper) => {
  app.get("/mockFile_2", (_req, res) => {
    const response = [];
    for (let i = 0; i < 101; ++i) {
      response.push({
        id: helper.getRandomInt(),
        lastDate: new Date()
      });
    }

    res.json(response);
  });
});
