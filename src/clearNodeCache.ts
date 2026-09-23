import log from "./log";

/** Clear Node cache for files in tmpFolder */
export default function clearNodeCache(rootPath: string): void {
  Object.keys(require.cache).forEach((key) => {
    // filename can be undefined for cache-entries created by ESM loader (webpack-dev-server 6+ is ESM-only)
    if (require.cache[key]?.filename?.startsWith(rootPath)) {
      log.debug("delete node-cache for", key);
      delete require.cache[key];
    }
  });
}
