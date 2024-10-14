/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpackMockServer = require("../lib/index");

/** @type {import('webpack').Configuration} */
module.exports = {
  entry: path.resolve(__dirname, "./webpackEntry"),
  stats: { children: false },
  mode: "development",
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "./index.html"),
    }),
  ],
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  devServer: {
    hot: true,
    historyApiFallback: true, // it enables HTML5 mode: https://developer.mozilla.org/en-US/docs/Web/API/History
    watchFiles: ["src/**/*", "test/**/*"],
    devMiddleware: {
      stats: {
        children: false, // disable console.info for node_modules/*
        modules: false,
      },
    },
    static: {
      watch: true,
      directory: __dirname, // folder with static content
    },
    setupMiddlewares: (middlewares, devServer) => {
      // todo add 100ms timeouts otherwise prev-webpack versions could failed on port change
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
