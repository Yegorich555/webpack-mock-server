import { spawn } from "child_process";
import fs from "fs";
import nodePath from "path";
import readline from "readline";
import ts from "typescript";
import clearNodeCache from "./clearNodeCache";
import CompilerOutRootFiles, { OutputMockFile } from "./compilerOutRootFiles";
import log from "./log";
import { CompilerOptions } from "./mockServerOptions";
import VersionContainer, { nodeJsVer } from "./versionContainer";

/** Result of parsing tsconfig.json via Typescript API */
interface ParsedConfig {
  fileNames: readonly string[];
  options: {
    paths?: Record<string, string[]>;
    /** Folder of tsconfig.json where 'paths' is defined */
    pathsBasePath?: string;
  };
}

const emptyConfig: ParsedConfig = { fileNames: [], options: {} };

interface ConfigParser {
  parse: (configFileName: string) => ParsedConfig;
  close: () => void;
}

/** Typescript JS API (TS < 7) */
interface LegacyTypeScript {
  sys: object;
  getParsedCommandLineOfConfigFile: (configFileName: string, optionsToExtend: undefined, host: object) => ParsedConfig | undefined;
  /** Internal API. Enum-like options have 'type' as Map<tsconfigValue, apiValue> */
  optionDeclarations?: { name: string; type: unknown; element?: { type: unknown } }[];
}

const legacyTs = ts as unknown as LegacyTypeScript;

/** Converts ts.CompilerOptions (enums like ts.ModuleKind.CommonJS, lib like 'lib.es2020.d.ts') to tsconfig format. Possible for TS < 7 only */
function toTsConfigOptions(options: CompilerOptions): CompilerOptions {
  const declarations = legacyTs.optionDeclarations;
  if (!declarations) {
    return options;
  }

  const toTsConfigValue = (type: unknown, value: unknown): unknown => {
    if (!(type instanceof Map) || type.has(value)) {
      return value;
    }
    const found = Array.from(type.entries()).find(([, apiValue]) => apiValue === value);
    return found ? found[0] : value;
  };
  const result: CompilerOptions = {};
  Object.keys(options).forEach((name) => {
    const value = options[name];
    const declaration = declarations.find((d) => d.name === name);
    if (!declaration) {
      result[name] = value;
    } else if (declaration.element && Array.isArray(value)) {
      const elementType = declaration.element.type;
      result[name] = value.map((v) => toTsConfigValue(elementType, v));
    } else {
      result[name] = toTsConfigValue(declaration.type, value);
    }
  });
  return result;
}

/** TS 7+ doesn't provide JS API anymore: tsconfig can be parsed only via 'unstable' API */
function createConfigParser(tsVer: number): ConfigParser {
  if (tsVer >= 7) {
    // eslint-disable-next-line global-require, import/no-unresolved, @typescript-eslint/no-var-requires
    const { API } = require("typescript/unstable/sync");
    const api = new API({ cwd: process.cwd() });
    return {
      parse: (configFileName) => api.parseConfigFile(configFileName),
      close: () => api.close(),
    };
  }

  const host = {
    ...legacyTs.sys,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onUnRecoverableConfigFileDiagnostic: (): void => {}, // errors are reported by tsc itself
  };
  return {
    parse: (configFileName) => legacyTs.getParsedCommandLineOfConfigFile(configFileName, undefined, host) || emptyConfig,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    close: (): void => {},
  };
}

/** Returns command for running tsc: TS 7+ is a native executable, older versions are node-scripts */
function getTscCommand(tsVer: number): string[] {
  const tsDir = nodePath.dirname(require.resolve("typescript/package.json"));
  if (tsVer < 7) {
    return [process.execPath, nodePath.join(tsDir, "lib", "tsc.js")];
  }

  // the same as 'typescript/lib/getExePath.js' does. 'typescript/bin/tsc' isn't used because it runs tsc in one more process that isn't killed on Windows
  const platformPackage = `@typescript/typescript-${process.platform}-${process.arch}`;
  try {
    const platformPackageDir = nodePath.dirname(require.resolve(`${platformPackage}/package.json`, { paths: [tsDir] }));
    return [nodePath.join(platformPackageDir, "lib", process.platform === "win32" ? "tsc.exe" : "tsc")];
  } catch (ex) {
    throw new Error(
      `WebpackMockServer. Unable to resolve ${platformPackage}. Either your platform is unsupported, or you are missing the package on disk`
    );
  }
}

function isFile(path: string): boolean {
  try {
    return fs.statSync(path).isFile();
  } catch (ex) {
    return false;
  }
}

/** Returns matched key of 'paths' and value replaced by '*'. The same as Typescript does: exact match or pattern with the longest prefix */
function matchPathAlias(moduleName: string, paths: Record<string, string[]>): { key: string; star: string } | undefined {
  if (Object.prototype.hasOwnProperty.call(paths, moduleName)) {
    return { key: moduleName, star: "" };
  }

  let matched: { key: string; star: string } | undefined;
  Object.keys(paths).forEach((key) => {
    const iStar = key.indexOf("*");
    if (iStar === -1 || (matched && matched.key.indexOf("*") >= iStar)) {
      return;
    }
    const prefix = key.substring(0, iStar);
    const suffix = key.substring(iStar + 1);
    if (moduleName.length >= prefix.length + suffix.length && moduleName.startsWith(prefix) && moduleName.endsWith(suffix)) {
      matched = { key, star: moduleName.substring(prefix.length, moduleName.length - suffix.length) };
    }
  });
  return matched;
}

// todo import alias doesn't work https://github.com/microsoft/TypeScript/issues/26722
/* Resolve alias-paths to compiled files in outDir */
function resolvePathAlias(moduleName: string, config: ParsedConfig, rootDir: string, outDir: string): string | undefined {
  const { paths } = config.options;
  if (!paths) {
    return undefined;
  }
  const matched = matchPathAlias(moduleName, paths);
  if (!matched) {
    return undefined;
  }

  const pathsBasePath = config.options.pathsBasePath || rootDir;
  const candidates = paths[matched.key].map((p) => {
    // p is relative to pathsBasePath; resolve it to an absolute source path,
    // then compute its position relative to rootDir, then join with outDir
    const absoluteSourcePath = nodePath.resolve(pathsBasePath, p.replace("*", matched.star));
    const outPath = nodePath.join(outDir, nodePath.relative(rootDir, absoluteSourcePath)).replace(/\.([cm]?)tsx?$/, ".$1js");
    return [outPath, `${outPath}.js`, nodePath.join(outPath, "index.js")];
  });
  return ([] as string[]).concat(...candidates).find(isFile);
}

const sourceExtensions: Record<string, string[]> = {
  ".cjs": [".cts", ".cjs"],
  ".mjs": [".mts", ".mjs"],
};

/** Returns source file of the emitted one */
function getSourceFileName(outFileName: string, rootDir: string, outDir: string): string {
  const absolutePath = nodePath.join(rootDir, nodePath.relative(outDir, outFileName));
  const { dir, name, ext } = nodePath.parse(absolutePath);
  const found = (sourceExtensions[ext] || [".ts", ".tsx", ".js", ".jsx"])
    .map((e) => nodePath.join(dir, name + e))
    .find((p) => fs.existsSync(p));
  return found || absolutePath;
}

// https://github.com/microsoft/typescript-go
export default function compiler(
  entry: string | string[] | undefined,
  tsConfigFileName: string,
  extendCompilerOptions: CompilerOptions,
  onChanged: (OutputMockFiles: OutputMockFile[]) => void
): void {
  const tsVer = Number.parseFloat(ts.versionMajorMinor);
  if (tsVer < 6) {
    throw new Error(`WebpackMockServer. Typescript version >=6.0 is expected. Current is ${ts.versionMajorMinor}`);
  }
  log.debug(`typescript version: ${ts.version}`);

  const entries = entry && (Array.isArray(entry) ? entry : [entry]);
  entries &&
    entries.forEach((v) => {
      if (typeof v !== "string") {
        throw new Error(`WebpackMockServer. Option [entry]. Only 'string' is expected: ${v}`);
      }
      if (v.includes("*")) {
        throw new Error(
          `WebpackMockServer. Option [entry]. Wildcard is not supported. Set 'Null' to [entry] and use tsConfig.json with 'files' and 'include' options instead.
           More details here: https://github.com/Yegorich555/webpack-mock-server#options`
        );
      }
    });
  const definedRootNames = entries && entries.length ? entries : undefined;

  const tscCommand = getTscCommand(tsVer);
  const rootDir = extendCompilerOptions.rootDir as string;
  const outDir = extendCompilerOptions.outDir as string;

  // tsc accepts options only via config-file. So the one that extends [tsConfigFileName] is created
  const tsConfigPath = nodePath.resolve(tsConfigFileName);
  const isTsConfigExists = fs.existsSync(tsConfigPath);
  if (!isTsConfigExists) {
    log.debug(`file ${tsConfigFileName} is not found. Compilation with default settings...`);
  }
  // skip watching node_modules (TS 7.0 ignores it yet). Pattern is absolute because relative ones are resolved from the created config-file in outDir
  const nodeModulesPattern = `${nodePath.parse(rootDir).root}**/node_modules`;
  const outTsConfigPath = nodePath.join(outDir, "tsconfig.json");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    outTsConfigPath,
    JSON.stringify(
      {
        extends: isTsConfigExists ? tsConfigPath : undefined,
        compilerOptions: toTsConfigOptions(extendCompilerOptions),
        ...(definedRootNames && { files: definedRootNames.map((v) => nodePath.resolve(v)), include: [] }),
        watchOptions: {
          excludeDirectories: [nodeModulesPattern],
          excludeFiles: [`${nodeModulesPattern}/**/*`],
        },
      },
      null,
      2
    )
  );

  let configParser: ConfigParser | undefined;
  function parseConfig(): ParsedConfig {
    try {
      configParser = configParser || createConfigParser(tsVer);
      return configParser.parse(outTsConfigPath);
    } catch (ex) {
      log.error(`Unable to parse ${tsConfigFileName}. Path-alias and 'include' section are ignored`, ex as Error);
      return emptyConfig;
    }
  }

  let isFirstCompile = true;
  let emittedFiles: string[] = [];

  const outMockFiles = new CompilerOutRootFiles();
  const nodePathJson = JSON.stringify(process.env.NODE_PATH || "");

  // output is placed into tmp-folder, so paths relative to the source file must be resolved
  function fixEmittedFile(path: string, config: ParsedConfig): void {
    if (!/\.[cm]?js$/.test(path)) {
      return;
    }

    const data = fs.readFileSync(path, "utf8");
    const sourceFileName = getSourceFileName(path, rootDir, outDir);
    const fixed = data
      .replace(/(?<![/).])__dirname/g, `String.raw\`${nodePath.dirname(sourceFileName)}\``)
      .replace(/(?<![/).])__filename/g, `String.raw\`${sourceFileName}\``)
      .replace(/require\(["']([^./\\][^"'\n\r]*)["']\)/g, (_str, mPath: string) => {
        const resolvedPath = JSON.stringify(resolvePathAlias(mPath, config, rootDir, outDir) || mPath);
        return `require(require.resolve(${resolvedPath}, {paths:[process.cwd(), ${nodePathJson}]} ))`;
      });
    if (fixed !== data) {
      fs.writeFileSync(path, fixed);
    }
  }

  function onCompiled(): void {
    const config = parseConfig();
    const rootNames = definedRootNames || config.fileNames;
    const isRootNamesChanged = outMockFiles.update(rootNames, rootDir, outDir);
    log.debug("defined root names", "", rootNames);
    log.debug("TS options", "", config.options);

    const isOutputChanged = isFirstCompile || isRootNamesChanged || emittedFiles.length > 0;
    isFirstCompile = false;
    emittedFiles.forEach((path) => {
      log.debug("write", path);
      try {
        fixEmittedFile(path, config);
      } catch (ex) {
        log.error(`Unable to fix emitted file ${path}`, ex as Error);
      }
    });
    emittedFiles = [];

    if (isOutputChanged) {
      clearNodeCache(outDir);
      onChanged(outMockFiles.files.filter((f) => !f.rootName.endsWith(".d.ts")));
    }
  }

  // diagnostic can take several lines: the 1st one contains error-code and the next ones have indent
  let diagnosticLines: string[] = [];
  function reportDiagnostic(): void {
    if (diagnosticLines.length) {
      log.error(diagnosticLines.join("\n"));
      diagnosticLines = [];
    }
  }

  function onOutputLine(line: string): void {
    if (diagnosticLines.length && /^\s+\S/.test(line)) {
      diagnosticLines.push(line);
      return;
    }
    reportDiagnostic();

    if (line.startsWith("TSFILE: ")) {
      emittedFiles.push(line.substring("TSFILE: ".length).trim());
      return;
    }
    // status message with time: '10:00:00 AM - Found 0 errors. Watching for file changes.'
    if (line.endsWith("Watching for file changes.")) {
      log.debug(line);
      onCompiled();
      return;
    }
    const m = /^(.+)\((\d+),(\d+)\): error (TS\d+): (.*)$/.exec(line);
    if (m) {
      diagnosticLines = [`${m[4]}: in ${m[1]} (${m[2]},${m[3]})`, m[5]];
    } else if (/^error TS\d+: /.test(line)) {
      diagnosticLines = [line];
    } else if (line) {
      log.debug(line);
    }
  }

  log.debug("starting typescript compiler", "", tscCommand);
  const [tscExe, ...tscArgs] = tscCommand;
  const program = spawn(
    tscExe,
    [
      ...tscArgs,
      "--project",
      outTsConfigPath,
      "--watch",
      "--preserveWatchOutput",
      "--listEmittedFiles",
      "--pretty",
      "false",
      "--locale",
      "en", // output is parsed so it must be in english
    ],
    { stdio: ["ignore", "pipe", "pipe"], windowsHide: true }
  );

  readline.createInterface({ input: program.stdout, crlfDelay: Infinity }).on("line", onOutputLine);
  program.stderr.setEncoding("utf8");
  program.stderr.on("data", (chunk: string) => log.error(chunk));
  program.on("error", (err) => log.error("Unable to start typescript compiler", err));

  /*
   *  self-destroying
   */

  // clearing previous tmp-folder before exit
  function clearTmpOutput(): void {
    log.debug("clearing tmp folder ", outDir);
    // recursive option is experimental and supported in node >= v12.10.0: https://nodejs.org/api/fs.html#fs_fs_rmdir_path_options_callback
    try {
      fs.rmSync(outDir, {
        recursive: true,
      });
      // eslint-disable-next-line no-empty
    } catch (ex) {
      const nodeJsRequired = new VersionContainer("12.10.0");
      if (nodeJsVer > nodeJsRequired) log.error("error in clearing tmp folder", ex as Error);
    }
  }

  // prevent double firing event
  let closed = false;
  function close(): void {
    if (closed) {
      return;
    }
    closed = true;
    program.kill();
    configParser && configParser.close();
    clearTmpOutput();
  }

  program.on("exit", (code) => {
    if (!closed) {
      log.error(`Typescript compiler is stopped with code ${code}`);
    }
  });

  // tsc is running in a separate process that must be stopped together with the current one
  process.on("exit", close);
  const signals: Array<NodeJS.Signals> = ["SIGINT", "SIGTERM"];
  signals.forEach((s) => {
    process.on(s, () => {
      close();
      process.exit();
    });
  });
}
