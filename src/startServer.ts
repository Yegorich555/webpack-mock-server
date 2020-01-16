import { fork, ChildProcess } from "child_process";
import MockServerOptions, { defOptions } from "./mockServerOptions";
import compiler from "./compiler";
import log from "./log";

type childMessage = {
  port: number | undefined;
};

function startServer(
  options: MockServerOptions | undefined,
  listenCallback: (port: number) => void
): void {
  const opt = { ...defOptions, ...options };
  if (opt.port) {
    process.env.webpackMockPort = opt.port.toString();
  }

  let child: ChildProcess | null = null;
  compiler("../src/mockServer.ts", opt.compilerOptions, function onChanged(
    outPath
  ) {
    try {
      if (child) {
        child.kill(); // todo clear tmp folder
      }
      log.debug("running file", outPath);
      child = fork(outPath, [], {
        cwd: process.cwd(),
        env: process.env
      });

      child.on("message", (m: childMessage | undefined) => {
        const port = m && m.port;
        if (port && process.env.webpackMockPort !== port.toString()) {
          listenCallback && listenCallback(port);
          process.env.webpackMockPort = port.toString();
        }
      });
    } catch (ex) {
      log.error(ex);
    }
  });
}

export default startServer;
