/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line import/no-unresolved
const webpackMockServer = require("../lib/index.js").default;

// eslint-disable-next-line @typescript-eslint/no-empty-function
webpackMockServer.use({ use: () => {} }, { verbose: true });
