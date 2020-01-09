const logger = {
  info(message: string, uri: string): void {
    console.info(
      `\n\nWebpackMockServer. ${message} \u001b[1m\u001b[34m${uri ||
        ""}\n\u001b[39m\u001b[22m`
    );
  },
  error(message: string, ex: Error | undefined = undefined): void {
    console.error(
      "\x1b[31m", // set red color
      `\n\nWebpackMockServer. ${message}`,
      ex !== undefined ? ex : "",
      "\x1b[0m", // reset color
      "\n" // set new line
    );
  }
};

export default logger;
