import ts from "typescript";
import nodePath from "path";
import fs from "fs";
import os from "os";
import log from "./log";
import VersionContainer, { nodeJsVer } from "./versionContainer";
import { OutputMockFile } from "./outputMockFile";

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

// https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API#writing-an-incremental-program-watcher
export default function compiler(
  rootFiles: string[] | undefined,
  tsConfigFileName: string,
  extendCompilerOptions: ts.CompilerOptions,
  onChanged: (OutputMockFiles: OutputMockFile[], outDir: string) => void
): void {
  const tsVer = Number.parseFloat(ts.versionMajorMinor);
  if (tsVer < 2.7) {
    throw new Error(
      `WebpackMockServer. Typescript version >=2.7 is expected. Current is ${ts.versionMajorMinor}`
    );
  }
  log.debug(`typescript version: ${ts.version}`);

  // creating hooks
  let isOutputChanged = true;

  let outFiles: OutputMockFile[] = [];

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

    // mark output-server-required-file as exists
    const normPath = nodePath.normalize(path);
    const f = outFiles.find(v => v.path === normPath);
    if (f) {
      f.exists = true;
    }

    // fix 'import from node_modules' when file is moved into temp-dir
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

  const options = {
    ...extendCompilerOptions,
    outDir: tmpDir
    // todo wait for transpileOnly option: https://github.com/microsoft/TypeScript/issues/29651
  } as ts.CompilerOptions;

  const host = ts.createWatchCompilerHost(
    tsConfigFileName,
    options,
    sysConfig,
    ts.createEmitAndSemanticDiagnosticsBuilderProgram,
    reportDiagnostic,
    diagnostic => {
      if (isOutputChanged && onChanged && diagnostic.code === 6194) {
        onChanged(
          outFiles.filter(v => v.exists),
          tmpDir
        );
        isOutputChanged = false;
      } else {
        log.debug(ts.formatDiagnostic(diagnostic, formatHost));
      }
    }
  );

  const origCreateProgram = host.createProgram;
  host.createProgram = function hookCreateProgram(
    rootNames,
    tsOptions
  ): ts.EmitAndSemanticDiagnosticsBuilderProgram {
    let definedRootNames = rootNames || [];

    if (rootFiles && rootFiles.length) {
      // overwritting rootNames
      arguments[0] = rootFiles.map(rootFile =>
        nodePath.join(process.cwd(), rootFile)
      );
      // eslint-disable-next-line prefer-destructuring
      definedRootNames = arguments[0] as string[];
    }

    /* mapping entries to outFileNames */

    if (!definedRootNames.length) {
      if (outFiles.length) {
        isOutputChanged = true;
      }
      outFiles = [];
    } else {
      // remove output files that was deleted
      outFiles.forEach((v, i) => {
        if (!definedRootNames.includes(v.rootName)) {
          isOutputChanged = true;
          outFiles.splice(i, 1);
        }
      });
      // add new rootNames
      definedRootNames.forEach(rootName => {
        const ePath = rootName.replace(/(.ts)$/, ".js");
        const outPath = nodePath.join(
          tmpDir,
          nodePath.relative(tsOptions?.rootDir || process.cwd(), ePath)
        );
        if (!outFiles.find(f => f.path === outPath)) {
          outFiles.push({ path: outPath, exists: false, rootName });
        }
      });
    }
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
