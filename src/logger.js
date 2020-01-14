const logger = {
  /**
   * @param {string} message
   * @param {string} uri
   * @param {any[]} optionalParams
   */
  info(message, uri, ...optionalParams) {
    console.info(
      `\nWebpackMockServer. ${message} \u001b[1m\u001b[34m${uri ||
        ""}\n\u001b[39m\u001b[22m`,
      ...optionalParams
    );
  },
  /**
   * @param {string} message
   * @param {string | undefined} [uri]
   * @param {any[]} optionalParams
   */
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
  /**
   * @param {string} message
   * @param {Error | undefined} [ex]
   * @param {any[]} optionalParams
   */
  error(message, ex, ...optionalParams) {
    console.error(
      "\x1b[31m", // set red color
      `\n\nWebpackMockServer. ${message}`,
      ex !== undefined ? ex : "",
      "\x1b[0m", // reset color
      "\n", // set new line
      ...optionalParams
    );
  },
  verbose: true // todo set via options
};

module.exports = logger;
