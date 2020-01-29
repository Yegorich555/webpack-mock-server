# Webpack Mock Server

ExpressJs Middleware for webpack-dev-server with built-in hot-replacement (HMR) and typescript compiler.
Uses for mocking api responses

[![npm version](https://img.shields.io/npm/v/webpack-mock-server.svg?style=flat-square)](https://www.npmjs.com/package/webpack-mock-server)
[![install size](https://packagephobia.now.sh/badge?p=webpack-mock-server)](https://packagephobia.now.sh/result?p=webpack-mock-server)
[![npm downloads](https://img.shields.io/npm/dm/webpack-mock-server.svg?style=flat-square)](http://npm-stat.com/charts.html?package=webpack-mock-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- Typescript support (>=v2.7): supports **.js**, **.ts** files
- ES6 export/import support
- Hot replacement support
- Does not require proxy-path-pattern (because this is middleware that pipes routes to splitted server without proxy-path-pattern)
- Can be used without webpack (because this is expressjs middleware: )
- Shows every configured response in user-friendly *index.html* (just click on mock-server-url in console after as mockServer is started)

## Installing

Using npm (express, typescript are required):

```npm
npm install webpack-mock-server express typescript
```

## Examples

### Usage with defaults

```js
// webpack.config.js
const webpackMockServer = require("webpack-mock-server").default;

module.exports = {
    devServer: {
        before: webpackMockServer.use
    }
}

// webpack.mock.ts - feel free to mock responses yourself
import { Application } from "express";

export default (app: Application): void => {
  // you can find more about expressjs here: https://expressjs.com/
  app.get("/testGet", (_req, res) => {
    res.json("JS get-object can be here");
  });
  app.post("/testPost", (_req, res) => {
    res.json("JS post-object can be here");
  });
  app.delete("/testDelete", (_req, res) => {
    res.json("JS delete-object can be here");
  });
  app.pust("/testPut", (_req, res) => {
    res.json("JS put-object can be here");
  });
};
```

### Usage with multiple/custom entries (instead of default **webpack.mock.ts**)

```js
// webpack.config.js
const webpackMockServer = require("webpack-mock-server").default;

module.exports = {
    devServer: {
         before: app =>
             webpackMockServer.use(app, { //webpackServer.mockOptions here
                entry: [ //exact fileNames are expected (no wildcard or folder - use custom tsConfig instead)
                    "api/users.mock.ts",
                    "api/goods.mock.js"
                ]
            })
    }
}

// api/users.mock.ts
... // take the example for ts-file above

// api/goods.mock.js
export default (app) => {
  app.get("/testGetGoods", (_req, res) => {
    res.json([{
        id: 1,
        name: "pen"
    }]);
  });
};
```

### Usage with multiple entries by pattern (wildcard)

```js
// webpack.config.js
const webpackMockServer = require("webpack-mock-server").default;

module.exports = {
    devServer: {
         before: app =>
            webpackMockServer.use(app, {
                /* set an empty-array or null to [entry], so entry will be defined
                   from 'files' and 'includes' sections in [tsConfigFileName]
                */
                entry: [],
                tsConfigFileName: "mock/tsconfig.json", // use a different tsconfig-file that is contained entries
            })
    }
}

// ./mock/tsconfig.json
{
/*
    this is ordinary tsconfig file that overrides every option from [extends] - main tsconfig-file
*/
  "extends": "../tsconfig.json", // you can point the main tsconfig file or remove that property if it's not required
  "include": [  // wildcard-pattern is supported
      "../mock/*",
      "*.mock.ts"
  ],
  "files": [], // beside 'include' option you can point exact files here
}

```

### Usage without webpack

As expressjs middleware: <http://expressjs.com/en/guide/using-middleware.html)>

```js
// webpack.config.js
const webpackMockServer = require("webpack-mock-server").default;

const express = require('express');
const app = express();

webpackMockServer.use(app, {/*mockServerOptions*/})
...
app.listen(1782);

// webpack.mock.ts - example you can find above
...
```

### Usage with the whole default config

```js
// webpack.config.js
const webpackMockServer = require("webpack-mock-server").default;

module.exports = {
    devServer: {
         before: app =>
            webpackMockServer.use(app, {
                port: 8079, // app searches for free port (starts searching from pointed)
                verbose: false, // send info via console.log
                entry: ["webpack.mock.ts"],
                tsConfigFileName: "tsconfig.json",
                compilerOptions: { // typescript.CompilerOptions that overrides tsconfig.json:[compilerOptions]
                    strictNullChecks: false,
                    noImplicitAny: false,
                    noUnusedLocals: false,
                    noUnusedParameters: false,
                    noEmitHelpers: false,
                    skipLibCheck: true
                },
                strictCompilerOptions: { // these options impossible to override
                    noEmit: false,
                    module: ts.ModuleKind.CommonJS,
                    declaration: false,
                    moduelResolution: ModuleResolutionKind.NodeJs,
                    target: defineTarget() // it defines target-ES based on NODE version
                }
            })
    }
}

// webpack.mock.ts - example you can find above
...
```

## Options

**Note:** Every path-file-name in options has to be pointed relative to the *currentWorkingDirectory* (*process.cwd()* in NodeJs)

| Param                 | Type                       | Default             | Description                                                                                                                                                                                                          |
| --------------------- | -------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| entry                 | String[], null             | ["webpack.mock.ts"] | Entry points for typescript-compiler (exact fileNames are expected). Set an **empty array** or **null** for using **files** and **includes** sections from *tsConfigFileName*. Otherwise these sections are ignored! |
| port                  | Number                     | 8079                | app searches for free port (starts searching from pointed)                                                                                                                                                           |
| verbose               | Boolean                    | false               | show debug info in NodeJs via console.log                                                                                                                                                                            |
| compilerOptions       | typescript.CompilerOptions | ...                 | see the latest example above                                                                                                                                                                                         |
| strictCompilerOptions | typescript.CompilerOptions | ...                 | **readOnly**. See the latest example above. These options impossible to override                                                                                                                                     |
| tsConfigFileName      | String                     | "tsconfig.json"     | pointer to typescript config file                                                                                                                                                                                    |
