/* eslint-disable class-methods-use-this */
import ts, { ModuleResolutionKind } from "typescript";
import nodePath from "path";
import os from "os";
import express from "express";
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

const outDir: string = nodePath.join(
  os.tmpdir(),
  "webpack-mock-server",
  new Date().getTime().toString()
);

class MockServerOptions {
  /** Enable/disable console.log */
  verbose = false;

  /** Port for webpack-mock-server */
  port = 8079;

  /** Enable/disable console.log for requests */
  logRequests: boolean | ((req: express.Request) => void) = false;

  /** Enable/disable console.log for responses */
  logResponses: boolean | ((res: express.Response) => void) = false;

  /** Execute custom middleware prior to all other middleware internally within the server */
  before: express.RequestHandler | undefined;

  /** Typescript compiler options that override options from 'tsconfig.json' */
  compilerOptions: ts.CompilerOptions = {
    strictNullChecks: false,
    noImplicitAny: false,
    noUnusedLocals: false,
    noUnusedParameters: false,
    skipLibCheck: true,
    resolveJsonModule: true,
    // todo wait for transpileOnly option: https://github.com/microsoft/TypeScript/issues/29651
  };

  /** Must-have Typescript compiler options (impossible to override) */
  get strictCompilerOptions(): ts.CompilerOptions {
    return {
      outDir, // {os.tmpdir()}/webpack-mock-server/{new Date().getTime()};
      rootDir: process.cwd(),
      noEmit: false, // fix when 'jsconfig.json'
      noEmitHelpers: false,
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      declaration: false,
      moduelResolution: ModuleResolutionKind.NodeJs,
      target: defineTarget(),
    } as ts.CompilerOptions;
  }

  /** Typescript config file (used for compilation [entry] files) */
  tsConfigFileName = "tsconfig.json";

  /**
   * Entry points for typescript-compiler
   * If pointed an 'empty array' or 'undefined' entry will be defined
   * from [tsConfigFileName]: 'files','include' and 'exclude' sections
   */
  entry: string | string[] | undefined = ["webpack.mock.ts"];
}

export default MockServerOptions;

export const defOptions = new MockServerOptions();
