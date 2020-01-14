/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line import/no-extraneous-dependencies
const ts = require("typescript"); // todo TypeScript >= 2.7 expected
const nodePath = require("path");
const os = require("os");
const logger = require("./logger");

/**
 * ts.FormatDiagnosticsHost
 */
const formatHost = {
  /**
   * @param {string} path
   */
  getCanonicalFileName: path => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine
};

/**
 * @param {ts.Diagnostic} diagnostic
 */
function reportDiagnostic(diagnostic) {
  logger.error(
    `TS${diagnostic.code}:\n${ts.flattenDiagnosticMessageText(
      diagnostic.messageText,
      formatHost.getNewLine()
    )}`
  );
}

// function hash(str, seed = 0) {
//   let h1 = 0xdeadbeef ^ seed;
//   let h2 = 0x41c6ce57 ^ seed;
//   for (let i = 0, ch; i < str.length; i++) {
//     ch = str.charCodeAt(i);
//     h1 = Math.imul(h1 ^ ch, 2654435761);
//     h2 = Math.imul(h2 ^ ch, 1597334677);
//   }
//   h1 =
//     Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
//     Math.imul(h2 ^ (h2 >>> 13), 3266489909);
//   h2 =
//     Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
//     Math.imul(h1 ^ (h1 >>> 13), 3266489909);
//   return 4294967296 * (2097151 & h2) + (h1 >>> 0);
// }

/**
 * @param {string} version
 */
function parseVersions(version) {
  const arr = version.split(/[v.]/g).filter(v => v !== "");
  return {
    major: Number.parseInt(arr[0], 10),
    minor: Number.parseInt(arr[1], 10),
    patch: arr[2]
  };
}

// https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API#writing-an-incremental-program-watcher
/**
 * @param {string} watchFile
 * @param {{ (outPath: string): void; (arg0: string): void; }} onChanged
 */
module.exports = function watchMain(watchFile, onChanged) {
  const tsVer = Number.parseFloat(ts.versionMajorMinor);
  if (tsVer < 2.7) {
    throw new Error("WebpackMockServer. Typescript version >=2.7 is expected");
  }
  let isOnChanged = true;

  const emptyWatcher = {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    close: () => {}
  };

  // creating hooks
  const sysConfig = {
    ...ts.sys
  };

  sysConfig.watchFile = function watchFileWithIgnore(path, callback) {
    if (path.includes("node_modules")) {
      return emptyWatcher;
    }
    /**
     * @param {string} fileName
     * @param {ts.FileWatcherEventKind} eventKind
     */
    function callbackWrapper(fileName, eventKind) {
      console.warn("callback", fileName, eventKind);
      // @ts-ignore
      callback(...arguments);
    }
    const args = [...arguments];
    args[1] = callbackWrapper;
    // @ts-ignore
    return ts.sys.watchFile(...args);
  };

  sysConfig.watchDirectory = function watchDirectoryWithIgnore(path) {
    if (path.includes("node_modules")) {
      return emptyWatcher;
    }
    // @ts-ignore
    return ts.sys.watchDirectory(...arguments);
  };

  sysConfig.writeFile = function writeFileWrapper(path) {
    // todo ignore writing by hash
    logger.debug("write", path);
    isOnChanged = true;
    // @ts-ignore
    return ts.sys.writeFile(...arguments);
  };

  sysConfig.readFile = function readFile(path) {
    logger.debug("read", path);
    // @ts-ignore
    return ts.sys.readFile(...arguments);
  };

  // define es target
  const nodeJsVersion = parseVersions(process.version);
  let esTarget = "es3";
  if (nodeJsVersion.major >= 10) {
    esTarget = "es2017";
  } else if (nodeJsVersion.major >= 6) {
    esTarget = "es6";
  }

  // define tmpDir
  const tmpDir = nodePath.join(
    os.tmpdir(),
    `webpack-mock-${1 || new Date().getTime()}` // todo remove after debug
  );

  // todo clear tmp folder before exit

  const outFile = nodePath.join(tmpDir, watchFile).replace(".ts", ".js"); // todo improve this
  const host = ts.createWatchCompilerHost(
    // @ts-ignore
    [nodePath.join(__dirname, watchFile)],
    {
      outDir: tmpDir,
      target: esTarget,
      esModuleInterop: true,
      module: "commonJs",
      allowJs: true,
      skipLibCheck: true
      // todo extend config from outside
      // todo wait for transpileOnly option: https://github.com/microsoft/TypeScript/issues/29651
    },
    sysConfig,
    ts.createSemanticDiagnosticsBuilderProgram,
    reportDiagnostic,
    // @ts-ignore
    diagnostic => {
      if (isOnChanged && onChanged && diagnostic.code === 6194) {
        onChanged(outFile);
        isOnChanged = false;
      } else {
        logger.debug(ts.formatDiagnostic(diagnostic, formatHost));
      }
    }
  );
  ts.createWatchProgram(host);
};
