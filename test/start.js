/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line import/no-unresolved
const webpackMockServer = require("../lib/index.js");

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
    },
    before: (req, res, next) => {
      console.log(`Got request: ${req.method} ${req.url}`);
      next();
      console.log(`Sent response: ${req.method} ${req.url}`);
    }
  }
);
