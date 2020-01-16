// fix for error-extending in nodejs: https://github.com/nodejs/node/blob/4bec6d13f9e9068fba778d0c806a2ca1335c8180/lib/internal/errors.js#L545
export default interface NetError extends Error {
  errno: string;
  code: string;
  syscall: string;
  address: string;
  port: string | undefined;
}
