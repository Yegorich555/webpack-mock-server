import nodePath from "path";

export type OutputMockFile = {
  path: string;
  rootName: string;
};

export default class CompilerOutRootFiles {
  files: OutputMockFile[] = [];

  update(
    rootNames: readonly string[] | undefined,
    inDir: string,
    outDir: string
  ): boolean {
    let isOutputChanged = false; // improve this
    if (!rootNames || !rootNames.length) {
      if (this.files.length) {
        isOutputChanged = true;
      }
      this.files = [];
    } else {
      // remove output files that was deleted
      this.files.forEach((v, i) => {
        if (!rootNames.includes(v.rootName)) {
          isOutputChanged = true;
          this.files.splice(i, 1);
        }
      });

      // add new rootNames
      rootNames.forEach(rootName => {
        const ePath = rootName.replace(/(.ts)$/, ".js");
        const outPath = nodePath.join(
          outDir,
          nodePath.relative(inDir || process.cwd(), ePath)
        );
        if (!this.files.find(f => f.path === outPath)) {
          this.files.push({ path: outPath, rootName });
        }
      });
    }
    return isOutputChanged;
  }
}
