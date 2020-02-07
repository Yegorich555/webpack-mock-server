<!-- markdownlint-disable MD024 -->
<!-- markdownlint-disable MD041 -->

## [1.0.0](https://github.com/Yegorich555/webpack-mock-server/compare/v0.0.4...v1.0.0) (February 7, 2020)

* **BREAKING CHANGE**: improve export for NodeJs-require (use **require('...')** instead of **require('...').default**)
* **options**: add **.logResponse**, **.logRequest**, **.before**
* **options.entry**: add 'single string' support. Add type and wildcard checking
* **mockServerHelper**: implement with methods **getRandomInt**, **getUniqueIdInt**
* **webpackMockServer**: add '**.add**' and '**.defaultOptions**' to export
* fix 'sometimes mock-server overrides webpack port'
* fix '__dirname provides tmpName instead of sourceName'
* fix mockServerOptions: put noEmitHelpers and esModuleInterop to strictCompilerOptions
* fix memory liquid on infinite handling 'process.on' events (each reloading from tsCompiler)
* fix piping for routes with optional parameters

## [0.0.4](https://github.com/Yegorich555/webpack-mock-server/compare/v0.0.3...v0.0.4) (January 31, 2020)

* fix 'entry option does not override tsCompiler rootNames'

## [0.0.3](https://github.com/Yegorich555/webpack-mock-server/compare/v0.0.2...v0.0.3) (January 31, 2020)

* add README and CHANGELOG
* fix wrong definition of outputFilePath when used **import * from '../importedFile'** (with '../' in path)
* add support of multiple exports from mock-files
* fix 'there is no index.html in installed package'

## [0.0.2](https://github.com/Yegorich555/webpack-mock-server/compare/v0.0.1...v0.0.2) (January 28, 2020)

* fix 'verbose option is ignored'
* fix 'server does not provide updated data'
* prettify index.html for url '/' (getRoutes)
* improve logging
* add full-support of tsconfig.json (including 'files' and 'includes' sections)

## [0.0.1](https://github.com/Yegorich555/webpack-mock-server/tree/v0.0.1) (January 21, 2020)

* create basic configuration
* implement basic functionality
