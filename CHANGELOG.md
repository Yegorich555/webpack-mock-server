<!-- markdownlint-disable MD024 -->
<!-- markdownlint-disable MD041 -->

## [1.0.13](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.12...v1.0.13) (July 14, 2021)

- fixed 'webpack throws EADDRINUSE after restarting with webpack-mock-server'
- fixed 'wepback-mock-server does not run if wepack gets EADDRINUSE'

## [1.0.12](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.11...v1.0.12) (July 14, 2021)

- fixed 'sometimes old response after recompilation'

## [1.0.11](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.8...v1.0.11) (July 12, 2021)

- removed console.warn added previously for debugging

## [1.0.8](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.7...v1.0.8) (June 23, 2021)

- fixed wrong http-code (was 201 instead of inherited)

## [1.0.7](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.6...v1.0.7) (June 23, 2021)

- fixed case when https is selected in devServer

## [1.0.6](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.5...v1.0.6) (May 5, 2021)

- add inbox supporting of popular body types as json/form-urlencoded/text/multipart-form-data (mostly for post/put requests)
- move package @types/express to dependencies (for ts/js-intellisense)
- update packages

## [1.0.5](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.4...v1.0.5) (March 16, 2020)

- fix vulnerabilities in packages

## [1.0.4](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.3...v1.0.4) (March 5, 2020)

- update README: point on NodeJs `require.cache` and how we can delete it

## [1.0.3](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.2...v1.0.3) (February 13, 2020)

- fix 'post/put does not work and returns httpCode: 405'

## [1.0.2](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.1...v1.0.2) (February 10, 2020)

- fix 'res.once should be before next() for avoiding missing res.once event for logging purpose'

## [1.0.1](https://github.com/Yegorich555/webpack-mock-server/compare/v1.0.0...v1.0.1) (February 7, 2020)

- fix 'server does not provide favicon via directToServer response'
- fix 'default logger catches exception and does not provide actual response'
- fix '\_\_dirname under wepback is not absolute`

## [1.0.0](https://github.com/Yegorich555/webpack-mock-server/compare/v0.0.4...v1.0.0) (February 7, 2020)

- **BREAKING CHANGE**: improve export for NodeJs-require (use **require('...')** instead of **require('...').default**)
- **options**: add **.logResponse**, **.logRequest**, **.before**
- **options.entry**: add 'single string' support. Add type and wildcard checking
- **mockServerHelper**: implement with methods **getRandomInt**, **getUniqueIdInt**
- **webpackMockServer**: add '**.add**' and '**.defaultOptions**' to export
- fix 'sometimes mock-server overrides webpack port'
- fix '\_\_dirname provides tmpName instead of sourceName'
- fix mockServerOptions: put noEmitHelpers and esModuleInterop to strictCompilerOptions
- fix memory liquid on infinite handling 'process.on' events (each reloading from tsCompiler)
- fix piping for routes with optional parameters

## [0.0.4](https://github.com/Yegorich555/webpack-mock-server/compare/v0.0.3...v0.0.4) (January 31, 2020)

- fix 'entry option does not override tsCompiler rootNames'

## [0.0.3](https://github.com/Yegorich555/webpack-mock-server/compare/v0.0.2...v0.0.3) (January 31, 2020)

- add README and CHANGELOG
- fix wrong definition of outputFilePath when used **import \* from '../importedFile'** (with '../' in path)
- add support of multiple exports from mock-files
- fix 'there is no index.html in installed package'

## [0.0.2](https://github.com/Yegorich555/webpack-mock-server/compare/v0.0.1...v0.0.2) (January 28, 2020)

- fix 'verbose option is ignored'
- fix 'server does not provide updated data'
- prettify index.html for url '/' (getRoutes)
- improve logging
- add full-support of tsconfig.json (including 'files' and 'includes' sections)

## [0.0.1](https://github.com/Yegorich555/webpack-mock-server/tree/v0.0.1) (January 21, 2020)

- create basic configuration
- implement basic functionality
