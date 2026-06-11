# Snap Fork Browser Interface Requirements

This document captures the browser-bound API surface used by the fork in:

- `snap.js`
- `snap_extensions.js`
- `fragment-class.js`
- `element-class.js`
- `element_extensions.js`
- `paper-class.js`
- `paper_extensions.js`
- `mouse.js`

Goal: define the minimum interfaces needed to run Snap with injected/non-standard `window` and `document` objects.

## 1) Injection Points Already Present

The fork already exposes core hooks:

- `Snap.setWindow(newWindow)`
- `Snap.setDocument(doc, force_top)`
- `Snap.window()`
- `Snap.document(el?, snp?)`

These are the key abstraction points for replacing browser globals.

## 2) Required Runtime Interfaces

## 2.1 WindowLike

Used directly or via globals.

Required members:

- `document: DocumentLike`
- `pageXOffset?: number`
- `pageYOffset?: number`
- `scrollX?: number`
- `scrollY?: number`
- `navigator?: { maxTouchPoints?: number }`
- `requestIdleCallback?: (cb: Function) => any`
- `getComputedStyle?(element, pseudoElement?): CSSStyleDeclarationLike`
- `PointerEvent?` (feature detection only)
- `jQuery?` (optional compatibility path — **deprecated**; jQuery integration is being removed)
- `btoa?(value: string): string`

Timer APIs (accessed via `window` in `mina.js`, bound as local `native*` wrappers):

- `setTimeout(callback, delay)`
- `clearTimeout(id)`
- `setInterval(callback, delay)`
- `clearInterval(id)`

Animation frame APIs (accessed via `window` in `mina.js`, with vendor-prefix fallbacks; falls back to `setTimeout`/`clearTimeout` when unavailable):

- `requestAnimationFrame(callback)` — also checked as `webkitRequestAnimationFrame`, `mozRequestAnimationFrame`, `oRequestAnimationFrame`, `msRequestAnimationFrame`
- `cancelAnimationFrame(id)` — also checked as `webkitCancelAnimationFrame`, `mozCancelAnimationFrame`, `oCancelAnimationFrame`, `msCancelAnimationFrame`

Also required as globals in current code paths:

- `atob(value)` (used in `Snap.load`)
- `MouseEvent` constructor (used in drag alt-click dispatch)
- `URL` constructor (used by `Snap.isUrl` absolute URL validation in `snap_extensions.js`)

Optional constructor used by extension helpers:

- `DOMMatrix` (used in `element_extensions.js` when `screenCTM_compensation_matrix` is active)

Notes:

- Touch support detection reads `'ontouchstart' in glob.win` and `navigator.maxTouchPoints`.
- `window.LZString` is optionally used for `LZBase64:` payloads. Requeres lz-string.js
- `mina.js` also has a `nativeSetInterval` binding (depriciated) but it is not a primary animation driver — `requestAnimationFrame` is preferred.

## 2.2 DocumentLike

Required members:

- Creation:
- `createElement(tagName)`
- `createElementNS(ns, tagName)`
- `createTextNode(text)`
- `createComment(text)`
- `createDocumentFragment()`
- Query:
- `querySelector(selector)`
- `querySelectorAll(selector)`
- `getElementsByTagName(tag)`
- `getElementById(id)`
- Hit testing:
- `elementFromPoint(x, y)?`
- `elementsFromPoint(x, y)?`
- Properties:
- `body: ElementLike`
- `documentElement: ElementLike`
- `defaultView: { getComputedStyle(el, pseudo?): CSSStyleDeclarationLike }`

## 2.3 ShadowRootLike / RootLike

When using Shadow DOM, `Snap.setDocument` wraps a shadow root.

Required members:

- `ownerDocument: DocumentLike`
- `querySelector(selector)`
- `querySelectorAll(selector)`
- Optionally hit testing:
- `elementFromPoint(x, y)` and/or `elementsFromPoint(x, y)`

Additionally, wrapped root objects may carry `_doc` in this fork.

## 2.4 DocumentFragmentLike

Required members:

- `nodeType === 11`
- `appendChild(node)`
- `ownerDocument` (used as fallback document source)
- Optional query support when passed through custom wrappers

## 2.5 NodeLike (base)

Required members:

- `nodeType`
- `parentNode`
- `childNodes`
- `firstChild`
- `nextSibling`
- `ownerDocument`
- `nodeValue` (text/comment nodes)
- `isConnected` (hub garbage collection)

Required methods:

- `appendChild(node)`
- `removeChild(node)`
- `insertBefore(node, refNode)`
- `cloneNode(deep)`
- `remove?()` (used by temporary measurement clones)
- `getRootNode?()`
- `contains(node)?`
- `compareDocumentPosition(otherNode)?` (required for DOM relationship bitmask in `isParentOf` / `isChildOf` helpers)

Bit convention required by Snap helpers (`Snap._compareDomPosition`, `isParentOf`, `isChildOf`):

- `8` means `otherNode` contains `this` node (current is child-of other)
- `16` means `this` node contains `otherNode` (current is parent-of other)
- `2` means `otherNode` precedes `this` node
- `4` means `this` node precedes `otherNode`
- `1` means nodes are disconnected / in different documents (fallback path)

Implementations must preserve these bit meanings (DOM standard values) because Snap checks them directly via bitwise `&`.

Optional legacy compatibility members:

- `sourceIndex` (used only when `compareDocumentPosition` is unavailable)

## 2.6 ElementLike (generic DOM element)

Required members:

- `tagName` or `nodeName`
- `attributes` (iterable NamedNodeMap-like)
- `style` (property assignment and `getPropertyValue` paths)
- `innerHTML` (read/write; accepts and parses HTML/SVG markup strings)
- `snap` expando property (Snap hub key)

Required methods:

- `getAttribute(name)`
- `setAttribute(name, value)`
- `removeAttribute(name)`
- `hasAttribute(name)`
- `getAttributeNS(ns, name)`
- `setAttributeNS(ns, name, value)`
- `matches(selector)`
- `querySelector(selector)`
- `querySelectorAll(selector)`
- `getElementsByTagName(tag)`
- `getBoundingClientRect()`
- `addEventListener(type, fn, options?)`
- `removeEventListener(type, fn, options?)`
- `dispatchEvent(event)`
- `contains(node)`

## 2.7 SVGElementLike

`instanceof SVGElement` checks exist, but fallback constructor-name checks are also present.

Required members/methods on relevant SVG nodes:

- `ownerSVGElement`
- `getBBox()`
- `getCTM()`
- `getScreenCTM()` (used for screen-to-local coordinate conversion in `element_extensions.js`)
- `createSVGPoint()` on SVG root nodes (returns a mutable point supporting `matrixTransform(...)`)
- For path-like nodes:
- `getTotalLength()`
- `getPointAtLength(length)`

Commonly used SVG tags include `svg`, `g`, `defs`, `path`, `text`, `tspan`, `use`, gradients, animation tags, etc.

## 2.8 HTMLElementLike

`instanceof HTMLElement` checks exist (with constructor-name fallback).

Required behaviors used:

- Standard `ElementLike` members
- CSS style mutation via `node.style[...]`
- `innerHTML` parsing in temporary `<div>` containers

## 2.9 Event Interfaces

### Mouse/Pointer-like event

Required members:

- `clientX`, `clientY`
- `buttons?`
- `preventDefault()`
- `stopPropagation()`

### Touch event

Required members:

- `touches` / `targetTouches` lists
- Touch item fields: `identifier`, `target`, `clientX`, `clientY`
- Event methods: `preventDefault()`, `stopPropagation()`

### Synthetic event

- `new MouseEvent("click", { bubbles: true, cancelable: true })`

## 2.10 XMLHttpRequestLike

Used by `Snap.ajax`.

Required API:

- `open(method, url, async)`
- `setRequestHeader(name, value)`
- `send(body?)`
- Events/callbacks:
- `onreadystatechange`, `onerror`, `onabort`, `ontimeout`
- State/data:
- `readyState`, `status`, `responseText`, `responseURL`

## 2.11 HTMLImageElement-like (preload helper)

Used in `paper-class.js` image preloading.

Required members:

- `style.cssText`
- `onload`, `onerror`
- `src`
- `offsetWidth`, `offsetHeight`
- Must be appendable to/removable from `document.body`

## 2.12 HTMLObjectElement-like (SVG object embedding)

When wrapping `<object type="image/svg+xml">`:

- `tagName === "object"`
- `type === "image/svg+xml"`
- `contentDocument.getElementsByTagName("svg")[0]`

## 3) Constructor/Type Dependencies (important for non-browser runtimes)

The fork uses these constructor checks:

- `instanceof SVGElement`
- `instanceof HTMLElement`
- `instanceof ShadowRoot`

If your environment does not provide native constructors, provide compatible shims or adjust these checks.

## 4) Per-File Browser Dependency Summary

## 4.1 `snap.js`

Primary dependencies:

- Global/root: `window`, `document`, `XMLHttpRequest`, `atob`
- Timers: `setInterval` (hub garbage collector; see also `mina.js` for full timer/rAF surface)
- Root/document abstraction: `setWindow`, `setDocument`, shadow-root wrapping
- DOM creation/query: `createElement*`, `querySelector*`, `getElementsByTagName`
- DOM mutation: `appendChild`, `removeChild`, `insertBefore`, `innerHTML`
- Attribute/style APIs: `getAttribute*`, `setAttribute*`, `style`
- Geometry: `getBoundingClientRect`, `getBBox`, `getTotalLength`, `getPointAtLength`
- Hit testing: `elementsFromPoint` / `elementFromPoint`
- Style resolution: `defaultView.getComputedStyle(...).getPropertyValue(...)`

## 4.2 `fragment-class.js`

Primary dependencies:

- `document.createDocumentFragment()`
- Fragment append behavior (`appendChild`)
- `nodeType` checks

## 4.3 `element-class.js`

Primary dependencies:

- Parent/child tree ops: `parentNode`, `childNodes`, `insertBefore`, `appendChild`, `removeChild`
- Querying: `querySelector`, `querySelectorAll`, `getElementById`
- Attributes/styles: `getAttribute`, `setAttribute`, `hasAttribute`, `style`
- SVG geometry/transforms: `getBBox`, `getCTM`, `ownerSVGElement`
- Text/serialization: `nodeValue`, `attributes`, `inner/outer serialization paths`

## 4.4 `paper-class.js`

Primary dependencies:

- SVG root handling and defs management via DOM
- Image preload via `document.createElement("img")`, `body.appendChild/removeChild`
- `ownerDocument`, `createDocumentFragment`, `createElement("div")`, `cloneNode`, `innerHTML`
- `window.btoa` in `toDataURL`

## 4.5 `mouse.js`

Primary dependencies:

- Event system: `addEventListener`, `removeEventListener`, `dispatchEvent`
- Touch/mouse properties: `clientX/clientY`, touch lists, `buttons`
- Scrolling offsets: `document.documentElement/body.scrollTop/scrollLeft`
- Feature detection: `'ontouchstart' in window`, `navigator.maxTouchPoints`, `window.PointerEvent`
- Target containment checks: `contains`
- Synthetic click: `new MouseEvent(...)`

## 4.6 `mina.js`

Primary dependencies:

- Animation loop: `window.requestAnimationFrame` (with vendor-prefix fallbacks; degrades to `setTimeout(cb, 16)`)
- Animation cancel: `window.cancelAnimationFrame` (with vendor-prefix fallbacks; degrades to `clearTimeout(id)`)
- Timers bound as local wrappers: `window.setTimeout` → `nativeSetTimeout`, `window.clearTimeout` → `nativeClearTimeout`, `window.setInterval` → `nativeSetInterval`
- All timer/rAF APIs are accessed through `window`, making this file fully abstractable via `Snap.setWindow`.

## 4.7 `snap_extensions.js`

Primary dependencies:

- DOM relationship comparison: `node.compareDocumentPosition(otherNode)`
- Fallback relationship checks: `node.contains(otherNode)`
- Legacy order fallback: `node.sourceIndex` (used only when native position APIs are missing)

## 4.8 `element_extensions.js`

Primary dependencies:

- Parent/child relationship helpers (`isParentOf`, `isChildOf`) rely on `Snap._compareDomPosition`, which uses `compareDocumentPosition` and fallback `contains`
- Ancestor selector helpers (`selectParent`, `closest`) require `element.matches(selector)`
- Parent traversal continues to rely on `parentNode` via `Element.prototype.parent()`
- Screen/local coordinate helpers require SVG screen APIs: `node.getScreenCTM()`, `svg.createSVGPoint()`, and point `matrixTransform(...)`
- Screen CTM compensation path may construct `new DOMMatrix([...])`
- Reads viewport scroll from `window.scrollX` / `window.scrollY`
- Reads computed style through `window.getComputedStyle(...)`

## 4.9 `paper_extensions.js`

Primary dependencies:

- Uses `innerHTML` on foreignObject content (`el.node.innerHTML`, `root.node.innerHTML`) for HTML injection
- Relies on standard DOM tree access through `firstChild` when wiring `htmlInsert`

## 5) Minimal Contract for Alternate Environments

If you inject custom `window`/`document`, the minimum practical contract is:

1. Implement `WindowLike` + `DocumentLike` above.
2. Ensure created nodes implement `NodeLike` + `ElementLike`.
3. Ensure SVG nodes implement geometry APIs (`getBBox`, path length methods, `getCTM`).
4. Provide event listener APIs and mouse/touch event fields used by `mouse.js`.
5. Provide timer and animation frame APIs used by `mina.js` (`setTimeout`, `clearTimeout`, `setInterval`, `requestAnimationFrame`, `cancelAnimationFrame`).
6. Provide DOM relationship APIs used by extension helpers (`compareDocumentPosition`, `contains`, and `matches`; `sourceIndex` only for legacy fallback support).
7. Provide SVG screen-space APIs used by extension helpers (`getScreenCTM`, `createSVGPoint`, and point `matrixTransform`).
8. Provide constructor shims (`SVGElement`, `HTMLElement`, `ShadowRoot`, possibly `Element`, `URL`, and `DOMMatrix`) or adjust host bindings/checks.

## 6) Gaps / Risks for Full Browser Decoupling

- Core paths now resolve `XMLHttpRequest`, `atob`, `MouseEvent`, and `setInterval` from injected `glob.win`/`Snap.window()` first, with global fallback for compatibility. Remaining decoupling risk is primarily environments where no fallback globals exist and host shims are not provided.
- `instanceof` checks tie behavior to host constructors unless shimmed.
- CSS and text metrics rely on layout-capable DOM (`getComputedStyle`, `getBoundingClientRect`, `getBBox`). Headless non-layout DOMs will need polyfills or alternate code paths.

---

Generated from static inspection of the forked sources listed above (not upstream Snap.svg).
