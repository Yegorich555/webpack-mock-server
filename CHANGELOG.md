<!-- markdownlint-disable MD024 -->
<!-- markdownlint-disable MD041 -->

## [1.0.20](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.19...v1.0.20) (December 16, 2023)

- added support for global types defined in custom `*.d.ts` files

## [1.0.19](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.18...v1.0.19) (November 16, 2023)

- updated examples for webpack 5 according to recent webpack changes (Readme.md)

## [1.0.18](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.17...v1.0.18) (April 26, 2023)

- updated packages
- fixed `ordinary string isn't supported in JSON`

## [1.0.17](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.16...v1.0.17) (July 05, 2022)

- updated packages
- fixed `File upload doesn't work for files with russian letters`

## [1.0.16](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.15...v1.0.16) (May 12, 2022)

- bump version of vulnerable packages
- added [details about usage with webpack v5](README.md#for-webpack-v5)

## [1.0.15](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.14...v1.0.15) (November 2, 2021)

- added support uploading files with auto-storing to memory and mapping to routes (for retrieving back)

## [1.0.14](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.13...v1.0.14) (September 2, 2021)

- added support ts-path-alias. Related to <https://github.com/microsoft/TypeScript/issues/26722>

## [1.0.13](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.12...v1.0.13) (July 14, 2021)

- fixed `webpack throws EADDRINUSE after restarting with webpack-mock-server`
- fixed `webpack-mock-server does not run if webpack gets EADDRINUSE`

## [1.0.12](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.11...v1.0.12) (July 14, 2021)

- fixed `sometimes old response after recompilation`

## [1.0.11](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.8...v1.0.11) (July 12, 2021)

- removed console.warn added previously for debugging

## [1.0.8](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.7...v1.0.8) (June 23, 2021)

- fixed `wrong http-code (was 201 instead of inherited)`

## [1.0.7](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.6...v1.0.7) (June 23, 2021)

- fixed `case when https is selected in devServer`

## [1.0.6](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.5...v1.0.6) (May 5, 2021)

- added inbox supporting of popular body types as json/form-urlencoded/text/multipart-form-data (mostly for post/put requests)
- moved package @types/express to dependencies (for ts/js-intellisense)
- updated packages

## [1.0.5](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.4...v1.0.5) (March 16, 2020)

- fixed vulnerabilities in packages

## [1.0.4](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.3...v1.0.4) (March 5, 2020)

- updated README: point on NodeJs `require.cache` and how we can delete it

## [1.0.3](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.2...v1.0.3) (February 13, 2020)

- fixed `post/put does not work and returns httpCode: 405`

## [1.0.2](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.1...v1.0.2) (February 10, 2020)

- fixed `res.once should be before next() for avoiding missing res.once event for logging purpose`

## [1.0.1](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.0...v1.0.1) (February 7, 2020)

- fixed `server does not provide favicon via directToServer response`
- fixed `default logger catches exception and does not provide actual response`
- fixed `\_\_dirname under wepback is not absolute`

## [1.0.0](https://github.com/Yegorich555/webpack-mock-server/compare/v0.0.4...v1.0.0) (February 7, 2020)

- **BREAKING CHANGE**: improve export for NodeJs-require (use **require('...')** instead of **require('...').default**)
- **options**: add **.logResponse**, **.logRequest**, **.before**
- **options.entry**: add 'single string' support. Add type and wildcard checking
- **mockServerHelper**: implement with methods **getRandomInt**, **getUniqueIdInt**
- **webpackMockServer**: add '**.add**' and '**.defaultOptions**' to export
- fixed `sometimes mock-server overrides webpack port`
- fixed `\_\_dirname provides tmpName instead of sourceName`
- fixed `mockServerOptions: put noEmitHelpers and esModuleInterop to strictCompilerOptions`
- fixed `memory liquid on infinite handling 'process.on' events (each reloading from tsCompiler)`
- fixed `piping for routes with optional parameters`

## [0.0.4](https://github.com/Yegorich555/webpack-mock-server/compare/v0.0.3...v0.0.4) (January 31, 2020)

- fixed `entry option does not override tsCompiler rootNames`

## [0.0.3](https://github.com/Yegorich555/webpack-mock-server/compare/v0.0.2...v0.0.3) (January 31, 2020)

- add README and CHANGELOG
- add support of multiple exports from mock-files
- fixed `wrong definition of outputFilePath when used **import \* from '../importedFile'** (with '../' in path)`
- fixed `there is no index.html in installed package`

## [0.0.2](https://github.com/Yegorich555/webpack-mock-server/compare/v0.0.1...v0.0.2) (January 28, 2020)

- fixed `verbose option is ignored`
- fixed `server does not provide updated data`
- prettify index.html for url '/' (getRoutes)
- improve logging
- add full-support of tsconfig.json (including 'files' and 'includes' sections)

## [0.0.1](https://github.com/Yegorich555/webpack-mock-server/tree/v0.0.1) (January 21, 2020)

- create basic configuration
- implement basic functionality
