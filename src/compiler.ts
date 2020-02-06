import ts from "typescript";
import fs from "fs";
import nodePath from "path";
import log from "./log";
import VersionContainer, { nodeJsVer } from "./versionContainer";
import CompilerOutRootFiles, { OutputMockFile } from "./compilerOutRootFiles";

const formatHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: path => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine
};

function reportDiagnostic(diagnostic: ts.Diagnostic): void {
  let linePointer = "";
  if (diagnostic.file) {
    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
      diagnostic.start || 0
    );
    linePointer = `in ${diagnostic.file?.fileName} (${line + 1},${character +
      1})`;
  }
  log.error(
    `TS${diagnostic.code}: ${linePointer}\n${ts.flattenDiagnosticMessageText(
      diagnostic.messageText,
      formatHost.getNewLine()
    )}`
  );
}

/** Clear Node cache for files in tmpFolder */
function clearNodeCache(rootPath: string): void {
  Object.keys(require.cache).forEach(key => {
    if (require.cache[key].filename.startsWith(rootPath)) {
      log.debug("delete node-cache for", key);
      delete require.cache[key];
    }
  });
}

// https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API#writing-an-incremental-program-watcher
export default function compiler(
  entry: string | string[] | undefined,
  tsConfigFileName: string,
  extendCompilerOptions: ts.CompilerOptions,
  onChanged: (OutputMockFiles: OutputMockFile[]) => void
): void {
  const tsVer = Number.parseFloat(ts.versionMajorMinor);
  if (tsVer < 2.7) {
    throw new Error(
      `WebpackMockServer. Typescript version >=2.7 is expected. Current is ${ts.versionMajorMinor}`
    );
  }
  log.debug(`typescript version: ${ts.version}`);

  const entries = entry && (Array.isArray(entry) ? entry : [entry]);
  entries &&
    entries.forEach(v => {
      if (typeof v !== "string") {
        throw new Error(
          `WebpackMockServer. Option [entry]. Only 'string' is expected: ${v}`
        );
      }
      if (v.includes("*")) {
        throw new Error(
          `WebpackMockServer. Option [entry]. Wildcard is not supported. Set 'Null' to [entry] and use tsConfig.json with 'files' and 'include' options instead.
           More details here: https://github.com/Yegorich555/webpack-mock-server#options`
        );
      }
    });

  // creating hooks
  let isOutputChanged = true;

  const outMockFiles = new CompilerOutRootFiles();

  const emptyWatcher: ts.FileWatcher = {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    close: (): void => {}
  };

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

  sysConfig.writeFile = function writeFile(path: string, data: string): void {
    log.debug("write", path);
    isOutputChanged = true;

    if (data) {
      arguments[1] = data.replace(
        /require\(["']([^./\\][^\n\r]+)["']\)/g,
        (_str, matchGroup1: string) =>
          `require(require.resolve("${matchGroup1}", {paths:[process.cwd(), "${process.env.NODE_PATH}"]} ))`
      );
    }
    // @ts-ignore
    return ts.sys.writeFile(...arguments);
  };

  sysConfig.readFile = function readFile(path: string): string | undefined {
    log.debug("read", path);
    // @ts-ignore
    const data = ts.sys.readFile(...arguments);
    if (!data && path === tsConfigFileName) {
      log.debug(
        `file ${tsConfigFileName} is not found. Compilation with default settings...`
      );
      return JSON.stringify({});
    }
    if (!data || path.includes("node_modules")) {
      return data;
    }
    return data
      .replace(/(?<![/).])__dirname/g, `"${nodePath.dirname(path)}"`)
      .replace(/(?<![/).])__filename/g, `"${path}"`);
  };

  const host = ts.createWatchCompilerHost(
    tsConfigFileName,
    extendCompilerOptions,
    sysConfig,
    ts.createEmitAndSemanticDiagnosticsBuilderProgram,
    reportDiagnostic,
    diagnostic => {
      if (isOutputChanged && onChanged && diagnostic.code === 6194) {
        clearNodeCache(extendCompilerOptions.outDir as string);
        onChanged(outMockFiles.files);
        isOutputChanged = false;
      } else {
        log.debug(ts.formatDiagnostic(diagnostic, formatHost));
      }
    }
  );

  const origCreateProgram = host.createProgram;
  host.createProgram = function hookCreateProgram(
    tsRootNames,
    allOptions
  ): ts.EmitAndSemanticDiagnosticsBuilderProgram {
    const definedRootNames = entries && entries.length ? entries : tsRootNames;
    arguments[0] = definedRootNames;
    const tsOptions = allOptions as ts.CompilerOptions;

    isOutputChanged = outMockFiles.update(
      definedRootNames,
      tsOptions.rootDir as string,
      tsOptions.outDir as string
    );

    log.debug("defined root names", "", definedRootNames);
    log.debug("TS options", "", tsOptions);
    // @ts-ignore
    return origCreateProgram(...arguments);
  };

  const program = ts.createWatchProgram(host);
  /*
   *  self-destroying
   */

  // clearing previous tmp-folder before exit
  function clearTmpOutput(): void {
    log.debug("clearing tmp folder ", extendCompilerOptions.outDir);
    // recursive option is expiremental and supported in node >= v12.10.0: https://nodejs.org/api/fs.html#fs_fs_rmdir_path_options_callback
    try {
      fs.rmdirSync(extendCompilerOptions.outDir as string, {
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
