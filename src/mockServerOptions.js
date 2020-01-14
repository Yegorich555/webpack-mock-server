/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-var-requires */
const ts = require("typescript");

class MockServerOptions {
  constructor() {
    this.verbose = true;
    this.port = 8079;
    /** @type {ts.CompilerOptions} */
    this.compilerOptions = {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      allowJs: true, // update files accroding to this
      skipLibCheck: true
    };
  }
}
module.exports = MockServerOptions;
module.exports.defOptions = new MockServerOptions();
