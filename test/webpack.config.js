/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const webpackMockServer = require("../lib/index");

/** @type {import('webpack').Configuration} */
module.exports = {
  entry: path.resolve(__dirname, "./webpackEntry"),
  stats: { children: false },
  mode: "development",
  devServer: {
    historyApiFallback: true, // it enables HTML5 mode: https://developer.mozilla.org/en-US/docs/Web/API/History
    devMiddleware: {
      stats: {
        children: false, // disable console.info for node_modules/*
        modules: false,
      },
    },
    static: {
      directory: __dirname, // folder with static content
      publicPath: __dirname,
    },
    setupMiddlewares: (middlewares, devServer) => {
      webpackMockServer.use(devServer.app, {
        entry: "test/webpack.mock.ts",
        tsConfigFileName: "test/tsconfig.json",
        verbose: true,
        logResponses: true,
        port: (devServer.options.port || 8080) + 1,
      });
      return middlewares;
    },
  },
};
