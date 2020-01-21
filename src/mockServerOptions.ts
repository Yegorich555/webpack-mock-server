import ts, { ModuleResolutionKind } from "typescript";

class MockServerOptions {
  verbose = false;

  port = 8079;

  compilerOptions: ts.CompilerOptions = {
    esModuleInterop: true,
    module: ts.ModuleKind.CommonJS,
    allowJs: true, // update files accroding to this
    skipLibCheck: true,
    moduelResolution: ModuleResolutionKind.NodeJs
  };

  entry = "webpack.mock.ts";
  // todo json-files support
}
export default MockServerOptions;

export const defOptions = new MockServerOptions();
