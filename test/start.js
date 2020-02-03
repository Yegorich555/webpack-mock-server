/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line import/no-unresolved
const webpackMockServer = require("../lib/index.js").default;

webpackMockServer.use(
  // eslint-disable-next-line
  // @ts-ignore
  { use: () => {} },
  {
    verbose: true,
    entry: [], // ["test/webpack.mock2.ts"],
    tsConfigFileName: "test/tsconfig.json",
    compilerOptions: {
      skipLibCheck: true
    }
  }
);
