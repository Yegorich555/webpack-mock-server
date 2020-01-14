/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */
const { fork } = require("child_process");
const compiler = require("./compiler");

let child = null;
module.exports = function startServer() {
  compiler("mockServer.ts", function onChanged(outPath) {
    try {
      // eslint-disable-next-line no-unused-expressions
      child && child.kill();
      child = fork(outPath, [], {
        cwd: process.cwd(),
        env: process.env
      });
      // todo get port from child
      // child.on("message", m => {
      //   console.log("PARENT got message:", m);
      // });

      // child.on("exit", start);
    } catch (ex) {
      console.warn(ex);
    }
  });
  return 0;
};
