# Webpack Mock Server

ExpressJs Middleware for webpack-dev-server with built-in hot-replacement (HMR) and typescript compiler.
Uses for mocking api responses

[![npm version](https://img.shields.io/npm/v/webpack-mock-server.svg?style=flat-square)](https://www.npmjs.com/package/webpack-mock-server)
[![install size](https://packagephobia.now.sh/badge?p=webpack-mock-server)](https://packagephobia.now.sh/result?p=webpack-mock-server)
[![npm downloads](https://img.shields.io/npm/dm/webpack-mock-server.svg?style=flat-square)](http://npm-stat.com/charts.html?package=webpack-mock-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- Typescript support (>=v2.7): supports **.js**, **.ts**, **.json** files
- ES6 export/import support
- Hot replacement support
- Does not require proxy-path-pattern (because this is middleware that pipes routes to splitted server without proxy-path-pattern)
- Can be used without webpack (because this is expressjs [middleware](http://expressjs.com/en/guide/using-middleware.html))
- Shows every configured response in user-friendly _index.html_ (just click on mock-server-url in console after as mockServer is started)

## Installing

Using npm (installing Typescript is required even if you don't use ts files):

```npm
npm i --save-dev webpack-mock-server typescript @types/express
```

## Examples

### Usage with defaults

```js
// webpack.config.js - ver 5+
const webpackMockServer = require("webpack-mock-server");

module.exports = {
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      webpackMockServer.use(devServer.app, {
         port: (devServer.options.port || 8080) + 1,
      });
      return middlewares;
    },
  },
};

// webpack.mock.ts - feel free to mock responses yourself
import webpackMockServer from "webpack-mock-server";
import nodePath from "path";

// app is express application
export default webpackMockServer.add((app, helper) => {
  // you can find more about express here: https://expressjs.com/
  app.get("/testGet", (_req, res) => {
    res.json("JS get-object can be here. Random int:" + helper.getRandomInt());
  });
  app.post("/testPost", (_req, res) => {
    res.json("JS post-object can be here");
  });

  // you can return any file easy. Example for json response from file:
  app.get("/testResponseFromJsonFile", (_req, res) => {
    res.sendFile(nodePath.join(__dirname, "./response.json"));
  });
});

// multiple exports are supported
export const result = webpackMockServer.add((app, helper) => {
  app.delete("/testDelete", (_req, res) => {
    res.json(
      "JS delete-object can be here. Random int:" + helper.getRandomInt()
    );
  });
  app.put("/testPut", (_req, res) => {
    res.json("JS put-object can be here");
  });
});
```

### Usage with multiple/custom entries (instead of default **webpack.mock.ts**)

```js
// webpack.config.js
const webpackMockServer = require("webpack-mock-server");

module.exports = {
  devServer: {
   setupMiddlewares: (middlewares, devServer) => {
        webpackMockServer.use(devServer.app, { // MockServerOptions here
          entry: [ // exact fileNames are expected (no wildcard or folder - use custom tsConfig instead)
              "api/users.mock.ts",
              "api/goods.mock.js"
          ],
          before: (req, res, next) => { // you can use this for custom-logging instead of logResponses: true, logRequests: true
              console.log(`Got request: ${req.method} ${req.url}`);
              res.once("finish", () => {
                 console.log(`Sent response: ${req.method} ${req.url}`);
               })
              next();
          }
      });
      return middlewares;
    }
  }
}

// api/users.mock.ts
... // take the example for ts-file above

// api/goods.mock.js
export default webpackMockServer.add((app, helper) => {
  app.get("/testGetGoods", (_req, res) => {
    res.json([{
        id: helper.getRandomInt(1, 999),
        name: "pen"
    }]);
  });
})
```

### Usage with multiple entries by pattern (wildcard)

```js
// webpack.config.js
const webpackMockServer = require("webpack-mock-server");

// for webpack v5
module.exports = {
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      webpackMockServer.use(devServer.app, {
          /* set an empty-array or null to [entry], so entry will be defined
              from 'files' and 'includes' sections in [tsConfigFileName] */
          entry: [],
          tsConfigFileName: "mock/tsconfig.json" // use a different tsconfig-file that is contained entries
      });
      return middlewares;
    }
  }
}

// for webpack v4
module.exports = {
  devServer: {
    before: app =>
      webpackMockServer.use(app, {
          /* set an empty-array or null to [entry], so entry will be defined
              from 'files' and 'includes' sections in [tsConfigFileName]
          */
          entry: [],
          tsConfigFileName: "mock/tsconfig.json" // use a different tsconfig-file that is contained entries
      })
  }
}


// ./mock/tsconfig.json
{
  /*
   *  this is ordinary tsconfig file that overrides every option from [extends] - main tsconfig-file
   */
  "extends": "../tsconfig.json", // you can point the main tsconfig file or remove that property if it's not required
  "include": [  // wildcard-pattern is supported
      "../mock/*",
      "*.mock.ts",
      "**/global.d.ts",
  ],
  "files": [], // beside 'include' option you can point exact files here
  "exclude": ["*test.mock.ts"] // note: exclude option can override 'include' and 'files' options
}

```

### Usage without webpack

As Express middleware: <http://expressjs.com/en/guide/using-middleware.html>

```js
// webpack.config.js
const webpackMockServer = require("webpack-mock-server");

const express = require('express');
const app = express();

webpackMockServer.use(app, {/*mockServerOptions*/})
...
app.listen(1782);

// webpack.mock.ts - example you can find above
...
```

### Usage with the whole default config

#### for webpack [v5+](https://webpack.js.org/configuration/dev-server/#devserveronbeforesetupmiddleware)

```js
// webpack.config.js
...
const webpackMockServer = require("webpack-mock-server");

module.exports = {
  devServer: {
    setupMiddlewares: (middlewares, devServer) => { // it's different for webpack v4
      webpackMockServer.use(devServer.app, {
          port: (devServer.options.port || 8080) + 1, // app searches for free port (starts searching from pointed)
          verbose: false, // send info via console.log
          logRequests: false,
          logResponses: false,
          before: undefined, //can be used for logging
          entry: ["webpack.mock.ts"],
          tsConfigFileName: "tsconfig.json",
          compilerOptions: { // typescript.CompilerOptions that override tsconfig.json:[compilerOptions]
              strictNullChecks: false,
              noImplicitAny: false,
              noUnusedLocals: false,
              noUnusedParameters: false,
              skipLibCheck: true,
              resolveJsonModule: true,
          },
          strictCompilerOptions: { // these options impossible to override
              outDir: "" // used the following: {os.tmpdir()}/webpack-mock-server/{new Date().getTime()}
              rootDir: process.cwd(),
              noEmit: false,
              noEmitHelpers: false,
              esModuleInterop: true,
              module: ts.ModuleKind.CommonJS,
              declaration: false,
              moduleResolution: ModuleResolutionKind.Node10,
              target: defineTarget() // it defines target-ES based on NODE version
          }
      });
      return middlewares;
    }
  }
}

// webpack.mock.ts - example you can find above
...
```

#### for webpack v4

```js
// webpack.config.js
...
const webpackMockServer = require("webpack-mock-server");

module.exports = {
  devServer: {
    before: app => // it's different for webpack v5
      webpackMockServer.use(app, {
          port: 8081, // app searches for free port (starts searching from pointed)
          verbose: false, // send info via console.log
          logRequests: false,
          logResponses: false,
          before: undefined, //can be used for logging
          entry: ["webpack.mock.ts"],
          tsConfigFileName: "tsconfig.json",
          compilerOptions: { // typescript.CompilerOptions that override tsconfig.json:[compilerOptions]
              strictNullChecks: false,
              noImplicitAny: false,
              noUnusedLocals: false,
              noUnusedParameters: false,
              skipLibCheck: true,
              resolveJsonModule: true
          },
          strictCompilerOptions: { // these options impossible to override
              outDir: "" // used the following: {os.tmpdir()}/webpack-mock-server/{new Date().getTime()}
              rootDir: process.cwd(),
              noEmit: false,
              noEmitHelpers: false,
              esModuleInterop: true,
              module: ts.ModuleKind.CommonJS,
              declaration: false,
              moduleResolution: ModuleResolutionKind.Node10,
              target: defineTarget() // it defines target-ES based on NODE version
          }
      })
  }
}

// webpack.mock.ts - example you can find above
...
```

## Options

**Note:** Every path-file-name in options has to be pointed relative to the _currentWorkingDirectory_ (_process.cwd()_ in NodeJs) **or** point an absolute path

| Param                 | Type                       | Default             | Description                                                                                                                                                                                                                      |
| --------------------- | -------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| entry                 | String, String[], null     | ["webpack.mock.ts"] | Entry points for typescript-compiler (exact fileNames are expected). Set an **empty array** or **null** for using **files**, **include** and **exlcude** sections from _tsConfigFileName_. Otherwise these sections are ignored! |
| port                  | Number                     | 8079                | App searches for free port (starts searching from pointed)                                                                                                                                                                       |
| verbose               | Boolean                    | false               | Show debug info in NodeJs via console.log                                                                                                                                                                                        |
| logResponses          | Boolean                    | false               | Show responses-info in NodeJs via console.log                                                                                                                                                                                    |
| logRequests           | Boolean                    | false               | Show request-info in NodeJs via console.log                                                                                                                                                                                      |
| before                | (req, res, next) => void   | undefined           | Execute custom middleware prior to all other middleware internally within the server Can be used for custom-logging. Example [here](#usage-with-multiplecustom-entries-instead-of-default-webpackmockts)                         |
| compilerOptions       | typescript.CompilerOptions | ...                 | See the latest example above                                                                                                                                                                                                     |
| strictCompilerOptions | typescript.CompilerOptions | ...                 | **readOnly**. See the latest example above. These options impossible to override                                                                                                                                                 |
| tsConfigFileName      | String                     | "tsconfig.json"     | Pointer to typescript config file. Example [here](#usage-with-multiple-entries-by-pattern-wildcard):                                                                                                                             |

## MockServerHelper. Methods

- [**.getRandomInt**(min = 0, max = 2147483648)](#mockserverhelper-methods) ⇒ `Number - returns random integer between min and max`
- [**.getUniqueIdInt**()](#mockserverhelper-methods) ⇒ `Number - returns unique integer`

## Troubleshooting

- It's important to install Typescript even if use only JS-files (webpack-mock-server uses ts-compiler for gathering ts,js,json files)
- Don't use NodeJs **require** operator **as dynamic** to relative path. Use **dirname in this case or absolute path** (dirname is changed during the compilation)
- NodeJs caches every **required** module (file), so you maybe interested in clearing cache for _require(_.json)\*.
  Use `delete require.cache[require.resolve({yourPathName})]` before you call `require({yourPathName})`;
- _Mockserver can't compile the TS-code_.
  **Possible reason**: you have some extra import OR missed some global files (like `global.d.ts`).
  **Solution**: all mock-files must be without dependencies (imports) of components defined in the main-project files
  - If you have custom `tsconfig.mock.json` file check if all required `\*d.ts` files are included `.. include: ["**/global.d.ts", ..] ..`
  - To check what's wrong check compilation trace `npx tsc --project tsconfig.mock.json --generateTrace traceDir` OR enable logging via option `verbose:true`

```js
// Wrong
app.get("/testResponseFromJsonFile", (_req, res) => {
  res.sendFile(require.resolve("./response.json"));
});

app.get("/testResponseFromJsonFile2", (_req, res) => {
  res.json(require("./response.json"));
});

// Correct
import nodePath from "path";

app.get("/testResponseFromJsonFile", (_req, res) => {
  res.sendFile(nodePath.join(__dirname, "./response.json"));
});

app.get("/testResponseFromJsonFile2", (_req, res) => {
  /* From NodeJs v8.9.0 you can use options: path
   * const resolvedPath = require.resolve("./response.json", { paths: [__dirname] });
   */
  const resolvedPath = require.resolve(
    nodePath.join(__dirname, "./response.json")
  );
  // removing NodeJS cache for getting the latest file
  delete require.cache[resolvedPath];
  res.json(require(resolvedPath));
});
```
