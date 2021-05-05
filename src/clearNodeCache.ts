import log from "./log";

export default function clearNodeCache(rootPath: string): void {
  Object.keys(require.cache).forEach(key => {
    if (require.cache[key]?.filename.startsWith(rootPath)) {
      log.debug("delete node-cache for", key);
      delete require.cache[key];
    }
  });
}
