// Copyright (c) 2013 - 2025 Adobe Systems Incorporated. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import eve from "./eve.js";
/* exported Snap */

export const Snap = ((root) => {
  // Replaced with package.json `version` at build time (see rollup.config.js).
  Snap.version = "__SNAP_VERSION__";
  /*\
     * Snap
     [ method ]
     **
     * Creates a drawing surface or wraps existing SVG element.
     **
     - width (number|string) width of surface
     - height (number|string) height of surface
     * or
     - DOM (SVGElement) element to be wrapped into Snap structure
     * or
     - array (array) array of elements (will return set of elements)
     * or
     - query (string) CSS query selector
     = (object) @Element
    \*/
  function Snap(w, h) {
    if (w) {
      if (w.nodeType) {
        return wrap(w);
      }
      if (is(w, "array") && Snap.set) {
        return Snap.set.apply(Snap, w);
      }
      if (w instanceof Element) {
        return w;
      }
      if (h == null) {
        try {
          const W = glob.doc.querySelector(String(w));
          return wrap(W);
        } catch (_e) {
          return null;
        }
      }
    }
    return new Paper(w == null ? "100%" : w, h == null ? "100%" : h);
  }
  Snap.toString = function () {
    return `Snap v${this.version}`;
  };
  Snap._ = {};
  const glob = {
    win: root.window,
    doc: root.window?.document,
  };
  Snap._.glob = glob;
  const has = "hasOwnProperty";
  const Str = String;
  const toFloat = Number.parseFloat;
  const toInt = Number.parseInt;
  const math = Math;
  const mmax = math.max;
  const mmin = math.min;
  const abs = math.abs;
  const PI = math.PI;
  const E = "";
  const objectToString = Object.prototype.toString;
  const colourRegExp =
    /^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgba?\(\s*([\d.]+%?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?(?:\s*,\s*[\d.]+%?)?)\s*\)|hsba?\(\s*([\d.]+(?:deg|\xb0|%)?\s*,\s*[\d.]+%?\s*,\s*[\d.]+(?:%?\s*,\s*[\d.]+)?%?)\s*\)|hsla?\(\s*([\d.]+(?:deg|\xb0|%)?\s*,\s*[\d.]+%?\s*,\s*[\d.]+(?:%?\s*,\s*[\d.]+)?%?)\s*\))\s*$/i;
  const commaSpaces = /[\s]*,[\s]*/;
  const hsrg = { hs: 1, rg: 1 };
  const pathCommand =
    /([a-z])[\s,]*((-?\d*\.?\d*(?:e[-+]?\d+)?[\s]*,?[\s]*)+)/gi;
  const tCommand = /([rstm])[\s,]*((-?\d*\.?\d*(?:e[-+]?\d+)?[\s]*,?[\s]*)+)/gi;
  const pathValues = /(-?\d*\.?\d*(?:e[-+]?\d+)?)[\s]*,?[\s]*/gi;
  let idgen = 0;
  const ID = () => `\u03a3nap--${idgen++}`;
  const xlink = "http://www.w3.org/1999/xlink";
  const xmlns = "http://www.w3.org/2000/svg";
  const hub = {};

  /*\
         * Snap.url
         [ method ]
         **
         * Wraps path into `"url('<path>')"`.
         - value (string) path
         = (string) wrapped path
        \*/
  Snap.url = (url) => `url('#${url}')`;
  Snap.prefixURL = (url) => {
    // Strip any fragment from the page URL: an SPA route or anchor such as
    // "http://app/#/page" would otherwise produce a broken "…#/page#id" ref.
    const prefix = (glob.win ? glob.win.location.href : "").replace(/#.*$/, "");
    return url.replace(/^(url\(')/, `$1${prefix}`);
  };

  const $ = (el2, attr) => {
    let el = el2;
    if (attr) {
      if (el == "#text") {
        el = glob.doc.createTextNode(attr.text || attr["#text"] || "");
      }
      if (el == "#comment") {
        el = glob.doc.createComment(attr.text || attr["#text"] || "");
      }
      if (typeof el == "string") {
        el = $(el);
      }
      if (typeof attr == "string") {
        if (el.nodeType == 1) {
          if (attr.startsWith("xlink:")) {
            return el.getAttributeNS(xlink, attr.substring(6));
          }
          if (attr.startsWith("xml:")) {
            return el.getAttributeNS(xmlns, attr.substring(4));
          }
          return el.getAttribute(attr);
        }
        if (attr == "text" || attr == "#text") {
          return el.nodeValue;
        }
        return null;
      }
      if (el.nodeType == 1) {
        for (const key in attr) {
          const val = Str(attr[key]);
          if (val) {
            if (key.startsWith("xlink:")) {
              el.setAttributeNS(xlink, key.substring(6), val);
            } else if (key.startsWith("xml:")) {
              el.setAttributeNS(xmlns, key.substring(4), val);
            } else {
              el.setAttribute(key, val);
            }
          } else {
            el.removeAttribute(key);
          }
        }
      } else if ("text" in attr) {
        el.nodeValue = attr.text;
      }
    } else {
      el = glob.doc.createElementNS(xmlns, el);
    }
    return el;
  };
  Snap._.$ = $;
  Snap._.id = ID;
  const is = (o, type2) => {
    // Fast paths for the canonical lowercase type names used throughout the
    // library, avoiding the per-call toLowerCase() and [object Type] fallback.
    if (type2 == "array") {
      return Array.isArray(o);
    }
    if (type2 == "finite") {
      return Number.isFinite(o);
    }
    if (type2 == "object") {
      // NB: strict === required — `prim == Object(prim)` is *true* (the wrapper
      // coerces back), so loose == misclassifies every primitive as an object.
      return o === Object(o);
    }
    if (type2 == typeof o && o != null) {
      return true;
    }
    // Slow path: normalize the type name and fall back to the full check.
    const type = Str.prototype.toLowerCase.call(type2);
    if (type == "finite") {
      return Number.isFinite(o);
    }
    if (type == "array" && Array.isArray(o)) {
      return true;
    }
    return (
      (type == "null" && o == null) ||
      (type == typeof o && o != null) ||
      (type == "object" && o === Object(o)) ||
      objectToString.call(o).slice(8, -1).toLowerCase() == type
    );
  };

  const clone = (obj) => {
    // NB: strict !== is required — `Object(prim) != prim` is *false* for
    // primitives (the wrapper coerces back), so loose `!=` would fail to
    // short-circuit and recurse into primitives until the stack overflows.
    if (typeof obj == "function" || Object(obj) !== obj) {
      return obj;
    }
    const res = new obj.constructor();
    for (const key in obj)
      if (obj[has](key)) {
        res[key] = clone(obj[key]);
      }
    return res;
  };
  Snap._.clone = clone;

  const repush = (array, item) => {
    for (let i = 0, ii = array.length; i < ii; i++)
      if (array[i] == item) {
        return array.push(array.splice(i, 1)[0]);
      }
  };
  const cacher = (f, scope, postprocessor) => {
    const newf = (...arg) => {
      const args = arg.join("\u2400");
      newf.cache = newf.cache || {};
      newf.count = newf.count || [];
      const cache = newf.cache;
      const count = newf.count;
      if (cache[has](args)) {
        repush(count, args);
        return postprocessor ? postprocessor(cache[args]) : cache[args];
      }
      count.length >= 1e3 && delete cache[count.shift()];
      count.push(args);
      cache[args] = f.apply(scope, arg);
      return postprocessor ? postprocessor(cache[args]) : cache[args];
    };
    return newf;
  };
  Snap._.cacher = cacher;
  const angle = (x1, y1, x2, y2, x3, y3) => {
    if (x3 == null) {
      const x = x1 - x2;
      const y = y1 - y2;
      if (!x && !y) {
        return 0;
      }
      return (180 + (math.atan2(-y, -x) * 180) / PI + 360) % 360;
    }
    return angle(x1, y1, x3, y3) - angle(x2, y2, x3, y3);
  };
  const rad = (deg) => ((deg % 360) * PI) / 180;
  const deg = (rad) => ((rad * 180) / PI) % 360;

  /*\
     * Snap.rad
     [ method ]
     **
     * Transform angle to radians
     - deg (number) angle in degrees
     = (number) angle in radians
    \*/
  Snap.rad = rad;
  /*\
     * Snap.deg
     [ method ]
     **
     * Transform angle to degrees
     - rad (number) angle in radians
     = (number) angle in degrees
    \*/
  Snap.deg = deg;
  /*\
     * Snap.sin
     [ method ]
     **
     * Equivalent to `Math.sin()` only works with degrees, not radians.
     - angle (number) angle in degrees
     = (number) sin
    \*/
  Snap.sin = (angle) => math.sin(Snap.rad(angle));
  /*\
     * Snap.tan
     [ method ]
     **
     * Equivalent to `Math.tan()` only works with degrees, not radians.
     - angle (number) angle in degrees
     = (number) tan
    \*/
  Snap.tan = (angle) => math.tan(Snap.rad(angle));
  /*\
     * Snap.cos
     [ method ]
     **
     * Equivalent to `Math.cos()` only works with degrees, not radians.
     - angle (number) angle in degrees
     = (number) cos
    \*/
  Snap.cos = (angle) => math.cos(Snap.rad(angle));
  /*\
     * Snap.asin
     [ method ]
     **
     * Equivalent to `Math.asin()` only works with degrees, not radians.
     - num (number) value
     = (number) asin in degrees
    \*/
  Snap.asin = (num) => Snap.deg(math.asin(num));
  /*\
     * Snap.acos
     [ method ]
     **
     * Equivalent to `Math.acos()` only works with degrees, not radians.
     - num (number) value
     = (number) acos in degrees
    \*/
  Snap.acos = (num) => Snap.deg(math.acos(num));
  /*\
     * Snap.atan
     [ method ]
     **
     * Equivalent to `Math.atan()` only works with degrees, not radians.
     - num (number) value
     = (number) atan in degrees
    \*/
  Snap.atan = (num) => Snap.deg(math.atan(num));
  /*\
     * Snap.atan2
     [ method ]
     **
     * Equivalent to `Math.atan2()` only works with degrees, not radians.
     - y (number) value
     - x (number) value
     = (number) atan2 in degrees
    \*/
  Snap.atan2 = (y, x) => Snap.deg(math.atan2(y, x));
  /*\
     * Snap.angle
     [ method ]
     **
     * Returns an angle between two or three points
     - x1 (number) x coord of first point
     - y1 (number) y coord of first point
     - x2 (number) x coord of second point
     - y2 (number) y coord of second point
     - x3 (number) #optional x coord of third point
     - y3 (number) #optional y coord of third point
     = (number) angle in degrees
    \*/
  Snap.angle = angle;
  /*\
     * Snap.len
     [ method ]
     **
     * Returns distance between two points
     - x1 (number) x coord of first point
     - y1 (number) y coord of first point
     - x2 (number) x coord of second point
     - y2 (number) y coord of second point
     = (number) distance
    \*/
  Snap.len = (x1, y1, x2, y2) => Math.sqrt(Snap.len2(x1, y1, x2, y2));
  /*\
     * Snap.len2
     [ method ]
     **
     * Returns squared distance between two points
     - x1 (number) x coord of first point
     - y1 (number) y coord of first point
     - x2 (number) x coord of second point
     - y2 (number) y coord of second point
     = (number) distance
    \*/
  Snap.len2 = (x1, y1, x2, y2) => (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
  /*\
     * Snap.closestPoint
     [ method ]
     **
     * Returns closest point to a given one on a given path.
     - path (Element) path element
     - x (number) x coord of a point
     - y (number) y coord of a point
     = (object) in format
     {
        x (number) x coord of the point on the path
        y (number) y coord of the point on the path
        length (number) length of the path to the point
        distance (number) distance from the given point to the path
     }
    \*/
  // Copied from http://bl.ocks.org/mbostock/8027637
  Snap.closestPoint = (path, x, y) => {
    const distance2 = (p) => {
      const dx = p.x - x;
      const dy = p.y - y;
      return dx * dx + dy * dy;
    };
    const pathNode = path.node;
    const pathLength = pathNode.getTotalLength();
    let precision = (pathLength / pathNode.pathSegList.numberOfItems) * 0.125;
    let best;
    let bestLength;
    let bestDistance = Number.POSITIVE_INFINITY;

    // linear scan for coarse approximation
    for (
      let scan, scanLength = 0, scanDistance;
      scanLength <= pathLength;
      scanLength += precision
    ) {
      scan = pathNode.getPointAtLength(scanLength);
      scanDistance = distance2(scan);
      if (scanDistance < bestDistance) {
        best = scan;
        bestLength = scanLength;
        bestDistance = scanDistance;
      }
    }

    // binary search for precise estimate
    precision *= 0.5;
    while (precision > 0.5) {
      let before;
      let after;
      let beforeLength;
      let afterLength;
      let beforeDistance;
      let afterDistance;
      beforeLength = bestLength - precision;
      if (beforeLength >= 0) {
        before = pathNode.getPointAtLength(beforeLength);
        beforeDistance = distance2(before);
      }
      if (beforeLength >= 0 && beforeDistance < bestDistance) {
        best = before;
        bestLength = beforeLength;
        bestDistance = beforeDistance;
      } else {
        afterLength = bestLength + precision;
        if (afterLength <= pathLength) {
          after = pathNode.getPointAtLength(afterLength);
          afterDistance = distance2(after);
        }
        if (afterLength <= pathLength && afterDistance < bestDistance) {
          best = after;
          bestLength = afterLength;
          bestDistance = afterDistance;
        } else {
          precision *= 0.5;
        }
      }
    }

    best = {
      x: best.x,
      y: best.y,
      length: bestLength,
      distance: Math.sqrt(bestDistance),
    };
    return best;
  };
  /*\
     * Snap.is
     [ method ]
     **
     * Handy replacement for the `typeof` operator
     - o (…) any object or primitive
     - type (string) name of the type, e.g., `string`, `function`, `number`, etc.
     = (boolean) `true` if given value is of given type
    \*/
  Snap.is = is;
  /*\
     * Snap.snapTo
     [ method ]
     **
     * Snaps given value to given grid
     - values (array|number) given array of values or step of the grid
     - value (number) value to adjust
     - tolerance (number) #optional maximum distance to the target value that would trigger the snap. Default is `10`.
     = (number) adjusted value
    \*/
  Snap.snapTo = (values, value, tolerance = 10) => {
    if (is(values, "array")) {
      let i = values.length;
      while (i--)
        if (abs(values[i] - value) <= tolerance) {
          return values[i];
        }
    } else {
      const cvalues = +values;
      const rem = value % cvalues;
      if (rem < tolerance) {
        return value - rem;
      }
      if (rem > cvalues - tolerance) {
        return value - rem + cvalues;
      }
    }
    return value;
  };
  // Colour
  /*\
     * Snap.getRGB
     [ method ]
     **
     * Parses color string as RGB object
     - color (string) color string in one of the following formats:
     # <ul>
     #     <li>Color name (<code>red</code>, <code>green</code>, <code>cornflowerblue</code>, etc)</li>
     #     <li>#••• — shortened HTML color: (<code>#000</code>, <code>#fc0</code>, etc.)</li>
     #     <li>#•••••• — full length HTML color: (<code>#000000</code>, <code>#bd2300</code>)</li>
     #     <li>rgb(•••, •••, •••) — red, green and blue channels values: (<code>rgb(200,&nbsp;100,&nbsp;0)</code>)</li>
     #     <li>rgba(•••, •••, •••, •••) — also with opacity</li>
     #     <li>rgb(•••%, •••%, •••%) — same as above, but in %: (<code>rgb(100%,&nbsp;175%,&nbsp;0%)</code>)</li>
     #     <li>rgba(•••%, •••%, •••%, •••%) — also with opacity</li>
     #     <li>hsb(•••, •••, •••) — hue, saturation and brightness values: (<code>hsb(0.5,&nbsp;0.25,&nbsp;1)</code>)</li>
     #     <li>hsba(•••, •••, •••, •••) — also with opacity</li>
     #     <li>hsb(•••%, •••%, •••%) — same as above, but in %</li>
     #     <li>hsba(•••%, •••%, •••%, •••%) — also with opacity</li>
     #     <li>hsl(•••, •••, •••) — hue, saturation and luminosity values: (<code>hsb(0.5,&nbsp;0.25,&nbsp;0.5)</code>)</li>
     #     <li>hsla(•••, •••, •••, •••) — also with opacity</li>
     #     <li>hsl(•••%, •••%, •••%) — same as above, but in %</li>
     #     <li>hsla(•••%, •••%, •••%, •••%) — also with opacity</li>
     # </ul>
     * Note that `%` can be used any time: `rgb(20%, 255, 50%)`.
     = (object) RGB object in the following format:
     o {
     o     r (number) red,
     o     g (number) green,
     o     b (number) blue,
     o     hex (string) color in HTML/CSS format: #••••••,
     o     error (boolean) true if string can't be parsed
     o }
    \*/
  Snap.getRGB = cacher((color) => {
    let colour = color;
    if (!colour || Str(colour).indexOf("-") + 1) {
      return {
        r: -1,
        g: -1,
        b: -1,
        hex: "none",
        error: 1,
        toString: rgbtoString,
      };
    }
    colour = Str(colour);
    if (colour == "none") {
      return { r: -1, g: -1, b: -1, hex: "none", toString: rgbtoString };
    }
    if (
      !(
        hsrg[has](colour.toLowerCase().substring(0, 2)) ||
        colour.charAt() == "#"
      )
    ) {
      colour = toHex(colour);
    }
    if (!colour) {
      return {
        r: -1,
        g: -1,
        b: -1,
        hex: "none",
        error: 1,
        toString: rgbtoString,
      };
    }
    let red;
    let green;
    let blue;
    let opacity;
    let _t;
    let values;
    let rgb = colour.match(colourRegExp);
    if (rgb) {
      if (rgb[2]) {
        blue = toInt(rgb[2].substring(5), 16);
        green = toInt(rgb[2].substring(3, 5), 16);
        red = toInt(rgb[2].substring(1, 3), 16);
      }
      if (rgb[3]) {
        const c1 = rgb[3].charAt(1);
        const c2 = rgb[3].charAt(2);
        const c3 = rgb[3].charAt(3);
        blue = toInt(c1 + c1, 16);
        green = toInt(c2 + c2, 16);
        red = toInt(c3 + c3, 16);
      }
      if (rgb[4]) {
        values = rgb[4].split(commaSpaces);
        red = toFloat(values[0]);
        if (values[0].slice(-1) == "%") {
          red *= 2.55;
        }
        green = toFloat(values[1]);
        if (values[1].slice(-1) == "%") {
          green *= 2.55;
        }
        blue = toFloat(values[2]);
        if (values[2].slice(-1) == "%") {
          blue *= 2.55;
        }
        if (rgb[1].toLowerCase().slice(0, 4) == "rgba") {
          opacity = toFloat(values[3]);
        }
        if (values[3] && values[3].slice(-1) == "%") {
          opacity /= 100;
        }
      }
      if (rgb[5]) {
        values = rgb[5].split(commaSpaces);
        red = toFloat(values[0]);
        if (values[0].slice(-1) == "%") {
          red /= 100;
        }
        green = toFloat(values[1]);
        if (values[1].slice(-1) == "%") {
          green /= 100;
        }
        blue = toFloat(values[2]);
        if (values[2].slice(-1) == "%") {
          blue /= 100;
        }
        if (values[0].slice(-3) == "deg" || values[0].slice(-1) == "\xb0") {
          red /= 360;
        }
        if (rgb[1].toLowerCase().slice(0, 4) == "hsba") {
          opacity = toFloat(values[3]);
        }
        if (values[3] && values[3].slice(-1) == "%") {
          opacity /= 100;
        }
        return Snap.hsb2rgb(red, green, blue, opacity);
      }
      if (rgb[6]) {
        values = rgb[6].split(commaSpaces);
        red = toFloat(values[0]);
        if (values[0].slice(-1) == "%") {
          red /= 100;
        }
        green = toFloat(values[1]);
        if (values[1].slice(-1) == "%") {
          green /= 100;
        }
        blue = toFloat(values[2]);
        if (values[2].slice(-1) == "%") {
          blue /= 100;
        }
        if (values[0].slice(-3) == "deg" || values[0].slice(-1) == "\xb0") {
          red /= 360;
        }
        if (rgb[1].toLowerCase().slice(0, 4) == "hsba") {
          opacity = toFloat(values[3]);
        }
        if (values[3] && values[3].slice(-1) == "%") {
          opacity /= 100;
        }
        return Snap.hsl2rgb(red, green, blue, opacity);
      }
      red = mmin(math.round(red), 255);
      green = mmin(math.round(green), 255);
      blue = mmin(math.round(blue), 255);
      opacity = mmin(mmax(opacity, 0), 1);
      rgb = { r: red, g: green, b: blue, toString: rgbtoString };
      rgb.hex = `#${(16777216 | blue | (green << 8) | (red << 16)).toString(16).slice(1)}`;
      rgb.opacity = is(opacity, "finite") ? opacity : 1;
      return rgb;
    }
    return {
      r: -1,
      g: -1,
      b: -1,
      hex: "none",
      error: 1,
      toString: rgbtoString,
    };
  }, Snap);
  /*\
     * Snap.hsb
     [ method ]
     **
     * Converts HSB values to a hex representation of the color
     - h (number) hue
     - s (number) saturation
     - b (number) value or brightness
     = (string) hex representation of the color
    \*/
  Snap.hsb = cacher((h, s, b) => Snap.hsb2rgb(h, s, b).hex);
  /*\
     * Snap.hsl
     [ method ]
     **
     * Converts HSL values to a hex representation of the color
     - h (number) hue
     - s (number) saturation
     - l (number) luminosity
     = (string) hex representation of the color
    \*/
  Snap.hsl = cacher((h, s, l) => Snap.hsl2rgb(h, s, l).hex);
  /*\
     * Snap.rgb
     [ method ]
     **
     * Converts RGB values to a hex representation of the color
     - r (number) red
     - g (number) green
     - b (number) blue
     = (string) hex representation of the color
    \*/
  Snap.rgb = cacher((r, g, b, o) => {
    if (is(o, "finite")) {
      const round = math.round;
      return `rgba(${[round(r), round(g), round(b), +o.toFixed(2)]})`;
    }
    return `#${(16777216 | b | (g << 8) | (r << 16)).toString(16).slice(1)}`;
  });
  let toHex = (color) => {
    const i =
      glob.doc.getElementsByTagName("head")[0] ||
      glob.doc.getElementsByTagName("svg")[0];
    const red = "rgb(255, 0, 0)";
    toHex = cacher((color) => {
      if (color.toLowerCase() == "red") {
        return red;
      }
      i.style.color = red;
      i.style.color = color;
      const out = glob.doc.defaultView
        .getComputedStyle(i, E)
        .getPropertyValue("color");
      return out == red ? null : out;
    });
    return toHex(color);
  };
  const hsbtoString = function () {
    return `hsb(${[this.h, this.s, this.b]})`;
  };
  const hsltoString = function () {
    return `hsl(${[this.h, this.s, this.l]})`;
  };
  const rgbtoString = function () {
    return this.opacity == 1 || this.opacity == null
      ? this.hex
      : `rgba(${[this.r, this.g, this.b, this.opacity]})`;
  };
  const prepareRGB = (r, g, b) => {
    let R = r;
    let G = g;
    let B = b;
    if (g == null && is(r, "object") && "r" in r && "g" in r && "b" in r) {
      B = r.b;
      G = r.g;
      R = r.r;
    }
    if (g == null && is(r, "string")) {
      const clr = Snap.getRGB(r);
      R = clr.r;
      G = clr.g;
      B = clr.b;
    }
    if (r > 1 || g > 1 || b > 1) {
      R /= 255;
      G /= 255;
      B /= 255;
    }

    return [R, G, B];
  };
  const packageRGB = (r, g, b, o) => {
    const R = math.round(r * 255);
    const G = math.round(g * 255);
    const B = math.round(b * 255);
    const rgb = {
      r: R,
      g: G,
      b: B,
      opacity: is(o, "finite") ? o : 1,
      hex: Snap.rgb(R, G, B),
      toString: rgbtoString,
    };
    if (is(o, "finite")) {
      rgb.opacity = o;
    }
    return rgb;
  };
  /*\
     * Snap.color
     [ method ]
     **
     * Parses the color string and returns an object featuring the color's component values
     - clr (string) color string in one of the supported formats (see @Snap.getRGB)
     = (object) Combined RGB/HSB object in the following format:
     o {
     o     r (number) red,
     o     g (number) green,
     o     b (number) blue,
     o     hex (string) color in HTML/CSS format: #••••••,
     o     error (boolean) `true` if string can't be parsed,
     o     h (number) hue,
     o     s (number) saturation,
     o     v (number) value (brightness),
     o     l (number) lightness
     o }
    \*/
  Snap.color = (color) => {
    let clr = color;
    let rgb;
    if (is(clr, "object") && "h" in clr && "s" in clr && "b" in clr) {
      rgb = Snap.hsb2rgb(clr);
      clr.r = rgb.r;
      clr.g = rgb.g;
      clr.b = rgb.b;
      clr.opacity = 1;
      clr.hex = rgb.hex;
    } else if (is(clr, "object") && "h" in clr && "s" in clr && "l" in clr) {
      rgb = Snap.hsl2rgb(clr);
      clr.r = rgb.r;
      clr.g = rgb.g;
      clr.b = rgb.b;
      clr.opacity = 1;
      clr.hex = rgb.hex;
    } else {
      if (is(clr, "string")) {
        clr = Snap.getRGB(clr);
      }
      if (
        is(clr, "object") &&
        "r" in clr &&
        "g" in clr &&
        "b" in clr &&
        !("error" in clr)
      ) {
        rgb = Snap.rgb2hsl(clr);
        clr.h = rgb.h;
        clr.s = rgb.s;
        clr.l = rgb.l;
        rgb = Snap.rgb2hsb(clr);
        clr.v = rgb.b;
      } else {
        clr = { hex: "none" };
        clr.r = clr.g = clr.b = clr.h = clr.s = clr.v = clr.l = -1;
        clr.error = 1;
      }
    }
    clr.toString = rgbtoString;
    return clr;
  };
  /*\
     * Snap.hsb2rgb
     [ method ]
     **
     * Converts HSB values to an RGB object
     - h (number) hue
     - s (number) saturation
     - v (number) value or brightness
     = (object) RGB object in the following format:
     o {
     o     r (number) red,
     o     g (number) green,
     o     b (number) blue,
     o     hex (string) color in HTML/CSS format: #••••••
     o }
    \*/
  Snap.hsb2rgb = (H, S, V, O) => {
    let h = H;
    let s = S;
    let v = V;
    let o = O;
    if (is(h, "object") && "h" in h && "s" in h && "b" in h) {
      v = h.b;
      s = h.s;
      o = h.o;
      h = h.h;
    }
    h *= 360;
    let R;
    let G;
    let B;
    h = (h % 360) / 60;
    const C = v * s;
    const X = C * (1 - abs((h % 2) - 1));
    R = G = B = v - C;

    h = ~~h;
    R += [C, X, 0, 0, X, C][h];
    G += [X, C, C, X, 0, 0][h];
    B += [0, 0, X, C, C, X][h];
    return packageRGB(R, G, B, o);
  };
  /*\
     * Snap.hsl2rgb
     [ method ]
     **
     * Converts HSL values to an RGB object
     - h (number) hue
     - s (number) saturation
     - l (number) luminosity
     = (object) RGB object in the following format:
     o {
     o     r (number) red,
     o     g (number) green,
     o     b (number) blue,
     o     hex (string) color in HTML/CSS format: #••••••
     o }
    \*/
  Snap.hsl2rgb = (H, S, L, o) => {
    let h = H;
    let s = S;
    let l = L;
    if (is(h, "object") && "h" in h && "s" in h && "l" in h) {
      l = h.l;
      s = h.s;
      h = h.h;
    }
    if (h > 1 || s > 1 || l > 1) {
      h /= 360;
      s /= 100;
      l /= 100;
    }
    h *= 360;
    let R;
    let G;
    let B;
    h = (h % 360) / 60;
    const C = 2 * s * (l < 0.5 ? l : 1 - l);
    const X = C * (1 - abs((h % 2) - 1));
    R = G = B = l - C / 2;

    h = ~~h;
    R += [C, X, 0, 0, X, C][h];
    G += [X, C, C, X, 0, 0][h];
    B += [0, 0, X, C, C, X][h];
    return packageRGB(R, G, B, o);
  };
  /*\
     * Snap.rgb2hsb
     [ method ]
     **
     * Converts RGB values to an HSB object
     - r (number) red
     - g (number) green
     - b (number) blue
     = (object) HSB object in the following format:
     o {
     o     h (number) hue,
     o     s (number) saturation,
     o     b (number) brightness
     o }
    \*/
  Snap.rgb2hsb = (R, G, B) => {
    let r = R;
    let g = G;
    let b = B;
    b = prepareRGB(r, g, b);
    r = b[0];
    g = b[1];
    b = b[2];

    let H;
    const V = mmax(r, g, b);
    const C = V - mmin(r, g, b);
    H =
      C == 0
        ? null
        : V == r
          ? (g - b) / C
          : V == g
            ? (b - r) / C + 2
            : (r - g) / C + 4;
    H = (((H + 360) % 6) * 60) / 360;
    const S = C == 0 ? 0 : C / V;
    return { h: H, s: S, b: V, toString: hsbtoString };
  };
  /*\
     * Snap.rgb2hsl
     [ method ]
     **
     * Converts RGB values to an HSL object
     - r (number) red
     - g (number) green
     - b (number) blue
     = (object) HSL object in the following format:
     o {
     o     h (number) hue,
     o     s (number) saturation,
     o     l (number) luminosity
     o }
    \*/
  Snap.rgb2hsl = (R, G, B) => {
    let r = R;
    let g = G;
    let b = B;
    b = prepareRGB(r, g, b);
    r = b[0];
    g = b[1];
    b = b[2];

    const M = mmax(r, g, b);
    const m = mmin(r, g, b);
    const C = M - m;
    let H =
      C == 0
        ? null
        : M == r
          ? (g - b) / C
          : M == g
            ? (b - r) / C + 2
            : (r - g) / C + 4;
    H = (((H + 360) % 6) * 60) / 360;
    const L = (M + m) / 2;
    const S = C == 0 ? 0 : L < 0.5 ? C / (2 * L) : C / (2 - 2 * L);
    return { h: H, s: S, l: L, toString: hsltoString };
  };

  // Transformations
  /*\
     * Snap.parsePathString
     [ method ]
     **
     * Utility method
     **
     * Parses given path string into an array of arrays of path segments
     - pathString (string|array) path string or array of segments (in the last case it is returned straight away)
     = (array) array of segments
    \*/
  Snap.parsePathString = (pathString) => {
    if (!pathString) {
      return null;
    }
    const pth = Snap.path(pathString);
    if (pth.arr) {
      return Snap.path.clone(pth.arr);
    }

    const paramCounts = {
      a: 7,
      c: 6,
      o: 2,
      h: 1,
      l: 2,
      m: 2,
      r: 4,
      q: 4,
      s: 4,
      t: 2,
      v: 1,
      u: 3,
      z: 0,
    };
    let data = [];
    if (is(pathString, "array") && is(pathString[0], "array")) {
      // rough assumption
      data = Snap.path.clone(pathString);
    }
    if (!data.length) {
      Str(pathString).replace(pathCommand, (_a, B, c) => {
        const params = [];
        let b = B;
        let name = b.toLowerCase();
        c.replace(pathValues, (_a, b) => {
          b && params.push(+b);
        });
        if (name == "m" && params.length > 2) {
          data.push([b].concat(params.splice(0, 2)));
          name = "l";
          b = b == "m" ? "l" : "L";
        }
        if (name == "o" && params.length == 1) {
          data.push([b, params[0]]);
        }
        if (name == "r") {
          data.push([b].concat(params));
        } else
          while (params.length >= paramCounts[name]) {
            data.push([b].concat(params.splice(0, paramCounts[name])));
            if (!paramCounts[name]) {
              break;
            }
          }
      });
    }
    data.toString = Snap.path.toString;
    pth.arr = Snap.path.clone(data);
    return data;
  };
  /*\
     * Snap.parseTransformString
     [ method ]
     **
     * Utility method
     **
     * Parses given transform string into an array of transformations
     - TString (string|array) transform string or array of transformations (in the last case it is returned straight away)
     = (array) array of transformations
    \*/
  Snap.parseTransformString = (TString) => {
    if (!TString) {
      return null;
    }
    let data = [];
    if (is(TString, "array") && is(TString[0], "array")) {
      // rough assumption
      data = Snap.path.clone(TString);
    }
    if (!data.length) {
      Str(TString).replace(tCommand, (_a, b, c) => {
        const params = [];
        c.replace(pathValues, (_a, b) => {
          b && params.push(+b);
        });
        data.push([b].concat(params));
      });
    }
    data.toString = Snap.path.toString;
    return data;
  };
  const parseTransformString = Snap.parseTransformString;
  const svgTransform2string = (tstring) => {
    let tstr = tstring;
    const res = [];
    tstr = tstr.replace(/(?:^|\s)(\w+)\(([^)]+)\)/g, (all, name, param) => {
      let params = param;
      params = params.split(/\s*,\s*|\s+/);
      if (name == "rotate" && params.length == 1) {
        params.push(0, 0);
      }
      if (name == "scale") {
        if (params.length > 2) {
          params = params.slice(0, 2);
        } else if (params.length == 2) {
          params.push(0, 0);
        }
        if (params.length == 1) {
          params.push(params[0], 0, 0);
        }
      }
      if (name == "skewX") {
        res.push(["m", 1, 0, math.tan(rad(params[0])), 1, 0, 0]);
      } else if (name == "skewY") {
        res.push(["m", 1, math.tan(rad(params[0])), 0, 1, 0, 0]);
      } else {
        res.push([name.charAt(0)].concat(params));
      }
      return all;
    });
    return res;
  };
  Snap._.svgTransform2string = svgTransform2string;
  Snap._.rgTransform = /^[a-z][\s]*-?\.?\d/i;
  const transform2matrix = (tstr, bbox) => {
    const tdata = parseTransformString(tstr);
    const m = new Snap.Matrix();
    if (tdata) {
      for (let i = 0, ii = tdata.length; i < ii; i++) {
        const t = tdata[i];
        const tlen = t.length;
        const command = Str(t[0]).toLowerCase();
        const absolute = t[0] != command;
        const inver = absolute ? m.invert() : 0;
        let x1;
        let y1;
        let x2;
        let y2;
        let bb;
        if (command == "t" && tlen == 2) {
          m.translate(t[1], 0);
        } else if (command == "t" && tlen == 3) {
          if (absolute) {
            x1 = inver.x(0, 0);
            y1 = inver.y(0, 0);
            x2 = inver.x(t[1], t[2]);
            y2 = inver.y(t[1], t[2]);
            m.translate(x2 - x1, y2 - y1);
          } else {
            m.translate(t[1], t[2]);
          }
        } else if (command == "r") {
          if (tlen == 2) {
            bb = bb || bbox;
            m.rotate(t[1], bb.x + bb.width / 2, bb.y + bb.height / 2);
          } else if (tlen == 4) {
            if (absolute) {
              x2 = inver.x(t[2], t[3]);
              y2 = inver.y(t[2], t[3]);
              m.rotate(t[1], x2, y2);
            } else {
              m.rotate(t[1], t[2], t[3]);
            }
          }
        } else if (command == "s") {
          if (tlen == 2 || tlen == 3) {
            bb = bb || bbox;
            m.scale(
              t[1],
              t[tlen - 1],
              bb.x + bb.width / 2,
              bb.y + bb.height / 2,
            );
          } else if (tlen == 4) {
            if (absolute) {
              x2 = inver.x(t[2], t[3]);
              y2 = inver.y(t[2], t[3]);
              m.scale(t[1], t[1], x2, y2);
            } else {
              m.scale(t[1], t[1], t[2], t[3]);
            }
          } else if (tlen == 5) {
            if (absolute) {
              x2 = inver.x(t[3], t[4]);
              y2 = inver.y(t[3], t[4]);
              m.scale(t[1], t[2], x2, y2);
            } else {
              m.scale(t[1], t[2], t[3], t[4]);
            }
          }
        } else if (command == "m" && tlen == 7) {
          m.add(t[1], t[2], t[3], t[4], t[5], t[6]);
        }
      }
    }
    return m;
  };
  Snap._.transform2matrix = transform2matrix;
  Snap._unit2px = unit2px;
  // var contains = glob.doc.contains || glob.doc.compareDocumentPosition ?
  //     function (a, b) {
  //         var adown = a.nodeType == 9 ? a.documentElement : a,
  //             bup = b && b.parentNode;
  //             return a == bup || !!(bup && bup.nodeType == 1 && (
  //                 adown.contains ?
  //                     adown.contains(bup) :
  //                     a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16
  //             ));
  //     } :
  //     function (a, b) {
  //         if (b) {
  //             while (b) {
  //                 b = b.parentNode;
  //                 if (b == a) {
  //                     return true;
  //                 }
  //             }
  //         }
  //         return false;
  //     };
  const getSomeDefs = (el) => {
    const p =
      (el.node.ownerSVGElement && wrap(el.node.ownerSVGElement)) ||
      (el.node.parentNode && wrap(el.node.parentNode)) ||
      Snap.select("svg") ||
      Snap(0, 0);
    const pdefs = p.select("defs");
    let defs = pdefs == null ? false : pdefs.node;
    if (!defs) {
      defs = make("defs", p.node).node;
    }
    return defs;
  };
  const getSomeSVG = (el) =>
    (el.node.ownerSVGElement && wrap(el.node.ownerSVGElement)) ||
    Snap.select("svg");
  Snap._.getSomeDefs = getSomeDefs;
  Snap._.getSomeSVG = getSomeSVG;
  function unit2px(el, name, value) {
    const svg = getSomeSVG(el).node;
    let out = {};
    const $ = Snap._.$;
    let mgr = svg.querySelector(".svg---mgr");
    if (!mgr) {
      mgr = $("rect");
      $(mgr, {
        x: -9e9,
        y: -9e9,
        width: 10,
        height: 10,
        class: "svg---mgr",
        fill: "none",
      });
      svg.appendChild(mgr);
    }
    const getW = (val) => {
      if (val == null) {
        return E;
      }
      if (val == +val) {
        return val;
      }
      $(mgr, { width: val });
      try {
        return mgr.getBBox().width;
      } catch (_e) {
        return 0;
      }
    };
    const getH = (val) => {
      if (val == null) {
        return E;
      }
      if (val == +val) {
        return val;
      }
      $(mgr, { height: val });
      try {
        return mgr.getBBox().height;
      } catch (_e) {
        return 0;
      }
    };
    const set = (nam, f) => {
      if (name == null) {
        out[nam] = f(el.attr(nam) || 0);
      } else if (nam == name) {
        out = f(value == null ? el.attr(nam) || 0 : value);
      }
    };
    switch (el.type) {
      case "rect":
        set("rx", getW);
        set("ry", getH);
      case "image":
        set("width", getW);
        set("height", getH);
      case "text":
        set("x", getW);
        set("y", getH);
        break;
      case "circle":
        set("cx", getW);
        set("cy", getH);
        set("r", getW);
        break;
      case "ellipse":
        set("cx", getW);
        set("cy", getH);
        set("rx", getW);
        set("ry", getH);
        break;
      case "line":
        set("x1", getW);
        set("x2", getW);
        set("y1", getH);
        set("y2", getH);
        break;
      case "marker":
        set("refX", getW);
        set("markerWidth", getW);
        set("refY", getH);
        set("markerHeight", getH);
        break;
      case "radialGradient":
        set("fx", getW);
        set("fy", getH);
        break;
      case "tspan":
        set("dx", getW);
        set("dy", getH);
        break;
      default:
        set(name, getW);
    }
    svg.removeChild(mgr);
    return out;
  }
  /*\
     * Snap.select
     [ method ]
     **
     * Wraps a DOM element specified by CSS selector as @Element
     - query (string) CSS selector of the element
     = (Element) the current element
    \*/
  Snap.select = (query) =>
    wrap(glob.doc.querySelector(Str(query).replace(/([^\\]):/g, "$1\\:")));
  /*\
     * Snap.selectAll
     [ method ]
     **
     * Wraps DOM elements specified by CSS selector as set or array of @Element
     - query (string) CSS selector of the element
     = (Element) the current element
    \*/
  Snap.selectAll = (query) => {
    const nodelist = glob.doc.querySelectorAll(query);
    const set = (Snap.set || Array)();
    for (let i = 0; i < nodelist.length; i++) {
      set.push(wrap(nodelist[i]));
    }
    return set;
  };

  function add2group(...items) {
    let list = items;
    if (is(items[0], "array") && items.length == 1) {
      list = items[0];
    }
    let i = 0;
    let j = 0;
    const node = this.node;
    while (this[i]) delete this[i++];
    for (i = 0; i < list.length; i++) {
      if (list[i].type == "set") {
        for (const el of list[i]) {
          node.appendChild(el.node);
        }
      } else {
        node.appendChild(list[i].node);
      }
    }
    const children = node.childNodes;
    for (i = 0; i < children.length; i++) {
      this[j++] = wrap(children[i]);
    }
    return this;
  }
  // Hub garbage collector every 10s
  setInterval(() => {
    for (const key in hub)
      if (hub[has](key)) {
        const el = hub[key];
        const node = el.node;
        if (
          (el.type != "svg" && !node.ownerSVGElement) ||
          (el.type == "svg" &&
            (!node.parentNode ||
              ("ownerSVGElement" in node.parentNode && !node.ownerSVGElement)))
        ) {
          delete hub[key];
        }
      }
  }, 1e4);
  function Element(el) {
    if (el.snap in hub) {
      return hub[el.snap];
    }
    let svg;
    try {
      svg = el.ownerSVGElement;
    } catch (_e) {}
    /*\
         * Element.node
         [ property (object) ]
         **
         * Gives you a reference to the DOM object, so you can assign event handlers or just mess around.
         > Usage
         | // draw a circle at coordinate 10,10 with radius of 10
         | var c = paper.circle(10, 10, 10);
         | c.node.onclick = function () {
         |     c.attr("fill", "red");
         | };
        \*/
    this.node = el;
    if (svg) {
      this.paper = new Paper(svg);
    }
    /*\
         * Element.type
         [ property (string) ]
         **
         * SVG tag name of the given element.
        \*/
    this.type = el.tagName || el.nodeName;
    this.id = ID(this);
    const id = this.id;
    this.anims = {};
    this._ = {
      transform: [],
    };
    el.snap = id;
    hub[id] = this;
    if (this.type == "g") {
      this.add = add2group;
    }
    if (this.type in { g: 1, mask: 1, pattern: 1, symbol: 1 }) {
      for (const method in Paper.prototype)
        if (Paper.prototype[has](method)) {
          this[method] = Paper.prototype[method];
        }
    }
  }
  /*\
     * Element.attr
     [ method ]
     **
     * Gets or sets given attributes of the element.
     **
     - params (object) contains key-value pairs of attributes you want to set
     * or
     - param (string) name of the attribute
     = (Element) the current element
     * or
     = (string) value of attribute
     > Usage
     | el.attr({
     |     fill: "#fc0",
     |     stroke: "#000",
     |     strokeWidth: 2, // CamelCase...
     |     "fill-opacity": 0.5, // or dash-separated names
     |     width: "*=2" // prefixed values
     | });
     | console.log(el.attr("fill")); // #fc0
     * Prefixed values in format `"+=10"` supported. All four operations
     * (`+`, `-`, `*` and `/`) could be used. Optionally you can use units for `+`
     * and `-`: `"+=2em"`.
    \*/
  // Fast path for attribute setting. The normal route fires an eve event per
  // attribute (snap.util.attr.<name>), which walks the listener tree and runs
  // the two wildcard handlers (the default DOM setter above and the
  // relative-value "+=10" handler in attradd.js) plus any dedicated handler.
  // For common cases the handler would only end up doing a plain setAttribute,
  // so we skip the whole dispatch and write straight to the DOM.
  const fastAttrCache = {};
  let baseAttrListeners = -1;
  const isFastAttr = (name) => {
    let fast = fastAttrCache[name];
    if (fast === undefined) {
      if (baseAttrListeners < 0) {
        // Handlers that fire for every attribute (the wildcard handlers).
        baseAttrListeners = eve.listeners(["snap", "util", "attr"]).length;
      }
      fast = fastAttrCache[name] =
        !attrConv(name).isCss &&
        eve.listeners(["snap", "util", "attr", name]).length <=
          baseAttrListeners;
    }
    return fast;
  };
  // #rgb / #rrggbb hex colours; "r", "u", "o" mark path commands that need
  // toAbsolute() (the only transform snap.util.attr.d applies to a string).
  const reHexColor = /^#[\da-f]{3}(?:[\da-f]{3})?$/i;
  const rePathRUO = /[ruo]/i;
  // Returns true when the attribute was written directly (eve bypassed). The
  // fast lane writes with node.setAttribute() instead of $(node, {...}): the
  // names handled here are never namespaced (xlink:/xml:), so we skip $'s
  // per-call object allocation, Str() coercion and prefix checks. Numbers are
  // stringified by the DOM itself.
  const setFast = (el, node, name, value) => {
    if (typeof value === "number") {
      // Numbers are never relative ("+=5") syntax, path arrays, colour
      // descriptors or text, so no dedicated/wildcard handler treats them
      // specially beyond a setAttribute.
      if (isFastAttr(name)) {
        node.setAttribute(name, value);
        return true;
      }
      // `r` only has special meaning on <rect> (it maps to rx/ry); on circles
      // and every other shape it is a plain numeric attribute.
      if (name === "r" && el.type !== "rect") {
        node.setAttribute("r", value);
        return true;
      }
      return false;
    }
    if (typeof value === "string") {
      // Plain hex colours need none of fillStroke's gradient / Element / parse
      // handling. Stored verbatim (not normalised through Snap.color, which is
      // both the slow part and currently mis-parses 3-digit hex).
      if ((name === "fill" || name === "stroke") && reHexColor.test(value)) {
        node.setAttribute(name, value);
        node.style[name] = E;
        return true;
      }
      // A `d` string with no r/u/o commands is set verbatim by the handler too.
      if (name === "d" && !rePathRUO.test(value)) {
        node.setAttribute("d", value);
        return true;
      }
    }
    return false;
  };
  Element.prototype.attr = function (parameters, value) {
    const params = parameters;
    const node = this.node;
    if (!params) {
      if (node.nodeType != 1) {
        return {
          text: node.nodeValue,
        };
      }
      const attr = node.attributes;
      const out = {};
      for (let i = 0, ii = attr.length; i < ii; i++) {
        out[attr[i].nodeName] = attr[i].nodeValue;
      }
      return out;
    }
    if (is(params, "string")) {
      if (value != null) {
        if (setFast(this, node, params, value)) {
          return this;
        }
        // Single-attribute setter: fire directly with a pre-split event name
        // so eve.listeners skips the regex split, and skip the throwaway map.
        eve(["snap", "util", "attr", params], this, value);
        return this;
      }
      return eve(["snap", "util", "getattr", params], this).firstDefined();
    }
    for (const att in params) {
      if (params[has](att)) {
        const v = params[att];
        if (!setFast(this, node, att, v)) {
          eve(["snap", "util", "attr", att], this, v);
        }
      }
    }
    return this;
  };
  /*\
     * Snap.parse
     [ method ]
     **
     * Parses SVG fragment and converts it into a @Fragment
     **
     - svg (string) SVG string
     = (Fragment) the @Fragment
    \*/
  Snap.parse = (svgtext) => {
    let svg = svgtext;
    let f = glob.doc.createDocumentFragment();
    let full = true;
    const div = glob.doc.createElement("div");
    svg = Str(svg);
    if (!svg.match(/^\s*<\s*svg(?:\s|>)/)) {
      svg = `<svg>${svg}</svg>`;
      full = false;
    }
    div.innerHTML = svg;
    svg = div.getElementsByTagName("svg")[0];
    if (svg) {
      if (full) {
        f = svg;
      } else {
        while (svg.firstChild) {
          f.appendChild(svg.firstChild);
        }
      }
    }
    return new Fragment(f);
  };
  function Fragment(frag) {
    this.node = frag;
  }
  /*\
     * Snap.fragment
     [ method ]
     **
     * Creates a DOM fragment from a given list of elements or strings
     **
     - varargs (…) SVG string
     = (Fragment) the @Fragment
    \*/
  Snap.fragment = (...args) => {
    const f = glob.doc.createDocumentFragment();
    for (let i = 0, ii = args.length; i < ii; i++) {
      const item = args[i];
      if (item.node?.nodeType) {
        f.appendChild(item.node);
      }
      if (item.nodeType) {
        f.appendChild(item);
      }
      if (typeof item == "string") {
        f.appendChild(Snap.parse(item).node);
      }
    }
    return new Fragment(f);
  };

  const make = (name, parent, attr) => {
    const res = Snap._.$(name, attr);
    parent.appendChild(res);
    return wrap(res);
  };
  function Paper(w, h) {
    let res;
    const $ = Snap._.$;
    const proto = Paper.prototype;
    let doc;
    if (w?.tagName?.toLowerCase() == "svg") {
      if (w.snap in hub) {
        return hub[w.snap];
      }
      doc = w.ownerDocument;
      res = new Element(w);
    } else {
      res = make("svg", glob.doc.body);
      doc = glob.doc;
      $(res.node, {
        height: h,
        version: 1.1,
        width: w,
        xmlns,
      });
    }
    let desc = res.node.getElementsByTagName("desc")[0];
    let defs = res.node.getElementsByTagName("defs")[0];
    if (!desc) {
      desc = $("desc");
      desc.appendChild(doc.createTextNode("Created with Snap"));
      res.node.appendChild(desc);
    }
    if (!defs) {
      defs = $("defs");
      res.node.appendChild(defs);
    }
    res.defs = defs;
    for (const key in proto)
      if (proto[has](key)) {
        res[key] = proto[key];
      }
    res.paper = res.root = res;
    const id = ID(res);
    res.snap = id;
    hub[id] = res;
    return res;
  }

  const wrap = (dom) => {
    if (!dom) {
      return dom;
    }
    if (dom instanceof Element || dom instanceof Fragment) {
      return dom;
    }
    const tagName = dom.tagName?.toLowerCase();
    if (tagName == "svg") {
      return new Paper(dom);
    }
    if (tagName == "object" && dom.type == "image/svg+xml") {
      return new Paper(dom.contentDocument.getElementsByTagName("svg")[0]);
    }
    return new Element(dom);
  };

  Snap._.make = make;
  Snap._.wrap = wrap;
  /*\
     * Paper.el
     [ method ]
     **
     * Creates an element on paper with a given name and no attributes
     **
     - name (string) tag name
     - attr (object) attributes
     = (Element) the current element
     > Usage
     | var c = paper.circle(10, 10, 10); // is the same as...
     | var c = paper.el("circle").attr({
     |     cx: 10,
     |     cy: 10,
     |     r: 10
     | });
     | // and the same as
     | var c = paper.el("circle", {
     |     cx: 10,
     |     cy: 10,
     |     r: 10
     | });
    \*/
  Paper.prototype.el = function (name, attr) {
    // Apply attributes through .attr() (the eve pipeline) rather than passing
    // them raw to $(), so handlers like snap.util.attr.d (path array -> string)
    // and snap.util.attr.text (text content) run. $() only does setAttribute,
    // which would stringify a path array to "M,12,13,..." and write text as an
    // attribute instead of a text node.
    const el = make(name, this.node);
    return attr ? el.attr(attr) : el;
  };
  /*\
     * Element.children
     [ method ]
     **
     * Returns array of all the children of the element.
     = (array) array of Elements
    \*/
  Element.prototype.children = function () {
    const out = [];
    const ch = this.node.childNodes;
    for (let i = 0, ii = ch.length; i < ii; i++) {
      out[i] = Snap(ch[i]);
    }
    return out;
  };
  const jsonFiller = (root, o) => {
    for (let i = 0, ii = root.length; i < ii; i++) {
      const item = {
        type: root[i].type,
        attr: root[i].attr(),
      };
      const children = root[i].children();
      o.push(item);
      if (children.length) {
        item.childNodes = [];
        jsonFiller(children, item.childNodes);
      }
    }
  };
  /*\
     * Element.toJSON
     [ method ]
     **
     * Returns object representation of the given element and all its children.
     = (object) in format
     o {
     o     type (string) this.type,
     o     attr (object) attributes map,
     o     childNodes (array) optional array of children in the same format
     o }
    \*/
  Element.prototype.toJSON = function () {
    const out = [];
    jsonFiller([this], out);
    return out[0];
  };
  // default
  eve.on("snap.util.getattr", function () {
    let att = eve.nt();
    att = att.substring(att.lastIndexOf(".") + 1);
    const conv = attrConv(att);
    if (conv.isCss) {
      return this.node.ownerDocument.defaultView
        .getComputedStyle(this.node, null)
        .getPropertyValue(conv.css);
    }
    return Snap._.$(this.node, att);
  });
  const cssAttr = {
    "alignment-baseline": 0,
    "baseline-shift": 0,
    clip: 0,
    "clip-path": 0,
    "clip-rule": 0,
    color: 0,
    "color-interpolation": 0,
    "color-interpolation-filters": 0,
    "color-profile": 0,
    "color-rendering": 0,
    cursor: 0,
    direction: 0,
    display: 0,
    "dominant-baseline": 0,
    "enable-background": 0,
    fill: 0,
    "fill-opacity": 0,
    "fill-rule": 0,
    filter: 0,
    "flood-color": 0,
    "flood-opacity": 0,
    font: 0,
    "font-family": 0,
    "font-size": 0,
    "font-size-adjust": 0,
    "font-stretch": 0,
    "font-style": 0,
    "font-variant": 0,
    "font-weight": 0,
    "glyph-orientation-horizontal": 0,
    "glyph-orientation-vertical": 0,
    "image-rendering": 0,
    kerning: 0,
    "letter-spacing": 0,
    "lighting-color": 0,
    marker: 0,
    "marker-end": 0,
    "marker-mid": 0,
    "marker-start": 0,
    mask: 0,
    opacity: 0,
    overflow: 0,
    "pointer-events": 0,
    "shape-rendering": 0,
    "stop-color": 0,
    "stop-opacity": 0,
    stroke: 0,
    "stroke-dasharray": 0,
    "stroke-dashoffset": 0,
    "stroke-linecap": 0,
    "stroke-linejoin": 0,
    "stroke-miterlimit": 0,
    "stroke-opacity": 0,
    "stroke-width": 0,
    "text-anchor": 0,
    "text-decoration": 0,
    "text-rendering": 0,
    "unicode-bidi": 0,
    visibility: 0,
    "word-spacing": 0,
    "writing-mode": 0,
  };
  // The camelCase (style) and dash-case (css) forms of an attribute name, plus
  // whether it is a CSS property, are derived from two regexes and a lookup.
  // The set of attribute names is small and bounded, so memoize per name to
  // keep the hot attr get/set path free of regex work after first use.
  const attrConvCache = {};
  const attrConv = (att) => {
    let conv = attrConvCache[att];
    if (!conv) {
      const css = att.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      conv = attrConvCache[att] = {
        style: att.replace(/-(\w)/gi, (_all, letter) => letter.toUpperCase()),
        css,
        isCss: cssAttr[has](css),
      };
    }
    return conv;
  };

  eve.on("snap.util.attr", function (value) {
    let att = eve.nt();
    att = att.substring(att.lastIndexOf(".") + 1);
    const conv = attrConv(att);
    if (conv.isCss) {
      this.node.style[conv.style] = value == null ? E : value;
    } else {
      Snap._.$(this.node, { [att]: value });
    }
  });
  ((_proto) => {})(Paper.prototype);

  // simple ajax
  /*\
     * Snap.ajax
     [ method ]
     **
     * Simple implementation of Ajax
     **
     - url (string) URL
     - postData (object|string) data for post request
     - callback (function) callback
     - scope (object) #optional scope of callback
     * or
     - url (string) URL
     - callback (function) callback
     - scope (object) #optional scope of callback
     = (XMLHttpRequest) the XMLHttpRequest object, just in case
    \*/
  Snap.ajax = (url, postData, callback, scope) => {
    let postData2 = postData;
    let callback2 = callback;
    let scope2 = scope;
    const req = new XMLHttpRequest();
    const id = ID();
    if (req) {
      if (is(postData2, "function")) {
        scope2 = callback2;
        callback2 = postData2;
        postData2 = null;
      } else if (is(postData2, "object")) {
        const pd = [];
        for (const key in postData2) {
          pd.push(
            `${encodeURIComponent(key)}=${encodeURIComponent(postData2[key])}`,
          );
        }
        postData2 = pd.join("&");
      }
      req.open(postData2 ? "POST" : "GET", url, true);
      if (postData2) {
        req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        req.setRequestHeader(
          "Content-type",
          "application/x-www-form-urlencoded",
        );
      }
      if (callback2) {
        eve.once(`snap.ajax.${id}.0`, callback2);
        eve.once(`snap.ajax.${id}.200`, callback2);
        eve.once(`snap.ajax.${id}.304`, callback2);
      }
      req.onreadystatechange = () => {
        if (req.readyState != 4) return;
        eve(`snap.ajax.${id}.${req.status}`, scope2, req);
      };
      if (req.readyState == 4) {
        return req;
      }
      req.send(postData2);
      return req;
    }
  };
  /*\
     * Snap.load
     [ method ]
     **
     * Loads external SVG file as a @Fragment (see @Snap.ajax for more advanced AJAX)
     **
     - url (string) URL
     - callback (function) callback
     - scope (object) #optional scope of callback
     = (XMLHttpRequest) the XMLHttpRequest object, just in case
    \*/
  Snap.load = (url, callback, scope) =>
    Snap.ajax(url, (req) => {
      const f = Snap.parse(req.responseText);
      scope ? callback.call(scope, f) : callback(f);
    });
  const getOffset = (elem) => {
    const box = elem.getBoundingClientRect();
    const doc = elem.ownerDocument;
    const body = doc.body;
    const docElem = doc.documentElement;
    const clientTop = docElem.clientTop || body.clientTop || 0;
    const clientLeft = docElem.clientLeft || body.clientLeft || 0;
    const top =
      box.top +
      (glob.win.pageYOffset || docElem.scrollTop || body.scrollTop) -
      clientTop;
    const left =
      box.left +
      (glob.win.pageXOffset || docElem.scrollLeft || body.scrollLeft) -
      clientLeft;
    return {
      y: top,
      x: left,
    };
  };
  /*\
     * Snap.getElementByPoint
     [ method ]
     **
     * Returns you topmost element under given point.
     **
     = (object) Snap element object
     - x (number) x coordinate from the top left corner of the window
     - y (number) y coordinate from the top left corner of the window
     > Usage
     | Snap.getElementByPoint(mouseX, mouseY).attr({stroke: "#f00"});
    \*/
  Snap.getElementByPoint = (x, y) => {
    let target = glob.doc.elementFromPoint(x, y);
    if (glob.win.opera && target.tagName == "svg") {
      const so = getOffset(target);
      const sr = target.createSVGRect();
      sr.x = x - so.x;
      sr.y = y - so.y;
      sr.width = sr.height = 1;
      const hits = target.getIntersectionList(sr, null);
      if (hits.length) {
        target = hits[hits.length - 1];
      }
    }
    if (!target) {
      return null;
    }
    return wrap(target);
  };
  /*\
     * Snap.plugin
     [ method ]
     **
     * Let you write plugins. You pass in a function with five arguments, like this:
     | Snap.plugin(function (Snap, Element, Paper, global, Fragment) {
     |     Snap.newmethod = function () {};
     |     Element.prototype.newmethod = function () {};
     |     Paper.prototype.newmethod = function () {};
     | });
     * Inside the function you have access to all main objects (and their
     * prototypes). This allow you to extend anything you want.
     **
     - f (function) your plugin body
    \*/
  Snap.plugin = (f) => {
    f(Snap, Element, Paper, glob, Fragment);
  };
  return Snap;
})(globalThis);
