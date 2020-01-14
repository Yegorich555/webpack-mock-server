/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */
const { fork } = require("child_process");
const compiler = require("./compiler");
const logger = require("./logger");

/** @type {import("child_process").ChildProcess | null} */
let child = null;

/**
 * @param {(port: Number) => void | undefined} [callback]
 */
module.exports = function startServer(callback) {
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

        child.on("message", m => {
          // @ts-ignore
          const { port } = m;
          // eslint-disable-next-line eqeqeq
          if (port && process.env.webpackMockPort != port) {
            callback && callback(port);
            process.env.webpackMockPort = port.toString();
          }
        });
      } catch (ex) {
        logger.error(ex);
      }
    }
  );
};
