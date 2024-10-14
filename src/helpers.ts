/* eslint-disable no-inner-declarations */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-param-reassign */
import log from "./log";

export function tryParseDate(value: any): any {
  if (typeof value !== "string" || value.length < 19 || value.length > 27) return value;

  if (/^(\d{4})-(\d{2})-(\d{2})T(\d{2})\:(\d{2}):(\d{2})/.test(value)) {
    const v = Date.parse(value);
    if (!Number.isNaN(v)) return new Date(v);
  }

  return value;
}

export function tryParseJSONDate(obj: any): any {
  try {
    function map(v: any) {
      if (!v) return v;
      const t = typeof v;
      if (t === "string") {
        return tryParseDate(v);
      }
      if (t !== "object" || v instanceof Date) return v;

      if (Array.isArray(v)) {
        for (let i = 0; i < v.length; ++i) {
          v[i] = map(v[i]);
        }
      } else {
        // object
        const keys = Object.keys(v);
        for (let i = 0; i < keys.length; ++i) {
          const key = keys[i];
          v[key] = map(v[key]);
        }
      }

      return v;
    }

    return map(obj);
  } catch (err) {
    log.error("Failed parsing json-date", err as Error);
    return obj;
  }
}

export function parsePrimitives(v: unknown) {
  try {
    if (v == null) {
      return null;
    }
    if (Array.isArray(v)) {
      v.forEach((_, i) => {
        v[i] = parsePrimitives(v[i]);
      });
      return v;
    }
    if (typeof v === "object") {
      Object.keys(v).forEach((k) => {
        (v as any)[k] = parsePrimitives((v as any)[k]);
      });
      return v;
    }
    if (v === "true") return true;
    if (v === "false") return false;
    if (v === "null") return null;

    const num = Number(v);
    if (!Number.isNaN(num)) return num;

    return tryParseJSONDate(v);
  } catch (err) {
    log.error("Failed parsing form-data primitives", err as Error);
    return v;
  }
}
