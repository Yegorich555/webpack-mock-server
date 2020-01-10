/* eslint-disable @typescript-eslint/no-var-requires */
const webpackMockServer = require("../lib/index.js");

module.exports = {
  stats: { children: false },
  devServer: {
    historyApiFallback: true, // it enables HTML5 mode: https://developer.mozilla.org/en-US/docs/Web/API/History
    stats: {
      children: false // disable console.info for node_modules/*
    },
    // contentBase: "./public", // folder with static content
    // watchContentBase: true, // enable hot-reload by changes in contentBase folder
    before: webpackMockServer.use
  }
};
