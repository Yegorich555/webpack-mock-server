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
    Typescript compiler options (default options impossible to override) 
    that override readed one from tsconfig.json
   */
  compilerOptions: ts.CompilerOptions = {
    module: ts.ModuleKind.CommonJS,
    skipLibCheck: true,
    declaration: false,
    moduelResolution: ModuleResolutionKind.NodeJs,
    target: defineTarget()
  };

  /**
    Typescript config file (used for compilation [entry] files)    
   */
  tsConfigFileName = "tsconfig.json";

  /**
   * Entry points for typescript-compiler
   */
  entry = ["webpack.mock.ts"];
  // todo json-files support
}

export default MockServerOptions;

export const defOptions = new MockServerOptions();
