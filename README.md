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
- Can be used without webpack (because this is expressjs [middleware](http://expressjs.com/en/guide/using-middleware.html) )
- Shows every configured response in user-friendly *index.html* (just click on mock-server-url in console after as mockServer is started)

## Installing

Using npm:

```npm
npm install webpack-mock-server
```

## Examples

### Usage with defaults

```js
// webpack.config.js
const webpackMockServer = require("webpack-mock-server");

module.exports = {
    devServer: {
        before: webpackMockServer.use
    }
}

// webpack.mock.ts - feel free to mock responses yourself
import webpackMockServer from "webpack-mock-server";
import nodePath from "path";

// app is expressjs application
export default webpackMockServer.add((app, helper) => {
  // you can find more about expressjs here: https://expressjs.com/
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
})

// multiple exports are supported
export const result = webpackMockServer.add((app, helper) => {
  app.delete("/testDelete", (_req, res) => {
    res.json("JS delete-object can be here. Random int:" + helper.getRandomInt());
  });
  app.pust("/testPut", (_req, res) => {
    res.json("JS put-object can be here");
  });
})
  
```

### Usage with multiple/custom entries (instead of default **webpack.mock.ts**)

```js
// webpack.config.js
const webpackMockServer = require("webpack-mock-server");

module.exports = {
    devServer: {
         before: app =>
             webpackMockServer.use(app, { //MockServerOptions here
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
  "exclude": ["*test.mock.ts"] // note: exclude option can override 'include' and 'files' options
}

```

### Usage without webpack

As expressjs middleware: <http://expressjs.com/en/guide/using-middleware.html)>

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

```js
// webpack.config.js
...
const webpackMockServer = require("webpack-mock-server");

module.exports = {
    devServer: {
         before: app =>
            webpackMockServer.use(app, {
                port: 8079, // app searches for free port (starts searching from pointed)
                verbose: false, // send info via console.log
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

**Note:** Every path-file-name in options has to be pointed relative to the *currentWorkingDirectory* (*process.cwd()* in NodeJs) **or** point an absolute path

| Param                 | Type                       | Default             | Description                                                                                                                                                                                                                      |
| --------------------- | -------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| entry                 | String, String[], null     | ["webpack.mock.ts"] | Entry points for typescript-compiler (exact fileNames are expected). Set an **empty array** or **null** for using **files**, **include** and **exlcude** sections from *tsConfigFileName*. Otherwise these sections are ignored! |
| port                  | Number                     | 8079                | app searches for free port (starts searching from pointed)                                                                                                                                                                       |
| verbose               | Boolean                    | false               | show debug info in NodeJs via console.log                                                                                                                                                                                        |
| compilerOptions       | typescript.CompilerOptions | ...                 | see the latest example above                                                                                                                                                                                                     |
| strictCompilerOptions | typescript.CompilerOptions | ...                 | **readOnly**. See the latest example above. These options impossible to override                                                                                                                                                 |
| tsConfigFileName      | String                     | "tsconfig.json"     | pointer to typescript config file. Example [here](#usage-with-multiple-entries-by-pattern-wildcard):                                                                                                                             |

## Troubleshooting

- Don't use NodeJs **require** operator **as dynamic** to relative path. Use __dirname in this case instead or absolute path (__dirname is changed during the compilation)

```js
// Wrong
app.get("/testResponseFromJsonFile", (_req, res) => {
  res.sendFile(require.resolve("./response.json"));
});

app.get("/testResponseFromJsonFile2", (_req, res) => {
    res.json(require("./response.json"));
});
  
// Good
import nodePath from "path";

app.get("/testResponseFromJsonFile", (_req, res) => {
  res.sendFile(nodePath.join(__dirname, "./response.json"));
});

app.get("/testResponseFromJsonFile2", (_req, res) => {
   res.json(require("./response.json", {paths: {__dirname}));
});

app.get("/testResponseFromJsonFile3", (_req, res) => {
   res.json(require(nodePath.join(__dirname, "./response.json")));
});
```
