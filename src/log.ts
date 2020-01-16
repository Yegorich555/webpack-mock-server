const log = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info(message: string, uri: string, ...optionalParams: any[]): void {
    console.info(
      `\nWebpackMockServer. ${message} \u001b[1m\u001b[34m${uri ||
        ""}\n\u001b[39m\u001b[22m`,
      ...optionalParams
    );
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug(message: string, uri = "", ...optionalParams: any[]): void {
    if (!this.verbose) {
      return;
    }
    console.info(
      `WebpackMockServer: ${message} \u001b[1m\u001b[34m${uri}\u001b[39m\u001b[22m`,
      ...optionalParams
    );
  },
  error(
    message: string,
    ex: Error | undefined = undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...optionalParams: any[]
  ): void {
    console.error(
      "\x1b[31m", // set red color
      `\n\nWebpackMockServer. ${message}`,
      ex || "",
      "\x1b[0m", // reset color
      "\n", // set new line
      ...optionalParams
    );
  },
  get verbose(): boolean {
    return process.env.webpackMockVerbose === "true";
  }
};

export default log;
