import { Application as ExpressApp } from "express";

type Route = {
  method: string;
  path: string;
};

type Stack = {
  route: StackRoute | undefined;
};

type StackRoute = {
  methods: Record<string, string>;
  path: string;
};

export default function provideRoutes(
  app: ExpressApp,
  exlcudePath: string
): Route[] {
  const routes: Route[] = [];

  function normalizeInfo(path: string, methods: Record<string, string>): void {
    if (path !== exlcudePath) {
      routes.push({
        method: Object.keys(methods)
          .filter(key => methods[key])
          .join(","),
        path
      });
    }
  }

  // eslint-disable-next-line no-underscore-dangle
  app._router.stack.forEach((r: Stack) => {
    if (r.route && r.route.path) {
      const { path } = r.route;
      const { methods } = r.route;
      if (Array.isArray(path)) {
        path.forEach(v => normalizeInfo(v, methods));
      } else {
        normalizeInfo(path, methods);
      }
    }
  });

  function stringCompare(v1: string, v2: string): number {
    return v1.localeCompare(v2, undefined, {
      sensitivity: "base",
      ignorePunctuation: true,
      numeric: true
    });
  }

  return routes.sort(
    (v1: Route, v2: Route) =>
      stringCompare(v1.method, v2.method) || stringCompare(v1.path, v2.path)
  );
}
