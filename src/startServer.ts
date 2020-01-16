import { fork, ChildProcess } from "child_process";
import MockServerOptions, { defOptions } from "./mockServerOptions";
import compiler from "./compiler";
import log from "./log";

function startServer(
  options: MockServerOptions | undefined,
  listenCallback: (port: number) => void
): void {
  const opt = { ...defOptions, ...options };
  if (opt.port) {
    process.env.webpackMockPort = opt.port.toString();
  }

  let child: ChildProcess | null = null;
  compiler(
    "mockServer.js",
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
        log.error(ex);
      }
    }
  );
}

export default startServer;
