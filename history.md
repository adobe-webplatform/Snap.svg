#1.0.0

* Modernised the build: migrated from Grunt to Rollup and converted the source
  into native ES modules under `src/`
* Distribution now ships an ES module build (`dist/snap.svg.esm.js`) alongside
  the existing UMD/IIFE bundles
* Switched linting from ESLint to Biome
* Performance: added a fast path for attribute setting that writes plain
  numeric, hex-colour and path values straight to the DOM, bypassing the event
  pipeline — bulk element creation is now on par with comparable libraries
* Performance: memoised attribute-name conversion and other hot-path
  optimisations across `svg.js` and `eve.js`
* Added a path math module: Bézier analytics, `Snap.path.smooth()`,
  `Snap.path.simplify()` and `Snap.grid()`
* Fixed an infinite recursion / stack overflow in `Element.drag()`
* Fixed strict-mode `ReferenceError`s caused by loop and variable scoping in
  the ES module source
* Fixed path elements created from an array of arrays producing a malformed
  `d` attribute (e.g. `"M,12,13,..."`)
* Various bug fixes

#0.5.2

* Bug fixes
* Common JS update

#0.5.1

* Bug fix

#0.5.0

* Added color palettes for Material and FlatUI
* Added methods for gradients: `Element.stops()`, `Element.addStop()`, `Element.setStops()`
* Fixed matrix splitting for better animation of matrices`
* Various bug fixes
* Better integration of tests and ESlint

#0.4.1

* Bug fixes.

#0.4.0

* Moved class and element related code into separate plugins
* Added `Element.align()` and `Element.getAlign()` methods
* Added animation support for `viewBox`
* Added support for `<symbol>`
* Added method `Paper.toDataURL()`
* Added method `Snap.closest()`
* Added methods to work with degrees instead of radians: `Snap.sin()`, `Snap.cos()`, `Snap.tan()`, `Snap.asin()`, `Snap.acos()`, `Snap.atan()` and `Snap.atan2()`
* Added methods `Snap.len()`, `Snap.len2()` and `Snap.closestPoint()`
* Added methods `Element.children()` and `Element.toJSON()`
* Various bug fixes

#0.3.0

* Added `.addClass()`, `.removeClass()`, `.toggleClass()` and `.hasClass()` APIs
* Added `Paper.mask()`, `Paper.ptrn()`, `Paper.use()`, `Paper.svg()`
* Mask & pattern elements are sharing paper methods (just like group)
* Added `Set.bind()` method
* Added syncronisation for `Set.animate()`
* Added opacity to the shadow filter
* Added ability to specify attributes as `"+=10"` or `"-=1em"` or `"*=2"`
* Fix negative scale
* Fix for `path2curve`
* Fixed shared `<defs>` issue
* Various bug fixes

#0.2.0

* Added support for text path
* Added `getBBox` method to the paper object
* Added `Element.appendTo()` and `Element.prependTo()`
* Added `getElementByPoint()`
* Added `Set.remove()` method
* Get rid of internal SVG parser in favor of the browser
* Fix for `xlink:href` setting for images
* Fix `Element.animate()`
* Fix for animate and stroke-dashoffset
* Absolute transforms fix
* Fix for animation of SVG transformations, matrices and polygon points
* Various bug fixes

#0.1.0

* Initial release
