import nodePath from "path";

export type OutputMockFile = {
  path: string;
  rootName: string;
};

export default class CompilerOutRootFiles {
  files: OutputMockFile[] = [];

  /** Returns true if list of rootNames is changed */
  update(
    rootNames: readonly string[] | undefined,
    inDir: string,
    outDir: string
  ): boolean {
    let isChanged = false;
    if (!rootNames || !rootNames.length) {
      if (this.files.length) {
        isChanged = true;
      }
      this.files = [];
    } else {
      // remove output files that was deleted
      this.files.forEach((v, i) => {
        if (!rootNames.includes(v.rootName)) {
          isChanged = true;
          this.files.splice(i, 1);
        }
      });

      // add new rootNames
      rootNames.forEach((rootName) => {
        const ePath = rootName.replace(/([^.][^d])(\.ts)$/, "$1.js"); // replace only .ts to .js by skip d.ts
        const outPath = nodePath.join(outDir, nodePath.relative(inDir, ePath));
        if (!this.files.find((f) => f.path === outPath)) {
          isChanged = true;
          this.files.push({ path: outPath, rootName });
        }
      });
    }
    return isChanged;
  }
}
