import endPoints from "@/aliasTest/endPoints";
import webpackMockServer from "../src/index";

export default webpackMockServer.add((app, helper) => {
  app.get(endPoints.get, (_req, res) => {
    const item = { id: 1, name: "test user" };
    return res.json(item);
  });

  app.get("/mockFile_2", (_req, res) => {
    const response = [];
    for (let i = 0; i < 101; ++i) {
      response.push({
        id: helper.getUniqueIdInt(),
        randomInt: helper.getRandomInt(),
        lastDate: new Date(),
      });
    }

    res.json(response);
  });
});
