export default class VersionContainer {
  major: number;

  minor: number;

  patch: number;

  patchSuffix: string;

  constructor(version: string) {
    const arr = version.split(/[v.]/g).filter((v) => v !== "");
    this.major = Number.parseInt(arr[0], 10);
    this.minor = Number.parseInt(arr[1], 10);
    // eslint-disable-next-line prefer-destructuring
    this.patch = arr[2] ? Number.parseInt(arr[2], 10) : 0;
    this.patchSuffix = arr[2] ? arr[2].replace(this.patch.toString(), "") : "";
  }

  valueOf(): number {
    return Number.parseInt(this.major.toString() + this.minor.toString() + this.patch.toString(), 10);
  }
}

export const nodeJsVer = new VersionContainer(process.version);
