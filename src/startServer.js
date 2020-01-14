/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */
const { fork } = require("child_process");
const { defOptions } = require("./mockServerOptions");
const compiler = require("./compiler");
const logger = require("./logger");

/** @type {import("child_process").ChildProcess | null} */
let child = null;

/**
 * @param {import("./MockServerOptions").defOptions | undefined} [options]
 * @param {{(port: number): void} | undefined} [listenCallback]
 */
module.exports = function startServer(options, listenCallback) {
  const opt = { ...defOptions, ...options };
  if (opt.port) {
    process.env.webpackMockPort = opt.port.toString();
  }

  compiler(
    "mockServer.ts",
    opt.compilerOptions,
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
          /** @type {number | undefined} */
          let port;
          // @ts-ignore
          // eslint-disable-next-line prefer-const
          port = m.port;
          if (port && process.env.webpackMockPort !== port.toString()) {
            listenCallback && listenCallback(port);
            process.env.webpackMockPort = port.toString();
          }
        });
      } catch (ex) {
        logger.error(ex);
      }
    }
  );
};
