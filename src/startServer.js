// eslint-disable-next-line @typescript-eslint/no-var-requires
const tsNodeDev = require("ts-node-dev");

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
module.exports = function startServer() {
  const args = {
    script: `${__dirname}/mockServer.ts`, // todo improve here
    scriptArgs: [],
    nodeArgs: [],
    opts: {
      respawn: true, // node-dev: keep watching for changes after the script has exited
      notify: false, // node-dev: switch off desktop notifications
      debug: false, // ts-node-dev: switch off debug-info
      transpileOnly: true, // ts-node: ignore type checking for faster builds
      compilerOptions: JSON.stringify({
        // ts-node options instead of tsconfig.json
        allowJs: true,
        module: "commonjs",
        esModuleInterop: true
      })
    }
  };

  tsNodeDev(args.script, args.scriptArgs, args.nodeArgs, args.opts);
  return 8079;
};
