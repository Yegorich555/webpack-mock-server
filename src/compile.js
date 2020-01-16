/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line import/no-extraneous-dependencies
const ts = require("typescript");

// creating hooks
const sysConfig = { ...ts.sys };

sysConfig.writeFile = function writeFileWrapper(path) {
  console.warn("write", path);
  return ts.sys.writeFile(...arguments);
};

sysConfig.readFile = function readFile(path) {
  console.warn("read", path);
  return ts.sys.readFile(...arguments);
};

const host = ts.createWatchCompilerHost(
  ["./src/mockServer.ts"],
  {
    esModuleInterop: true,
    allowJs: true,
    skipLibCheck: true,
    outDir: "./dist",
    module: ts.ModuleKind.CommonJS
    // todo wait for transpileOnly option: https://github.com/microsoft/TypeScript/issues/29651
  },
  sysConfig,
  ts.createSemanticDiagnosticsBuilderProgram
);
ts.createWatchProgram(host);
