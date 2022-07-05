/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line import/no-unresolved
const express = require("express");
const webpackMockServer = require("../lib/index");

const app = express();

webpackMockServer.use(app, {
  verbose: true,
  entry: [], // ["test/webpack.mock2.ts"],
  tsConfigFileName: "test/tsconfig.json",
  compilerOptions: {
    skipLibCheck: true,
  },
  before: (req, res, next) => {
    console.log(`Got request: ${req.method} ${req.url}`);
    next();
    console.log(`Sent response: ${req.method} ${req.url}`);
  },
});

let server = app.listen(1782);

function close() {
  server && server.close();
  server = undefined;
}

process.on("SIGINT", close); // handle termination by Ctrl+C
process.on("beforeExit", close);
