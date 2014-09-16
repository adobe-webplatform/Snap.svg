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