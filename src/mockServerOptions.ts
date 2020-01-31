import ts, { ModuleResolutionKind } from "typescript";
import { nodeJsVer } from "./versionContainer";

function defineTarget(): ts.ScriptTarget {
  if (nodeJsVer.major >= 10) {
    return ts.ScriptTarget.ES2017;
  }
  if (nodeJsVer.major >= 6) {
    return ts.ScriptTarget.ES5;
  }
  return ts.ScriptTarget.ES3;
}

class MockServerOptions {
  /**
    Disable/enable console.log
   */
  verbose = false;

  /**
    Port for webpack-mock-server
   */
  port = 8079;

  /**
    Typescript compiler options that can be overrided by 'tsconfig.json'
   */
  compilerOptions: ts.CompilerOptions = {
    strictNullChecks: false,
    noImplicitAny: false,
    noUnusedLocals: false,
    noUnusedParameters: false,
    noEmitHelpers: false,
    skipLibCheck: true
  };

  /**
   * Typescript compiler options (default options impossible to override)
   * These options impossible to override
   */
  // eslint-disable-next-line class-methods-use-this
  get strictCompilerOptions(): ts.CompilerOptions {
    return {
      rootDir: process.cwd(),
      noEmit: false, // fix when 'jsconfig.json'
      module: ts.ModuleKind.CommonJS,
      declaration: false,
      moduelResolution: ModuleResolutionKind.NodeJs,
      target: defineTarget()
    } as ts.CompilerOptions;
  }

  /**
   * Typescript config file (used for compilation [entry] files)
   */
  tsConfigFileName = "tsconfig.json";

  /**
   * Entry points for typescript-compiler
   * If pointed an 'empty array' or 'undefined' entry will be defined
   * from [tsConfigFileName]: 'files' and 'includes' sections
   */
  entry: string[] | undefined = ["webpack.mock.ts"];
  // todo json-files support
}

export default MockServerOptions;

export const defOptions = new MockServerOptions();
