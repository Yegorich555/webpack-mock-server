/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */
const { fork } = require("child_process");
const compiler = require("./compiler");
const logger = require("./logger");

/** @type {import("child_process").ChildProcess | null} */
let child = null;
module.exports = function startServer() {
  compiler(
    "mockServer.ts",
    /**
     * @param {string} outPath
     */
    function onChanged(outPath) {
      try {
        if (child) {
          child.kill(); // todo clear tmp folder
        }
        child = fork(outPath, [], {
          cwd: process.cwd(),
          env: process.env
        });
      // todo get port from child
      // child.on("message", m => {
      //   console.log("PARENT got message:", m);
      // });

      // child.on("exit", start);
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      } catch (ex) {
        logger.error(ex);
      }
    }
  );
  return 0;
};
