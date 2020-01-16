import ts from "typescript";
import nodePath from "path";
import fs from "fs";
import os from "os";
import log from "./log";

const formatHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: path => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine
};

function reportDiagnostic(diagnostic: ts.Diagnostic): void {
  log.error(
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

class VersionContainer {
  major: number;

  minor: number;

  patch: string | undefined;

  constructor(version: string) {
    const arr = version.split(/[v.]/g).filter(v => v !== "");
    this.major = Number.parseInt(arr[0], 10);
    this.minor = Number.parseInt(arr[1], 10);
    // eslint-disable-next-line prefer-destructuring
    this.patch = arr[2];
  }
}

// https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API#writing-an-incremental-program-watcher
export default function watchMain(
  rootFile: string,
  extendCompilerOptions: ts.CompilerOptions,
  onChanged: (outPath: string) => void
): void {
  const tsVer = Number.parseFloat(ts.versionMajorMinor);
  if (tsVer < 2.7) {
    throw new Error("WebpackMockServer. Typescript version >=2.7 is expected");
  }
  let isOnChanged = true;

  const emptyWatcher: ts.FileWatcher = {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    close: (): void => {}
  };

  // creating hooks
  const sysConfig: ts.System = {
    ...ts.sys
  };

  sysConfig.watchFile = function watchFile(path: string): ts.FileWatcher {
    if (path.includes("node_modules")) {
      return emptyWatcher;
    }
    // @ts-ignore
    return ts.sys.watchFile(...arguments);
  };

  sysConfig.watchDirectory = function watchDir(path: string): ts.FileWatcher {
    if (path.includes("node_modules")) {
      return emptyWatcher;
    }
    // @ts-ignore
    return ts.sys.watchDirectory(...arguments);
  };

  sysConfig.writeFile = function writeFile(path: string): void {
    // todo ignore writing by hash
    log.debug("write", path);
    isOnChanged = true;
    // @ts-ignore
    return ts.sys.writeFile(...arguments);
  };

  sysConfig.readFile = function readFile(path: string): string | undefined {
    log.debug("read", path);
    // @ts-ignore
    return ts.sys.readFile(...arguments);
  };

  // define es target
  const nodeJsVersion = new VersionContainer(process.version);
  let esTarget = ts.ScriptTarget.ES3;
  if (nodeJsVersion.major >= 10) {
    esTarget = ts.ScriptTarget.ES2017;
  } else if (nodeJsVersion.major >= 6) {
    esTarget = ts.ScriptTarget.ES5;
  }

  // define tmpDir
  const tmpDir = nodePath.join(
    os.tmpdir(),
    `webpack-mock-${new Date().getTime()}`
  );

  // clearing previous tmp-folder before exit
  function clearTmpOutput(): void {
    log.debug("clearing tmp folder ", tmpDir);
    // recursive option is expiremental and supported in node >= v12.10.0: https://nodejs.org/api/fs.html#fs_fs_rmdir_path_options_callback
    try {
      fs.rmdirSync(tmpDir, {
        recursive: true
      });
      // eslint-disable-next-line no-empty
    } catch (ex) {}
  }
  process.on("SIGINT", clearTmpOutput); // handle termination by Ctrl+C
  process.on("beforeExit", clearTmpOutput);

  const entryPoint = nodePath.join(__dirname, rootFile);

  const outFile = nodePath.join(
    tmpDir,
    `${nodePath.basename(entryPoint, nodePath.extname(entryPoint))}.js`
  );
  const host = ts.createWatchCompilerHost(
    [entryPoint],
    {
      esModuleInterop: true,
      allowJs: true,
      skipLibCheck: true,
      ...extendCompilerOptions,

      outDir: tmpDir,
      module: ts.ModuleKind.CommonJS,
      target: esTarget
      // todo wait for transpileOnly option: https://github.com/microsoft/TypeScript/issues/29651
    } as ts.CompilerOptions,
    sysConfig,
    ts.createSemanticDiagnosticsBuilderProgram,
    reportDiagnostic,
    diagnostic => {
      if (isOnChanged && onChanged && diagnostic.code === 6194) {
        // todo find a better way
        onChanged(outFile);
        isOnChanged = false;
      } else {
        log.debug(ts.formatDiagnostic(diagnostic, formatHost));
      }
    }
  );

  ts.createWatchProgram(host);
}
