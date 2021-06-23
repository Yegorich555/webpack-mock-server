/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const webpackMockServer = require("../lib/index.js");

/** @type {import('webpack').Configuration} */
module.exports = {
  entry: path.resolve(__dirname, "./webpackEntry"),
  stats: { children: false },
  devServer: {
    https: true,
    historyApiFallback: true, // it enables HTML5 mode: https://developer.mozilla.org/en-US/docs/Web/API/History
    stats: {
      children: false // disable console.info for node_modules/*
    },
    contentBase: __dirname,
    publicPath: __dirname,
    before: app =>
      webpackMockServer.use(app, {
        entry: "test/webpack.mock.ts",
        tsConfigFileName: "test/tsconfig.json",
        verbose: true,
        logResponses: true,
        port: 8080
      })
  }
};
