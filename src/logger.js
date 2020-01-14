const logger = {
  info(message, uri, ...optionalParams) {
    console.info(
      `\nWebpackMockServer. ${message} \u001b[1m\u001b[34m${uri ||
        ""}\n\u001b[39m\u001b[22m`,
      ...optionalParams
    );
  },
  debug(message, uri, ...optionalParams) {
    if (!this.verbose) {
      return;
    }
    console.info(
      `WebpackMockServer: ${message} \u001b[1m\u001b[34m${uri ||
        ""}\u001b[39m\u001b[22m`,
      ...optionalParams
    );
  },
  error(message, ex = undefined, ...optionalParams) {
    console.error(
      "\x1b[31m", // set red color
      `\n\nWebpackMockServer. ${message}`,
      ex !== undefined ? ex : "",
      "\x1b[0m", // reset color
      "\n", // set new line
      ...optionalParams
    );
  },
  verbose: true
};

module.exports = logger;
