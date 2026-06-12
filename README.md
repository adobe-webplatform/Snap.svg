[Snap.svg](http://snapsvg.io) · [![CDNJS](https://img.shields.io/cdnjs/v/snap.svg.svg)](https://cdnjs.com/libraries/snap.svg/) [![GitHub Tag](https://img.shields.io/github/tag/adobe-webplatform/snap.svg.svg)](https://github.com/adobe-webplatform/Snap.svg/releases) [![License](https://img.shields.io/npm/l/snapsvg.svg)](https://github.com/adobe-webplatform/Snap.svg/blob/master/LICENSE)
======

A JavaScript SVG library for the modern web. Learn more at [snapsvg.io](http://snapsvg.io).

[Follow us on Twitter.](https://twitter.com/snapsvg)

### Install
* [npm](http://npmjs.com/) - `npm install snapsvg` [![npm version](https://img.shields.io/npm/v/snapsvg.svg?style=flat)](https://www.npmjs.com/package/snapsvg) [![Downloads](https://img.shields.io/npm/dt/snapsvg.svg)](https://www.npmjs.com/package/snapsvg)
* CDN - [`https://cdn.jsdelivr.net/npm/snapsvg/dist/snap.svg.min.js`](https://cdn.jsdelivr.net/npm/snapsvg/dist/snap.svg.min.js) (or via [cdnjs](https://cdnjs.com/libraries/snap.svg/))
* Manual download - grab [`dist/snap.svg.min.js`](https://raw.githubusercontent.com/adobe-webplatform/Snap.svg/master/dist/snap.svg.min.js) (minified) or [`dist/snap.svg.js`](https://raw.githubusercontent.com/adobe-webplatform/Snap.svg/master/dist/snap.svg.js) (unminified)

The npm package ships four builds in `dist/`:

| File | Format | Use |
| --- | --- | --- |
| `snap.svg.js` / `snap.svg.min.js` | UMD/IIFE (global `Snap`) | `<script>` tags, CDN |
| `snap.svg.esm.js` / `snap.svg.esm.min.js` | ES module | `import` / bundlers |


### Learn

* [About Snap.svg](http://snapsvg.io/about/)
* [Getting Started](http://snapsvg.io/start/)
* [API Reference](http://snapsvg.io/docs/)
* [Slack Room](https://snapsvg.slack.com/). [Invite](https://snapsvg.slack.com/shared_invite/MTM2NTE4MTk3MDYwLTE0ODYwODgzNzUtYjQ0YmM1N2U0Mg)

### Use

In a browser, load with a `<script>` tag — it exposes a global `Snap`:
```html
<script src="snap.svg.min.js"></script>
```
No other scripts are needed. Both the minified and uncompressed (for development) versions are in the `/dist` folder.

With a bundler (webpack, Vite, Rollup, esbuild) or in Node, import the package directly. Snap exposes an ES module build through its `exports` map, so no loader configuration is required:
```js
import Snap from 'snapsvg';

const paper = Snap(800, 600);
paper.circle(150, 150, 100);
```

CommonJS `require()` resolves to the UMD build automatically:
```js
const Snap = require('snapsvg');
```

### Build

Snap.svg is written as ES modules in `src/` and bundled with [Rollup](https://rollupjs.org/).

* From the Snap.svg directory, install dependencies:
```sh
npm install
```
* Build the `dist/` bundles (UMD/IIFE and ESM, both minified and unminified):
```sh
npm run build
```
* Rebuild automatically while editing the source:
```sh
npm run build:watch
```

Linting and formatting use [Biome](https://biomejs.org/):

* `npm run lint` — report problems (also runs automatically before `build`)
* `npm run format` — format `src/`
* `npm run check` — apply safe lint/format fixes

### Repository index

- [demos/](demos) - examples of what Snap.svg can do and how to do it.
- [dist/](dist) - built library bundles: `snap.svg.js` / `snap.svg.min.js`
  (UMD/IIFE) and `snap.svg.esm.js` / `snap.svg.esm.min.js` (ES module).
- [doc/](doc/) - contains `reference.html` generated from `template.dot` in the
  root directory using the Dr. JS tool (which uses the [dr.json](dr.json) file, and it contains these directories too: `css`, `fonts`, `img`, `js`.
  with assets also used in the full website of Snap.svg: [www.snapsvg.io](https://snapsvg.io).
- [src/](src/) contains all the source JS files needed to build the final
  library file.
- [test/](test/) contains all unit tests.
- [.gitignore](.gitignore) - used by Git.
- [.gitmodules](.gitmodules) - used by Git.
- [CONTRIBUTING](CONTRIBUTING), [LICENSE](LICENSE), [NOTICE](NOTICE) and
  [README.md](README.md) (this file) are offering you information about the
  other files and about the project.
- [rollup.config.js](rollup.config.js) - [Rollup](https://rollupjs.org/) build
  configuration that bundles `src/` into the `dist/` files.
- [biome.json](biome.json) - [Biome](https://biomejs.org/) linter and formatter
  configuration.
- [bower.json](bower.json), [component.json](component.json) and
  [package.json](package.json) are configuration files for different package
  managers.
- [dr.json](dr.json) - [dr.js](https://github.com/adobe-webplatform/dr.js)
  configuration file.
- [history.md](history.md) - changelog file in Markdown format.
- [template.dot](template.dot) - HTML file used as a template for the generated
[doc/reference.html](doc/reference.html) file.


### Testing

Browser tests live in the `test` folder — open `test/index.html` in a browser to run them against the build in `dist/`.

`npm test` performs a clean rebuild (`clean` + `build`), which verifies the source compiles and bundles without errors.

### Contribute

* [Fill out the CLA](http://snapsvg.io/contributions/).
* [Fork](https://help.github.com/articles/fork-a-repo) the repo.
* Create a branch:
```sh
git checkout -b my_branch
```
* Add your changes.
* Check that tests are passing
* Commit your changes:
```sh
git commit -am "Added some awesome stuff"
```
* Push your branch:
```sh
git push origin my_branch
```
* Make a [pull request](https://help.github.com/articles/using-pull-requests) to `dev`(!) branch.

*Note:* Pull requests to other branches than `dev` or without filled CLA wouldn’t be accepted.
