import ts from "typescript";
import nodePath from "path";
import fs from "fs";
import os from "os";
import log from "./log";
import VersionContainer, { nodeJsVer } from "./versionContainer";

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

// https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API#writing-an-incremental-program-watcher
export default function compiler(
  rootFile: string, // todo use files from tsConfigFileName ?
  tsConfigFileName: string,
  extendCompilerOptions: ts.CompilerOptions,
  onChanged: (outPath: string) => void
): void {
  const tsVer = Number.parseFloat(ts.versionMajorMinor);
  if (tsVer < 2.7) {
    throw new Error(
      `WebpackMockServer. Typescript version >=2.7 is expected. Current is ${ts.versionMajorMinor}`
    );
  }
  log.debug(`typescript version: ${ts.version}`);

  // creating hooks
  let isOnChanged = true;

  const emptyWatcher: ts.FileWatcher = {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    close: (): void => {}
  };

  const sysConfig: ts.System = {
    ...ts.sys
  };

  sysConfig.watchFile = function watchFile(path: string): ts.FileWatcher {
    if (path.includes("node_modules")) {
      // todo use tsconfig.json exclude
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
    log.debug("write", path);
    isOnChanged = true;
    // @ts-ignore
    return ts.sys.writeFile(...arguments);
  };

  sysConfig.readFile = function readFile(path: string): string | undefined {
    log.debug("read", path);
    // @ts-ignore
    const result = ts.sys.readFile(...arguments);
    if (!result && path === tsConfigFileName) {
      log.debug(
        `file ${tsConfigFileName} is not found. Compilation with default settings...`
      );
      return JSON.stringify({});
    }
    return result;
  };

  const tmpDir = nodePath.join(
    os.tmpdir(),
    "webpack-mock-server",
    new Date().getTime().toString()
  );

  const entryPoint = nodePath.join(process.cwd(), rootFile);

  const outFile = nodePath.join(
    tmpDir,
    `${nodePath.basename(entryPoint, nodePath.extname(entryPoint))}.js`
  );

  const host = ts.createWatchCompilerHost(
    tsConfigFileName,
    {
      ...extendCompilerOptions,
      // todo target can conflict with lib
      outDir: tmpDir
      // todo wait for transpileOnly option: https://github.com/microsoft/TypeScript/issues/29651
    } as ts.CompilerOptions,
    sysConfig,
    ts.createEmitAndSemanticDiagnosticsBuilderProgram,
    reportDiagnostic,
    diagnostic => {
      if (isOnChanged && onChanged && diagnostic.code === 6194) {
        onChanged(outFile);
        isOnChanged = false;
      } else {
        log.debug(ts.formatDiagnostic(diagnostic, formatHost));
      }
    }
  );

  const origCreateProgram = host.createProgram;
  host.createProgram = function hookCreateProgram(): ts.EmitAndSemanticDiagnosticsBuilderProgram {
    arguments[0] = [entryPoint]; // overwrite rootNames
    // @ts-ignore
    return origCreateProgram(...arguments);
  };

  const program = ts.createWatchProgram(host);

  /*
   *  self-destroying
   */

  // clearing previous tmp-folder before exit
  function clearTmpOutput(): void {
    log.debug("clearing tmp folder ", tmpDir);
    // recursive option is expiremental and supported in node >= v12.10.0: https://nodejs.org/api/fs.html#fs_fs_rmdir_path_options_callback
    try {
      fs.rmdirSync(tmpDir, {
        recursive: true
      });
      // eslint-disable-next-line no-empty
    } catch (ex) {
      const nodeJsRequired = new VersionContainer("12.10.0");
      if (nodeJsVer > nodeJsRequired)
        log.error("error in clearing tmp folder", ex);
    }
  }

  // prevent double firing event
  let closed = false;
  function close(): void {
    if (closed) {
      return;
    }
    program && program.close();
    clearTmpOutput();
    closed = true;
  }

  process.on("SIGINT", close); // handle termination by Ctrl+C
  process.on("beforeExit", close);
}
