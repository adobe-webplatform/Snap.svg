savage
======

JavaScript library for SVG.

API Reference is in `dist/reference.html`

### Building

Savage uses [Grunt](http://gruntjs.com/) to build

* Open the terminal from the Savage directory

        cd savage

* Install its command line interface (CLI) globally

        npm install -g grunt-cli

* Install dependencies with npm

        npm install


_*Savage uses Grunt 0.4.0. You might want to [read](http://gruntjs.com/getting-started) more on their website if you haven’t upgraded since a lot has changed._

* Type `grunt` in the command line to build the files.
* The results will be built into the release folder.
* Alternatively type `grunt watch` to have the build run automatically when you make changes to source files.

* For documentation generation use this command

        cd node_modules/dr.js/; node dr ../../dr.json; cd ../../

_It’s ugly at the moment. Somebody should port it to grunt. May be even me :)_
