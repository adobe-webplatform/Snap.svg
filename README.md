[Snap.svg](http://snapsvg.io) · [![Build Status](https://travis-ci.org/adobe-webplatform/Snap.svg.svg?branch=dev)](https://travis-ci.org/adobe-webplatform/Snap.svg)  [![CDNJS](https://img.shields.io/cdnjs/v/snap.svg.svg)](https://cdnjs.com/libraries/snap.svg/) [![GitHub Tag](https://img.shields.io/github/tag/adobe-webplatform/snap.svg.svg)](https://github.com/adobe-webplatform/Snap.svg/releases) [![License](https://img.shields.io/npm/l/snapsvg.svg)](https://github.com/adobe-webplatform/Snap.svg/blob/master/LICENSE)
======

A JavaScript SVG library for the modern web. Learn more at [snapsvg.io](http://snapsvg.io).

[Follow us on Twitter.](https://twitter.com/snapsvg)

### Install
* [Bower](http://bower.io/) - `bower install snap.svg` ![Bower](https://img.shields.io/bower/v/snap.svg.svg)
* [npm](http://npmjs.com/) - `npm install snapsvg` [![npm version](https://img.shields.io/npm/v/snapsvg.svg?style=flat)](https://www.npmjs.com/package/snapsvg) [![Downloads](https://img.shields.io/npm/dt/snapsvg.svg)](https://www.npmjs.com/package/snapsvg)
* Manual Minified - https://github.com/adobe-webplatform/Snap.svg/raw/master/dist/snap.svg-min.js
* Manual Unminified - https://raw.githubusercontent.com/adobe-webplatform/Snap.svg/master/dist/snap.svg.js


### Learn

* [About Snap.svg](http://snapsvg.io/about/)
* [Getting Started](http://snapsvg.io/start/)
* [API Reference](http://snapsvg.io/docs/)
* [Slack Room](https://snapsvg.slack.com/). [Invite](https://snapsvg.slack.com/shared_invite/MTM2NTE4MTk3MDYwLTE0ODYwODgzNzUtYjQ0YmM1N2U0Mg)

### Use

In your HTML file, load simply by:
```html
<script src="snap.svg.min.js"></script>
```
No other scripts are needed. Both the minified and uncompressed (for development) versions are in the `/dist` folder.

#### webpack
To load with webpack 2.x and 3.x, install [Imports Loader](https://github.com/webpack-contrib/imports-loader) (`npm i -D imports-loader`), and add the following to your webpack config:

```js
<<<<<<< HEAD
const Snap = require(`snapsvg/dist/snap.svg.slim.js`); // or define an alias in webpack.config.js
=======
module: {
  rules: [
    {
      test: require.resolve('snapsvg/dist/snap.svg.js'),
      use: 'imports-loader?this=>window,fix=>module.exports=0',
    },
  ],
},
resolve: {
  alias: {
    snapsvg: 'snapsvg/dist/snap.svg.js',
  },
},
```

Then, in any module you’d like to require Snap, use:
```
import Snap from 'snapsvg';
>>>>>>> master
```

### Build
[![Build Status](https://travis-ci.org/adobe-webplatform/Snap.svg.svg?branch=dev)](https://travis-ci.org/adobe-webplatform/Snap.svg)

Snap.svg uses [Grunt](http://gruntjs.com/) to build.

* Open the terminal from the Snap.svg directory:
```sh
cd Snap.svg
```
* Install dependencies with npm:
```sh
npm install
```
_*Snap.svg uses Grunt 0.4.0. You might want to [read](http://gruntjs.com/getting-started) more on their website if you haven’t upgraded since a lot has changed._

* To build the files run
```sh
grunt
```
* The results will be built into the `dist` folder.
* Alternatively type `grunt watch` to have the build run automatically when you make changes to source files.
* If there are `eslint` errors that make the build fail, you can run
  `$ node eslintFixCoreScript.js` to correct these errors or use `$ grunt --force`
  to ignore them and finish the build process.

### Repository index

- [demos/](demos) - examples of what Snap.svg can do and how to do it.
- [dist/snap.svg-min.js](dist/snap.svg-min.js) - latest version of minified Snap.svg library file.
- [dist/snap.svg.js](dist/snap.svg.js) - latest version of Snap.svg library file.
- [doc/](doc/) - contains `reference.html` generated from `template.dot` in the
  root directory using the Dr. JS tool (which uses the [dr.json](dr.json) file, and it contains these directories too: `css`, `fonts`, `img`, `js`.
  with assets also used in the full website of Snap.svg: [www.snapsvg.io](https://snapsvg.io).
- [src/](src/) contains all the source JS files needed to build the final
  library file.
- [test/](test/) contains all unit tests.
- [.gitignore](.gitignore) - used by Git.
- [.gitmodules](.gitmodules) - used by Git.
- [.travis.yml](.travis.yml) - used by GitHub to connect the repository to
  Travis CI service.
- [CONTRIBUTING](CONTRIBUTING), [LICENSE](LICENSE), [NOTICE](NOTICE) and
  [README.md](README.md) (this file) are offering you information about the
  other files and about the project.
- [Gruntfile.js](Gruntfile.js) - [Grunt JavaScript Task Runner](https://gruntjs.com/) configuration file for the entire project.
- [bower.json](bower.json), [component.json](component.json) and
  [package.json](package.json) are configuration files for different package
  managers.
- [dr.json](dr.json) - [dr.js](https://github.com/adobe-webplatform/dr.js)
  configuration file.
- [eslintFixCoreScript.js](eslintFixCoreScript.js) - a script that uses the
  required `eslint` npm module to automatically fix the errors that are reported
  by the eslint task, that is defined in `Gruntfile.js`, before Grunt quits.
- [history.md](history.md) - changelog file in Markdown format.
- [template.dot](template.dot) - HTML file used as a template for the generated
[doc/reference.html](doc/reference.html) file.


### Testing

Tests are located in `test` folder. To run tests, simply open `test/index.html`. Automatic tests use PhantomJS to scrap this file, so you can use it as a reference.

Alternatively, install [PhantomJS](http://phantomjs.org) and run command
```sh
grunt test
```

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
