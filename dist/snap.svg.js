/*!
 * Snap.svg v1.0.0
 * Copyright (c) 2013 – 2025 Adobe Systems Incorporated. All rights reserved.
 * Licensed under the Apache License, Version 2.0
 * https://www.apache.org/licenses/LICENSE-2.0
 */

var Snap = (function () {
  'use strict';

  // Copyright (c) 2025 Adobe Systems Incorporated. All rights reserved.
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
  // ┌────────────────────────────────────────────────────────────┐ \\
  // │ Eve 1.0.0 - JavaScript Events Library                               │ \\
  // ├────────────────────────────────────────────────────────────┤ \\
  // │ Author Dmitry Baranovskiy (http://dmitry.baranovskiy.com/)          │ \\
  // └────────────────────────────────────────────────────────────┘ \\

  const version = "1.0.0";
  const has = "hasOwnProperty";
  let separator = /[./]/;
  const comaseparator = /\s*,\s*/;
  const wildcard = "*";
  const numsort = (a, b) => a - b;
  let current_event;
  let stop;
  let events = { n: {} };
  const firstDefined = function () {
    for (let i = 0, ii = this.length; i < ii; i++) {
      if (typeof this[i] != "undefined") {
        return this[i];
      }
    }
  };
  const lastDefined = function () {
    let i = this.length;
    while (--i) {
      if (typeof this[i] != "undefined") {
        return this[i];
      }
    }
  };
  const objtos = Object.prototype.toString;
  const Str = String;
  const isArray$1 =
    Array.isArray ||
    ((ar) => Array.isArray(ar) || objtos.call(ar) == "[object Array]");
  /*\
     * eve
     [ method ]

     * Fires event with given `name`, given scope and other parameters.

     - name (string) name of the *event*, dot (`.`) or slash (`/`) separated
     - scope (object) context for the event handlers
     - varargs (...) the rest of arguments will be sent to event handlers

     = (object) array of returned values from the listeners. Array has two methods `.firstDefined()` and `.lastDefined()` to get first or last not `undefined` value.
    \*/
  const eve = (name, scope, ...args) => {
    const oldstop = stop;
    const listeners = eve.listeners(name);
    let z = 0;
    let l;
    const indexed = [];
    const queue = {};
    const out = [];
    const ce = current_event;
    out.firstDefined = firstDefined;
    out.lastDefined = lastDefined;
    current_event = name;
    stop = 0;
    const ii = listeners.length;
    for (let i = 0; i < ii; i++)
      if ("zIndex" in listeners[i]) {
        indexed.push(listeners[i].zIndex);
        if (listeners[i].zIndex < 0) {
          queue[listeners[i].zIndex] = listeners[i];
        }
      }
    indexed.sort(numsort);
    while (indexed[z] < 0) {
      l = queue[indexed[z++]];
      out.push(l.apply(scope, args));
      if (stop) {
        stop = oldstop;
        return out;
      }
    }
    for (let i = 0; i < ii; i++) {
      l = listeners[i];
      if ("zIndex" in l) {
        if (l.zIndex == indexed[z]) {
          out.push(l.apply(scope, args));
          if (stop) {
            break;
          }
          do {
            z++;
            l = queue[indexed[z]];
            l && out.push(l.apply(scope, args));
            if (stop) {
              break;
            }
          } while (l);
        } else {
          queue[l.zIndex] = l;
        }
      } else {
        out.push(l.apply(scope, args));
        if (stop) {
          break;
        }
      }
    }
    stop = oldstop;
    current_event = ce;
    return out;
  };
  // Undocumented. Debug only.
  eve._events = events;
  /*\
     * eve.listeners
     [ method ]

     * Internal method which gives you array of all event handlers that will be triggered by the given `name`.

     - name (string) name of the event, dot (`.`) or slash (`/`) separated

     = (array) array of event handlers
    \*/
  eve.listeners = (name) => {
    const names = isArray$1(name) ? name : name.split(separator);
    let e = events;
    let item;
    let items;
    let k;
    let i;
    let ii;
    let j;
    let jj;
    let nes;
    let es = [e];
    const out = [];
    for (i = 0, ii = names.length; i < ii; i++) {
      nes = [];
      for (j = 0, jj = es.length; j < jj; j++) {
        e = es[j].n;
        items = [e[names[i]], e[wildcard]];
        k = 2;
        while (k--) {
          item = items[k];
          if (item) {
            nes.push(item);
            if (item.f) {
              out.push(...item.f);
            }
          }
        }
      }
      es = nes;
    }
    return out;
  };
  /*\
     * eve.separator
     [ method ]

     * If for some reasons you don’t like default separators (`.` or `/`) you can specify yours
     * here. Be aware that if you pass a string longer than one character it will be treated as
     * a list of characters.

     - separator (string) new separator. Empty string resets to default: `.` or `/`.
    \*/
  eve.separator = (separ) => {
    let sep = separ;
    if (sep) {
      sep = Str(sep).replace(/(?=[.^\][-])/g, "\\");
      sep = `[${sep}]`;
      separator = new RegExp(sep);
    } else {
      separator = /[./]/;
    }
  };
  /*\
     * eve.on
     [ method ]
     **
     * Binds given event handler with a given name. You can use wildcards “`*`” for the names:
     | eve.on("*.under.*", f);
     | eve("mouse.under.floor"); // triggers f
     * Use @eve to trigger the listener.
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
     **
     - name (array) if you don’t want to use separators, you can use array of strings
     - f (function) event handler function
     **
     = (function) returned function accepts a single numeric parameter that represents z-index of the handler. It is an optional feature and only used when you need to ensure that some subset of handlers will be invoked in a given order, despite of the order of assignment.
     > Example:
     | eve.on("mouse", eatIt)(2);
     | eve.on("mouse", scream);
     | eve.on("mouse", catchIt)(1);
     * This will ensure that `catchIt` function will be called before `eatIt`.
     *
     * If you want to put your handler before non-indexed handlers, specify a negative value.
     * Note: I assume most of the time you don’t need to worry about z-index, but it’s nice to have this feature “just in case”.
    \*/
  eve.on = (name, f) => {
    if (typeof f != "function") {
      return () => {};
    }
    const names = isArray$1(name)
      ? isArray$1(name[0])
        ? name
        : [name]
      : Str(name).split(comaseparator);
    for (let i = 0, ii = names.length; i < ii; i++) {
      ((name) => {
        const names = isArray$1(name) ? name : Str(name).split(separator);
        let e = events;
        let exist;
        for (let i = 0, ii = names.length; i < ii; i++) {
          e = e.n;
          if (!e[names[i]]) {
            e[names[i]] = { n: {} };
          }
          e = e[names[i]];
        }
        e.f = e.f || [];
        for (let i = 0, ii = e.f.length; i < ii; i++)
          if (e.f[i] == f) {
            exist = true;
            break;
          }
        !exist && e.f.push(f);
      })(names[i]);
    }
    return (zIndex) => {
      if (+zIndex == +zIndex) {
        f.zIndex = +zIndex;
      }
    };
  };
  /*\
     * eve.f
     [ method ]
     **
     * Returns function that will fire given event with optional arguments.
     * Arguments that will be passed to the result function will be also
     * concated to the list of final arguments.
     | el.onclick = eve.f("click", 1, 2);
     | eve.on("click", function (a, b, c) {
     |     console.log(a, b, c); // 1, 2, [event object]
     | });
     - event (string) event name
     - varargs (…) and any other arguments
     = (function) possible event handler function
    \*/
  eve.f = (event, ...attrs) => {
    return () => {
      eve(event, null, ...attrs, event, ...attrs);
    };
  };
  /*\
     * eve.stop
     [ method ]
     **
     * Is used inside an event handler to stop the event, preventing any subsequent listeners from firing.
    \*/
  eve.stop = () => {
    stop = 1;
  };
  /*\
     * eve.nt
     [ method ]
     **
     * Could be used inside event handler to figure out actual name of the event.
     **
     - subname (string) #optional subname of the event
     **
     = (string) name of the event, if `subname` is not specified
     * or
     = (boolean) `true`, if current event’s name contains `subname`
    \*/
  eve.nt = (subname) => {
    const cur = isArray$1(current_event) ? current_event.join(".") : current_event;
    if (subname) {
      return new RegExp(`(?:\\.|\\/|^)${subname}(?:\\.|\\/|$)`).test(cur);
    }
    return cur;
  };
  /*\
     * eve.nts
     [ method ]
     **
     * Could be used inside event handler to figure out actual name of the event.
     **
     **
     = (array) names of the event
    \*/
  eve.nts = () =>
    isArray$1(current_event) ? current_event : current_event.split(separator);
  /*\
     * eve.off
     [ method ]
     **
     * Removes given function from the list of event listeners assigned to given name.
     * If no arguments specified all the events will be cleared.
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
    \*/
  /*\
     * eve.unbind
     [ method ]
     **
     * See @eve.off
    \*/
  eve.off = eve.unbind = (name, f) => {
    if (!name) {
      events = { n: {} };
      eve._events = events;
      return;
    }
    let names = isArray$1(name)
      ? isArray$1(name[0])
        ? name
        : [name]
      : Str(name).split(comaseparator);
    if (names.length > 1) {
      for (let i = 0, ii = names.length; i < ii; i++) {
        eve.off(names[i], f);
      }
      return;
    }
    names = isArray$1(name) ? name : Str(name).split(separator);
    let e;
    let key;
    let splice;
    let i;
    let ii;
    let j;
    let jj;
    const cur = [events];
    const inodes = [];
    for (i = 0, ii = names.length; i < ii; i++) {
      for (j = 0; j < cur.length; j += splice.length - 2) {
        splice = [j, 1];
        e = cur[j].n;
        if (names[i] != wildcard) {
          if (e[names[i]]) {
            splice.push(e[names[i]]);
            inodes.unshift({
              n: e,
              name: names[i],
            });
          }
        } else {
          for (key in e)
            if (e[has](key)) {
              splice.push(e[key]);
              inodes.unshift({
                n: e,
                name: key,
              });
            }
        }
        cur.splice.apply(cur, splice);
      }
    }
    for (i = 0, ii = cur.length; i < ii; i++) {
      e = cur[i];
      while (e.n) {
        if (f) {
          if (e.f) {
            for (j = 0, jj = e.f.length; j < jj; j++)
              if (e.f[j] == f) {
                e.f.splice(j, 1);
                break;
              }
            if (!e.f.length) {
              e.f = undefined;
            }
          }
          for (key in e.n)
            if (e.n[has](key) && e.n[key].f) {
              const funcs = e.n[key].f;
              for (j = 0, jj = funcs.length; j < jj; j++)
                if (funcs[j] == f) {
                  funcs.splice(j, 1);
                  break;
                }
              if (!funcs.length) {
                e.n[key].f = undefined;
              }
            }
        } else {
          e.f = undefined;
          for (key in e.n)
            if (e.n[has](key) && e.n[key].f) {
              e.n[key].f = undefined;
            }
        }
        e = e.n;
      }
    }
    // prune inner nodes in path
    prune: for (i = 0, ii = inodes.length; i < ii; i++) {
      e = inodes[i];
      for (key in e.n[e.name].f) {
        // not empty (has listeners)
        continue prune;
      }
      for (key in e.n[e.name].n) {
        // not empty (has children)
        continue prune;
      }
      // is empty
      delete e.n[e.name];
    }
  };
  /*\
     * eve.once
     [ method ]
     **
     * Binds given event handler with a given name to only run once then unbind itself.
     | eve.once("login", f);
     | eve("login"); // triggers f
     | eve("login"); // no listeners
     * Use @eve to trigger the listener.
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
     **
     = (function) same return function as @eve.on
    \*/
  eve.once = (name, f) => {
    const f2 = function (...args) {
      eve.off(name, f2);
      return f.apply(this, args);
    };
    return eve.on(name, f2);
  };
  /*\
     * eve.version
     [ property (string) ]
     **
     * Current version of the library.
    \*/
  eve.version = version;
  eve.toString = () => `You are running Eve ${version}`;

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
  /* exported Snap */

  const Snap = ((root) => {
    // Replaced with package.json `version` at build time (see rollup.config.js).
    Snap.version = "1.0.0";
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
      this.id = ID();
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
      const id = ID();
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

  // Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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


  Snap.plugin((Snap, Element, _Paper, _glob, Fragment) => {
    const elproto = Element.prototype;
    const is = Snap.is;
    const Str = String;
    const unit2px = Snap._unit2px;
    const $ = Snap._.$;
    const make = Snap._.make;
    const getSomeDefs = Snap._.getSomeDefs;
    const has = "hasOwnProperty";
    const wrap = Snap._.wrap;
    /*\
       * Element.getBBox
       [ method ]
       **
       * Returns the bounding box descriptor for the given element
       **
       = (object) bounding box descriptor:
       o {
       o     cx: (number) x of the center,
       o     cy: (number) y of the center,
       o     h: (number) height,
       o     height: (number) height,
       o     path: (string) path command for the box,
       o     r0: (number) radius of a circle that fully encloses the box,
       o     r1: (number) radius of the smallest circle that can be enclosed,
       o     r2: (number) radius of the largest circle that can be enclosed,
       o     vb: (string) box as a viewbox command,
       o     w: (number) width,
       o     width: (number) width,
       o     x2: (number) x of the right side,
       o     x: (number) x of the left side,
       o     y2: (number) y of the bottom edge,
       o     y: (number) y of the top edge
       o }
      \*/
    elproto.getBBox = function (isWithoutTransform) {
      if (this.type == "tspan") {
        return Snap._.box(this.node.getClientRects().item(0));
      }
      if (!Snap.Matrix || !Snap.path) {
        return this.node.getBBox();
      }
      let el = this;
      let m = new Snap.Matrix();
      if (el.removed) {
        return Snap._.box();
      }
      while (el.type == "use") {
        if (!isWithoutTransform) {
          m = m.add(
            el
              .transform()
              .localMatrix.translate(el.attr("x") || 0, el.attr("y") || 0),
          );
        }
        if (el.original) {
          el = el.original;
        } else {
          const href = el.attr("xlink:href");
          el = el.original = el.node.ownerDocument.getElementById(
            href.substring(href.indexOf("#") + 1),
          );
        }
      }
      const _ = el._;
      const pathfinder = Snap.path.get[el.type] || Snap.path.get.deflt;
      try {
        if (isWithoutTransform) {
          if (pathfinder) {
            el.realPath = pathfinder(el);
          }
          _.bboxwt = pathfinder
            ? Snap.path.getBBox(el.realPath)
            : Snap._.box(el.node.getBBox());
          return Snap._.box(_.bboxwt);
        }
        el.realPath = pathfinder(el);
        el.matrix = el.transform().localMatrix;
        _.bbox = Snap.path.getBBox(Snap.path.map(el.realPath, m.add(el.matrix)));
        return Snap._.box(_.bbox);
      } catch (_e) {
        // Firefox doesn’t give you bbox of hidden element
        return Snap._.box();
      }
    };
    const propString = function () {
      return this.string;
    };
    const extractTransform = (el, tstring) => {
      let tstr = tstring;
      let doReturn = false;
      if (tstr == null) {
        doReturn = true;
        if (el.type == "linearGradient" || el.type == "radialGradient") {
          tstr = el.node.getAttribute("gradientTransform");
        } else if (el.type == "pattern") {
          tstr = el.node.getAttribute("patternTransform");
        } else {
          tstr = el.node.getAttribute("transform");
        }
        if (!tstr) {
          return new Snap.Matrix();
        }
        tstr = Snap._.svgTransform2string(tstr);
      } else {
        if (!Snap._.rgTransform.test(tstr)) {
          tstr = Snap._.svgTransform2string(tstr);
        } else {
          tstr = Str(tstr).replace(/\.{3}|\u2026/g, el._.transform || "");
        }
        if (is(tstr, "array")) {
          tstr = Snap.path ? Snap.path.toString.call(tstr) : Str(tstr);
        }
        el._.transform = tstr;
      }
      const m = Snap._.transform2matrix(tstr, el.getBBox(1));
      if (doReturn) {
        return m;
      }
      el.matrix = m;
    };
    /*\
       * Element.transform
       [ method ]
       **
       * Gets or sets transformation of the element
       **
       - tstr (string) transform string in Snap or SVG format
       = (Element) the current element
       * or
       = (object) transformation descriptor:
       o {
       o     string (string) transform string,
       o     globalMatrix (Matrix) matrix of all transformations applied to element or its parents,
       o     localMatrix (Matrix) matrix of transformations applied only to the element,
       o     diffMatrix (Matrix) matrix of difference between global and local transformations,
       o     global (string) global transformation as string,
       o     local (string) local transformation as string,
       o     toString (function) returns `string` property
       o }
      \*/
    elproto.transform = function (tstr) {
      const _ = this._;
      if (tstr == null) {
        let papa = this;
        const global = new Snap.Matrix(this.node.getCTM());
        const local = extractTransform(this);
        const ms = [local];
        const m = new Snap.Matrix();
        let i;
        const localString = local.toTransformString();
        const string =
          Str(local) == Str(this.matrix) ? Str(_.transform) : localString;
        while (papa.type != "svg" && papa.parent()) {
          papa = papa.parent();
          ms.push(extractTransform(papa));
        }
        i = ms.length;
        while (i--) {
          m.add(ms[i]);
        }
        return {
          string,
          globalMatrix: global,
          totalMatrix: m,
          localMatrix: local,
          diffMatrix: global.clone().add(local.invert()),
          global: global.toTransformString(),
          total: m.toTransformString(),
          local: localString,
          toString: propString,
        };
      }
      if (tstr instanceof Snap.Matrix) {
        this.matrix = tstr;
        this._.transform = tstr.toTransformString();
      } else {
        extractTransform(this, tstr);
      }

      if (this.node) {
        if (this.type == "linearGradient" || this.type == "radialGradient") {
          $(this.node, { gradientTransform: this.matrix });
        } else if (this.type == "pattern") {
          $(this.node, { patternTransform: this.matrix });
        } else {
          $(this.node, { transform: this.matrix });
        }
      }

      return this;
    };
    /*\
       * Element.parent
       [ method ]
       **
       * Returns the element's parent
       **
       = (Element) the parent element
      \*/
    elproto.parent = function () {
      return wrap(this.node.parentNode);
    };
    /*\
       * Element.append
       [ method ]
       **
       * Appends the given element to current one
       **
       - el (Element|Set) element to append
       = (Element) the parent element
      \*/
    /*\
       * Element.add
       [ method ]
       **
       * See @Element.append
      \*/
    elproto.append = elproto.add = function (el) {
      if (el) {
        if (el.type == "set") {
          for (const e of el) {
            this.add(e);
          }
          return this;
        }
        const el2 = wrap(el);
        this.node.appendChild(el2.node);
        el2.paper = this.paper;
      }
      return this;
    };
    /*\
       * Element.appendTo
       [ method ]
       **
       * Appends the current element to the given one
       **
       - el (Element) parent element to append to
       = (Element) the child element
      \*/
    elproto.appendTo = function (el) {
      if (el) {
        wrap(el).append(this);
      }
      return this;
    };
    /*\
       * Element.prepend
       [ method ]
       **
       * Prepends the given element to the current one
       **
       - el (Element) element to prepend
       = (Element) the parent element
      \*/
    elproto.prepend = function (el) {
      if (el) {
        if (el.type == "set") {
          let first;
          for (const e of el) {
            if (first) {
              first.after(e);
            } else {
              this.prepend(e);
            }
            first = e;
          }
          return this;
        }
        const el2 = wrap(el);
        const parent = el2.parent();
        this.node.insertBefore(el2.node, this.node.firstChild);
        this.add?.();
        el2.paper = this.paper;
        this.parent()?.add();
        parent?.add();
      }
      return this;
    };
    /*\
       * Element.prependTo
       [ method ]
       **
       * Prepends the current element to the given one
       **
       - el (Element) parent element to prepend to
       = (Element) the child element
      \*/
    elproto.prependTo = function (el) {
      wrap(el).prepend(this);
      return this;
    };
    /*\
       * Element.before
       [ method ]
       **
       * Inserts given element before the current one
       **
       - el (Element) element to insert
       = (Element) the parent element
      \*/
    elproto.before = function (el) {
      if (el.type == "set") {
        for (const e of el) {
          const parent = e.parent();
          this.node.parentNode.insertBefore(e.node, this.node);
          parent?.add();
        }
        this.parent().add();
        return this;
      }
      const el2 = wrap(el);
      const parent = el2.parent();
      this.node.parentNode.insertBefore(el2.node, this.node);
      this.parent()?.add();
      parent?.add();
      el2.paper = this.paper;
      return this;
    };
    /*\
       * Element.after
       [ method ]
       **
       * Inserts given element after the current one
       **
       - el (Element) element to insert
       = (Element) the parent element
      \*/
    elproto.after = function (el2) {
      const el = wrap(el2);
      const parent = el.parent();
      if (this.node.nextSibling) {
        this.node.parentNode.insertBefore(el.node, this.node.nextSibling);
      } else {
        this.node.parentNode.appendChild(el.node);
      }
      this.parent()?.add();
      parent?.add();
      el.paper = this.paper;
      return this;
    };
    /*\
       * Element.insertBefore
       [ method ]
       **
       * Inserts the element after the given one
       **
       - el (Element) element next to whom insert to
       = (Element) the parent element
      \*/
    elproto.insertBefore = function (el2) {
      const el = wrap(el2);
      const parent = this.parent();
      el.node.parentNode.insertBefore(this.node, el.node);
      this.paper = el.paper;
      parent?.add();
      el.parent()?.add();
      return this;
    };
    /*\
       * Element.insertAfter
       [ method ]
       **
       * Inserts the element after the given one
       **
       - el (Element) element next to whom insert to
       = (Element) the parent element
      \*/
    elproto.insertAfter = function (el2) {
      const el = wrap(el2);
      const parent = this.parent();
      el.node.parentNode.insertBefore(this.node, el.node.nextSibling);
      this.paper = el.paper;
      parent?.add();
      el.parent()?.add();
      return this;
    };
    /*\
       * Element.remove
       [ method ]
       **
       * Removes element from the DOM
       = (Element) the detached element
      \*/
    elproto.remove = function () {
      const parent = this.parent();
      this.node.parentNode?.removeChild(this.node);
      this.paper = undefined;
      this.removed = true;
      parent?.add();
      return this;
    };
    /*\
       * Element.select
       [ method ]
       **
       * Gathers the nested @Element matching the given set of CSS selectors
       **
       - query (string) CSS selector
       = (Element) result of query selection
      \*/
    elproto.select = function (query) {
      return wrap(this.node.querySelector(query));
    };
    /*\
       * Element.selectAll
       [ method ]
       **
       * Gathers nested @Element objects matching the given set of CSS selectors
       **
       - query (string) CSS selector
       = (Set|array) result of query selection
      \*/
    elproto.selectAll = function (query) {
      const nodelist = this.node.querySelectorAll(query);
      const set = (Snap.set || Array)();
      for (let i = 0; i < nodelist.length; i++) {
        set.push(wrap(nodelist[i]));
      }
      return set;
    };
    /*\
       * Element.asPX
       [ method ]
       **
       * Returns given attribute of the element as a `px` value (not %, em, etc.)
       **
       - attr (string) attribute name
       - value (string) #optional attribute value
       = (Element) result of query selection
      \*/
    elproto.asPX = function (attr, value) {
      let val = value;
      if (value == null) {
        val = this.attr(attr);
      }
      return +unit2px(this, attr, val);
    };
    // SIERRA Element.use(): I suggest adding a note about how to access the original element the returned <use> instantiates. It's a part of SVG with which ordinary web developers may be least familiar.
    /*\
       * Element.use
       [ method ]
       **
       * Creates a `<use>` element linked to the current element
       **
       = (Element) the `<use>` element
      \*/
    elproto.use = function () {
      let use;
      let id = this.node.id;
      if (!id) {
        id = this.id;
        $(this.node, {
          id,
        });
      }
      if (
        this.type == "linearGradient" ||
        this.type == "radialGradient" ||
        this.type == "pattern"
      ) {
        use = make(this.type, this.node.parentNode);
      } else {
        use = make("use", this.node.parentNode);
      }
      $(use.node, {
        "xlink:href": `#${id}`,
      });
      use.original = this;
      return use;
    };
    const fixids = (el) => {
      const els = el.selectAll("*");
      let it;
      const url = /^\s*url\(("|'|)(.*)\1\)\s*$/;
      const ids = [];
      const uses = {};
      const urltest = (it, name) => {
        let val = $(it.node, name);
        val = val?.match(url);
        val = val?.[2];
        if (val && val.charAt() == "#") {
          val = val.substring(1);
        } else {
          return;
        }
        if (val) {
          uses[val] = (uses[val] || []).concat((id) => {
            const attr = {};
            attr[name] = Snap.prefixURL(Snap.url(id));
            $(it.node, attr);
          });
        }
      };
      const linktest = (it) => {
        let val = $(it.node, "xlink:href");
        if (val && val.charAt() == "#") {
          val = val.substring(1);
        } else {
          return;
        }
        if (val) {
          uses[val] = (uses[val] || []).concat((id) => {
            it.attr("xlink:href", `#${id}`);
          });
        }
      };
      for (let i = 0, ii = els.length; i < ii; i++) {
        it = els[i];
        urltest(it, "fill");
        urltest(it, "stroke");
        urltest(it, "filter");
        urltest(it, "mask");
        urltest(it, "clip-path");
        linktest(it);
        const oldid = $(it.node, "id");
        if (oldid) {
          $(it.node, { id: it.id });
          ids.push({
            old: oldid,
            id: it.id,
          });
        }
      }
      for (let i = 0, ii = ids.length; i < ii; i++) {
        const fs = uses[ids[i].old];
        if (fs) {
          for (let j = 0, jj = fs.length; j < jj; j++) {
            fs[j](ids[i].id);
          }
        }
      }
    };
    /*\
       * Element.clone
       [ method ]
       **
       * Creates a clone of the element and inserts it after the element
       **
       = (Element) the clone
      \*/
    elproto.clone = function () {
      const clone = wrap(this.node.cloneNode(true));
      if ($(clone.node, "id")) {
        $(clone.node, { id: clone.id });
      }
      fixids(clone);
      clone.insertAfter(this);
      return clone;
    };
    /*\
       * Element.toDefs
       [ method ]
       **
       * Moves element to the shared `<defs>` area
       **
       = (Element) the element
      \*/
    elproto.toDefs = function () {
      const defs = getSomeDefs(this);
      defs.appendChild(this.node);
      return this;
    };
    /*\
       * Element.toPattern
       [ method ]
       **
       * Creates a `<pattern>` element from the current element
       **
       * To create a pattern you have to specify the pattern rect:
       - x (string|number)
       - y (string|number)
       - width (string|number)
       - height (string|number)
       = (Element) the `<pattern>` element
       * You can use pattern later on as an argument for `fill` attribute:
       | var p = paper.path("M10-5-10,15M15,0,0,15M0-5-20,15").attr({
       |         fill: "none",
       |         stroke: "#bada55",
       |         strokeWidth: 5
       |     }).pattern(0, 0, 10, 10),
       |     c = paper.circle(200, 200, 100);
       | c.attr({
       |     fill: p
       | });
      \*/
    elproto.pattern = elproto.toPattern = function (ox, oy, owidth, oheight) {
      const p = make("pattern", getSomeDefs(this));
      let x = ox;
      let y = oy;
      let width = owidth;
      let height = oheight;
      if (x == null) {
        x = this.getBBox();
      }
      if (is(x, "object") && "x" in x) {
        y = x.y;
        width = x.width;
        height = x.height;
        x = x.x;
      }
      $(p.node, {
        x,
        y,
        width,
        height,
        patternUnits: "userSpaceOnUse",
        id: p.id,
        viewBox: [x, y, width, height].join(" "),
      });
      p.node.appendChild(this.node);
      return p;
    };
    // SIERRA Element.marker(): clarify what a reference point is. E.g., helps you offset the object from its edge such as when centering it over a path.
    // SIERRA Element.marker(): I suggest the method should accept default reference point values.  Perhaps centered with (refX = width/2) and (refY = height/2)? Also, couldn't it assume the element's current _width_ and _height_? And please specify what _x_ and _y_ mean: offsets? If so, from where?  Couldn't they also be assigned default values?
    /*\
       * Element.marker
       [ method ]
       **
       * Creates a `<marker>` element from the current element
       **
       * To create a marker you have to specify the bounding rect and reference point:
       - x (number)
       - y (number)
       - width (number)
       - height (number)
       - refX (number)
       - refY (number)
       = (Element) the `<marker>` element
       * You can specify the marker later as an argument for `marker-start`, `marker-end`, `marker-mid`, and `marker` attributes. The `marker` attribute places the marker at every point along the path, and `marker-mid` places them at every point except the start and end.
      \*/
    // TODO add usage for markers
    elproto.marker = function (
      ox,
      oy,
      owidth,
      oheight,
      orefX = ox + owidth / 2,
      orefY = oy + oheight / 2,
    ) {
      const p = make("marker", getSomeDefs(this));
      let x = ox;
      let y = oy;
      let width = owidth;
      let height = oheight;
      let refX = orefX;
      let refY = orefY;
      if (x == null) {
        x = this.getBBox();
      }
      if (is(x, "object") && "x" in x) {
        y = x.y;
        width = x.width;
        height = x.height;
        refX = x.refX || x.cx;
        refY = x.refY || x.cy;
        x = x.x;
      }
      $(p.node, {
        viewBox: [x, y, width, height].join(" "),
        markerWidth: width,
        markerHeight: height,
        orient: "auto",
        refX: refX || 0,
        refY: refY || 0,
        id: p.id,
      });
      p.node.appendChild(this.node);
      return p;
    };
    const eldata = {};
    /*\
       * Element.data
       [ method ]
       **
       * Adds or retrieves given value associated with given key. (Don’t confuse
       * with `data-` attributes)
       *
       * See also @Element.removeData
       - key (string) key to store data
       - value (any) #optional value to store
       = (object) @Element
       * or, if value is not specified:
       = (any) value
       > Usage
       | for (var i = 0, i < 5, i++) {
       |     paper.circle(10 + 15 * i, 10, 10)
       |          .attr({fill: "#000"})
       |          .data("i", i)
       |          .click(function () {
       |             alert(this.data("i"));
       |          });
       | }
      \*/
    elproto.data = function (key, value) {
      eldata[this.id] = eldata[this.id] || {};
      const data = eldata[this.id];
      if (key == null && value == null) {
        eve(`snap.data.get.${this.id}`, this, data, null);
        return data;
      }
      if (value == null) {
        if (Snap.is(key, "object")) {
          for (const i in key)
            if (key[has](i)) {
              this.data(i, key[i]);
            }
          return this;
        }
        eve(`snap.data.get.${this.id}`, this, data[key], key);
        return data[key];
      }
      data[key] = value;
      eve(`snap.data.set.${this.id}`, this, value, key);
      return this;
    };
    /*\
       * Element.removeData
       [ method ]
       **
       * Removes value associated with an element by given key.
       * If key is not provided, removes all the data of the element.
       - key (string) #optional key
       = (object) @Element
      \*/
    elproto.removeData = function (key) {
      if (key == null) {
        eldata[this.id] = {};
      } else {
        eldata[this.id] && delete eldata[this.id][key];
      }
      return this;
    };
    /*\
       * Element.outerSVG
       [ method ]
       **
       * Returns SVG code for the element, equivalent to HTML's `outerHTML`.
       *
       * See also @Element.innerSVG
       = (string) SVG code for the element
      \*/
    /*\
       * Element.toString
       [ method ]
       **
       * See @Element.outerSVG
      \*/
    elproto.outerSVG = elproto.toString = toString(1);
    /*\
       * Element.innerSVG
       [ method ]
       **
       * Returns SVG code for the element's contents, equivalent to HTML's `innerHTML`
       = (string) SVG code for the element
      \*/
    elproto.innerSVG = toString();
    function toString(type) {
      const createNameSpaceMgr = () => {
        const knownNamespaces = {
          svg: "http://www.w3.org/2000/svg",
          xlink: "http://www.w3.org/1999/xlink",
          inkscape: "http://www.inkscape.org/namespaces/inkscape",
          sodipodi: "http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd",
          rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
          cc: "http://web.resource.org/cc/",
          dc: "http://purl.org/dc/elements/1.1/",
          xhtml: "http://www.w3.org/1999/xhtml",
        };
        const nsMgr = {
          namespaces: {},
          getPrefix: (namespaceURI, node) => {
            if (namespaceURI == null || namespaceURI == "") {
              return null;
            }
            let prefix;

            // try to get prefix from allready used namespaces
            for (const prefix in nsMgr.namespaces) {
              if (nsMgr.namespaces[prefix] == namespaceURI) {
                return prefix;
              }
            }

            // try to get prefix from commonly known namepsaces
            for (const prefix in knownNamespaces) {
              if (knownNamespaces[prefix] == namespaceURI) {
                nsMgr.namespaces[prefix] = namespaceURI;
                return prefix;
              }
            }

            // try to get prefix in the document
            if (node?.lookupPrefix) {
              prefix = node.lookupPrefix(namespaceURI);
              if (prefix) {
                nsMgr.namespaces[prefix] = namespaceURI;
                return prefix;
              }
            }

            // generate prefix
            let i = 1;
            prefix = `prfx${i}`;
            while (nsMgr.namespaces[prefix]) {
              prefix = `prfx${++i}`;
            }

            nsMgr.namespaces[prefix] = namespaceURI;

            return prefix;
          },
        };

        return nsMgr;
      };

      return function (nsManager) {
        const nsMgr =
          typeof nsManager == "undefined" ? createNameSpaceMgr() : nsManager;
        let isRootElement = false;
        let res = "";
        const attr = this.node.attributes;
        const chld = this.node.childNodes;

        if (type) {
          if (typeof nsMgr.rootNS == "undefined") {
            isRootElement = true;
            nsMgr.rootNS = this.node.namespaceURI || "";
            res = `<${this.type}`;
            if (nsMgr.rootNS.length > 0) {
              res += ` xmlns="${nsMgr.rootNS}"`;
            }
          } else if ((this.node.namespaceURI || "") != nsMgr.rootNS) {
            const nodeNS = nsMgr.getPrefix(
              this.node.namespaceURI || "",
              this.node,
            );
            if (nodeNS) {
              res = `<${nodeNS}:${this.type}`;
            } else {
              res = `<${this.type} xmlns=""`;
            }
          } else {
            res = `<${this.type}`;
          }

          for (let i = 0, ii = attr.length; i < ii; i++) {
            const attrName = attr[i].name;
            const attrNS = attr[i].namespaceURI
              ? `${nsMgr.getPrefix(attr[i].namespaceURI, attr[i])}:`
              : "";
            res += ` ${attrNS}${attrName}="${attr[i].value.replace(/"/g, "'")}"`;
          }
        }
        if (chld.length) {
          if (type) {
            res += ">";
          }
          for (let i = 0, ii = chld.length; i < ii; i++) {
            if (chld[i].nodeType == 3) {
              res += chld[i].nodeValue;
            } else if (chld[i].nodeType == 1) {
              res += ` ${wrap(chld[i]).outerSVG(nsMgr)}`;
            }
          }
          if (type) {
            res += `</${this.type}>`;
          }
        } else {
          if (type) {
            res += " />";
          }
        }

        if (type && isRootElement) {
          let nsString = "";
          for (const prefix in nsMgr.namespaces) {
            nsString += ` xmlns:${prefix}="${nsMgr.namespaces[prefix]}"`;
          }

          if (nsString.length > 0) {
            res = `<${this.type}${nsString} ${res.substring(this.type.length + 1)}`;
          }
        }
        return res;
      };
    }
    elproto.toDataURL = function () {
      if (window?.btoa) {
        const bb = this.getBBox();
        const svg = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{width}" height="{height}" viewBox="${+bb.x.toFixed(3)} ${+bb.y.toFixed(3)} ${+bb.width.toFixed(3)} ${+bb.height.toFixed(3)}">${this.outerSVG()}</svg>`;
        return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
      }
    };
    /*\
       * Fragment.select
       [ method ]
       **
       * See @Element.select
      \*/
    Fragment.prototype.select = elproto.select;
    /*\
       * Fragment.selectAll
       [ method ]
       **
       * See @Element.selectAll
      \*/
    Fragment.prototype.selectAll = elproto.selectAll;
  });

  // Copyright (c) 2017 Adobe Systems Incorporated. All rights reserved.
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


  const animations = {};
  const requestAnimFrame =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    ((callback) => {
      setTimeout(callback, 16, Date.now());
      return true;
    });
  let requestID;
  const isArray = Array.isArray;
  let idgen = 0;
  const idprefix = `M${(Date.now()).toString(36)}`;
  const ID = () => idprefix + (idgen++).toString(36);
  const timer = Date.now || (() => Date.now());
  const sta = function (val) {
    if (val == null) {
      return this.s;
    }
    const ds = this.s - val;
    this.b += this.dur * ds;
    this.B += this.dur * ds;
    this.s = val;
  };
  const speed = function (val) {
    if (val == null) {
      return this.spd;
    }
    this.spd = val;
  };
  const duration = function (val) {
    if (val == null) {
      return this.dur;
    }
    this.s = (this.s * val) / this.dur;
    this.dur = val;
  };
  const stopit = function () {
    delete animations[this.id];
    this.update();
    eve(`mina.stop.${this.id}`, this);
  };
  const pause = function () {
    if (this.pdif) {
      return;
    }
    delete animations[this.id];
    this.update();
    this.pdif = this.get() - this.b;
  };
  const resume = function () {
    if (!this.pdif) {
      return;
    }
    this.b = this.get() - this.pdif;
    this.pdif = undefined;
    animations[this.id] = this;
    frame();
  };
  const update = function () {
    let res;
    if (isArray(this.start)) {
      res = [];
      for (let j = 0, jj = this.start.length; j < jj; j++) {
        res[j] =
          +this.start[j] + (this.end[j] - this.start[j]) * this.easing(this.s);
      }
    } else {
      res = +this.start + (this.end - this.start) * this.easing(this.s);
    }
    this.set(res);
  };
  const frame = (timeStamp) => {
    // Manual invokation?
    if (!timeStamp) {
      // Frame loop stopped?
      if (!requestID) {
        // Start frame loop...
        requestID = requestAnimFrame(frame);
      }
      return;
    }
    let len = 0;
    for (const i in animations) {
      const a = animations[i];
      const b = a.get();
      len++;
      a.s = (b - a.b) / (a.dur / a.spd);
      if (a.s >= 1) {
        delete animations[i];
        a.s = 1;
        len--;
        ((a) => {
          setTimeout(() => {
            eve(`mina.finish.${a.id}`, a);
          });
        })(a);
      }
      a.update();
    }
    requestID = len ? requestAnimFrame(frame) : false;
  };
  /*\
         * mina
         [ method ]
         **
         * Generic animation of numbers
         **
         - a (number) start _slave_ number
         - A (number) end _slave_ number
         - b (number) start _master_ number (start time in general case)
         - B (number) end _master_ number (end time in general case)
         - get (function) getter of _master_ number (see @mina.time)
         - set (function) setter of _slave_ number
         - easing (function) #optional easing function, default is @mina.linear
         = (object) animation descriptor
         o {
         o         id (string) animation id,
         o         start (number) start _slave_ number,
         o         end (number) end _slave_ number,
         o         b (number) start _master_ number,
         o         s (number) animation status (0..1),
         o         dur (number) animation duration,
         o         spd (number) animation speed,
         o         get (function) getter of _master_ number (see @mina.time),
         o         set (function) setter of _slave_ number,
         o         easing (function) easing function, default is @mina.linear,
         o         status (function) status getter/setter,
         o         speed (function) speed getter/setter,
         o         duration (function) duration getter/setter,
         o         stop (function) animation stopper
         o         pause (function) pauses the animation
         o         resume (function) resumes the animation
         o         update (function) calles setter with the right value of the animation
         o }
        \*/
  const mina = (a, A, b, B, get, set, easing) => {
    const anim = {
      id: ID(),
      start: a,
      end: A,
      b,
      s: 0,
      dur: B - b,
      spd: 1,
      get,
      set,
      easing: easing || mina.linear,
      status: sta,
      speed,
      duration,
      stop: stopit,
      pause,
      resume,
      update,
    };
    animations[anim.id] = anim;
    let len = 0;
    let i;
    for (i in animations) {
      len++;
      if (len == 2) {
        break;
      }
    }
    len == 1 && frame();
    return anim;
  };
  /*\
     * mina.time
     [ method ]
     **
     * Returns the current time. Equivalent to:
     | function () {
     |     return (new Date).getTime();
     | }
    \*/
  mina.time = timer;
  /*\
     * mina.getById
     [ method ]
     **
     * Returns an animation by its id
     - id (string) animation's id
     = (object) See @mina
    \*/
  mina.getById = (id) => animations[id] || null;

  /*\
     * mina.linear
     [ method ]
     **
     * Default linear easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
  mina.linear = (n) => n;
  /*\
     * mina.easeout
     [ method ]
     **
     * Easeout easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
  mina.easeout = (n) => n ** 1.7;
  /*\
     * mina.easein
     [ method ]
     **
     * Easein easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
  mina.easein = (n) => n ** 0.48;
  /*\
     * mina.easeinout
     [ method ]
     **
     * Easeinout easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
  mina.easeinout = (n) => {
    if (n == 1) {
      return 1;
    }
    if (n == 0) {
      return 0;
    }
    const q = 0.48 - n / 1.04;
    const Q = Math.sqrt(0.1734 + q * q);
    const x = Q - q;
    const X = Math.abs(x) ** (1 / 3) * (x < 0 ? -1 : 1);
    const y = -Q - q;
    const Y = Math.abs(y) ** (1 / 3) * (y < 0 ? -1 : 1);
    const t = X + Y + 0.5;
    return (1 - t) * 3 * t * t + t * t * t;
  };
  /*\
     * mina.backin
     [ method ]
     **
     * Backin easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
  mina.backin = (n) => {
    if (n == 1) {
      return 1;
    }
    const s = 1.70158;
    return n * n * ((s + 1) * n - s);
  };
  /*\
     * mina.backout
     [ method ]
     **
     * Backout easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
  mina.backout = (n) => {
    if (n == 0) {
      return 0;
    }
    const m = n - 1;
    const s = 1.70158;
    return m * m * ((s + 1) * m + s) + 1;
  };
  /*\
     * mina.elastic
     [ method ]
     **
     * Elastic easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
  mina.elastic = (n) => {
    if (n == !!n) {
      return n;
    }
    return 2 ** (-10 * n) * Math.sin(((n - 0.075) * (2 * Math.PI)) / 0.3) + 1;
  };
  /*\
     * mina.bounce
     [ method ]
     **
     * Bounce easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
  mina.bounce = (num) => {
    let n = num;
    const s = 7.5625;
    const p = 2.75;
    let l;
    if (n < 1 / p) {
      l = s * n * n;
    } else {
      if (n < 2 / p) {
        n -= 1.5 / p;
        l = s * n * n + 0.75;
      } else {
        if (n < 2.5 / p) {
          n -= 2.25 / p;
          l = s * n * n + 0.9375;
        } else {
          n -= 2.625 / p;
          l = s * n * n + 0.984375;
        }
      }
    }
    return l;
  };

  // Copyright (c) 2016 Adobe Systems Incorporated. All rights reserved.
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


  Snap.plugin((Snap, Element, _Paper, _glob, _Fragment) => {
    const elproto = Element.prototype;
    const is = Snap.is;
    const Str = String;
    const has = "hasOwnProperty";
    const slice = (from, to, f) => {
      return (arr) => {
        let res = arr.slice(from, to);
        if (res.length == 1) {
          res = res[0];
        }
        let out = f ? f(res) : res;
        if (f && out == "r") {
          out = f([res]);
        }
        return out;
      };
    };
    const Animation = function (attr, ms, easing2, callback2) {
      let easing = easing2;
      let callback = callback2;
      if (typeof easing == "function" && !easing.length) {
        callback = easing;
        easing = mina.linear;
      }
      this.attr = attr;
      this.dur = ms;
      if (easing) {
        this.easing = easing;
      }
      if (callback) {
        this.callback = callback;
      }
    };
    Snap._.Animation = Animation;
    /*\
       * Snap.animation
       [ method ]
       **
       * Creates an animation object
       **
       - attr (object) attributes of final destination
       - duration (number) duration of the animation, in milliseconds
       - easing (function) #optional one of easing functions of @mina or custom one
       - callback (function) #optional callback function that fires when animation ends
       = (object) animation object
      \*/
    Snap.animation = (attr, ms, easing, callback) =>
      new Animation(attr, ms, easing, callback);
    /*\
       * Element.inAnim
       [ method ]
       **
       * Returns a set of animations that may be able to manipulate the current element
       **
       = (object) in format:
       o {
       o     anim (object) animation object,
       o     mina (object) @mina object,
       o     curStatus (number) 0..1 — status of the animation: 0 — just started, 1 — just finished,
       o     status (function) gets or sets the status of the animation,
       o     stop (function) stops the animation
       o }
      \*/
    elproto.inAnim = function () {
      const res = [];
      for (const id in this.anims)
        if (this.anims[has](id)) {
          ((a) => {
            res.push({
              anim: new Animation(a._attrs, a.dur, a.easing, a._callback),
              mina: a,
              curStatus: a.status(),
              status: (val) => a.status(val),
              stop: () => a.stop(),
            });
          })(this.anims[id]);
        }
      return res;
    };
    /*\
       * Snap.animate
       [ method ]
       **
       * Runs generic animation of one number into another with a caring function
       **
       - from (number|array) number or array of numbers
       - to (number|array) number or array of numbers
       - setter (function) caring function that accepts one number argument
       - duration (number) duration, in milliseconds
       - easing (function) #optional easing function from @mina or custom
       - callback (function) #optional callback function to execute when animation ends
       = (object) animation object in @mina format
       o {
       o     id (string) animation id, consider it read-only,
       o     duration (function) gets or sets the duration of the animation,
       o     easing (function) easing,
       o     speed (function) gets or sets the speed of the animation,
       o     status (function) gets or sets the status of the animation,
       o     stop (function) stops the animation
       o }
       | var rect = Snap().rect(0, 0, 10, 10);
       | Snap.animate(0, 10, function (val) {
       |     rect.attr({
       |         x: val
       |     });
       | }, 1000);
       | // in given context is equivalent to
       | rect.animate({x: 10}, 1000);
      \*/
    Snap.animate = (from, to, setter, ms, easing2, callback2) => {
      let easing = easing2;
      let callback = callback2;
      if (typeof easing == "function" && !easing.length) {
        callback = easing;
        easing = mina.linear;
      }
      const now = mina.time();
      const anim = mina(from, to, now, now + ms, mina.time, setter, easing);
      callback && eve.once(`mina.finish.${anim.id}`, callback);
      return anim;
    };
    /*\
       * Element.stop
       [ method ]
       **
       * Stops all the animations for the current element
       **
       = (Element) the current element
      \*/
    elproto.stop = function () {
      const anims = this.inAnim();
      for (let i = 0, ii = anims.length; i < ii; i++) {
        anims[i].stop();
      }
      return this;
    };
    /*\
       * Element.animate
       [ method ]
       **
       * Animates the given attributes of the element
       **
       - attrs (object) key-value pairs of destination attributes
       - duration (number) duration of the animation in milliseconds
       - easing (function) #optional easing function from @mina or custom
       - callback (function) #optional callback function that executes when the animation ends
       = (Element) the current element
      \*/
    elproto.animate = function (attrs2, ms2, easing2, callback2) {
      let attrs = attrs2;
      let ms = ms2;
      let easing = easing2;
      let callback = callback2;
      if (typeof easing == "function" && !easing.length) {
        callback = easing;
        easing = mina.linear;
      }
      if (attrs instanceof Animation) {
        callback = attrs.callback;
        easing = attrs.easing;
        ms = attrs.dur;
        attrs = attrs.attr;
      }
      let fkeys = [];
      let tkeys = [];
      const keys = {};
      let from;
      let to;
      let f;
      let eq;
      for (const key in attrs)
        if (attrs[has](key)) {
          if (this.equal) {
            eq = this.equal(key, Str(attrs[key]));
            from = eq.from;
            to = eq.to;
            f = eq.f;
          } else {
            from = +this.attr(key);
            to = +attrs[key];
          }
          const len = is(from, "array") ? from.length : 1;
          keys[key] = slice(fkeys.length, fkeys.length + len, f);
          fkeys = fkeys.concat(from);
          tkeys = tkeys.concat(to);
        }
      const now = mina.time();
      const anim = mina(
        fkeys,
        tkeys,
        now,
        now + ms,
        mina.time,
        (val) => {
          const attr = {};
          for (const key in keys)
            if (keys[has](key)) {
              attr[key] = keys[key](val);
            }
          this.attr(attr);
        },
        easing,
      );
      this.anims[anim.id] = anim;
      anim._attrs = attrs;
      anim._callback = callback;
      eve(`snap.animcreated.${this.id}`, anim);
      eve.once(`mina.finish.${anim.id}`, () => {
        eve.off(`mina.*.${anim.id}`);
        delete this.anims[anim.id];
        callback?.call(this);
      });
      eve.once(`mina.stop.${anim.id}`, () => {
        eve.off(`mina.*.${anim.id}`);
        delete this.anims[anim.id];
      });
      return this;
    };
  });

  // Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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

  Snap.plugin((Snap, _Element, _Paper, _glob, _Fragment) => {
    const objectToString = Object.prototype.toString;
    const Str = String;
    const math = Math;
    const E = "";
    class Matrix {
      constructor(a, b, c, d, e, f) {
        if (b == null && objectToString.call(a) == "[object SVGMatrix]") {
          this.a = a.a;
          this.b = a.b;
          this.c = a.c;
          this.d = a.d;
          this.e = a.e;
          this.f = a.f;
          return;
        }
        if (a != null) {
          this.a = +a;
          this.b = +b;
          this.c = +c;
          this.d = +d;
          this.e = +e;
          this.f = +f;
        } else {
          this.a = 1;
          this.b = 0;
          this.c = 0;
          this.d = 1;
          this.e = 0;
          this.f = 0;
        }
      }
      /*\
      * Matrix.add
      [ method ]
      **
      * Adds the given matrix to existing one
      - a (number)
      - b (number)
      - c (number)
      - d (number)
      - e (number)
      - f (number)
      * or
      - matrix (object) @Matrix
  \*/
      add(a, b, c, d, e, f) {
        if (a && a instanceof Matrix) {
          return this.add(a.a, a.b, a.c, a.d, a.e, a.f);
        }
        const aNew = a * this.a + b * this.c;
        const bNew = a * this.b + b * this.d;
        this.e += e * this.a + f * this.c;
        this.f += e * this.b + f * this.d;
        this.c = c * this.a + d * this.c;
        this.d = c * this.b + d * this.d;

        this.a = aNew;
        this.b = bNew;
        return this;
      }
      /*\
        * Matrix.multLeft
        [ method ]
        **
        * Multiplies a passed affine transform to the left: M * this.
        - a (number)
        - b (number)
        - c (number)
        - d (number)
        - e (number)
        - f (number)
        * or
        - matrix (object) @Matrix
      \*/
      multLeft(a, b, c, d, e, f) {
        if (a && a instanceof Matrix) {
          return this.multLeft(a.a, a.b, a.c, a.d, a.e, a.f);
        }
        const aNew = a * this.a + c * this.b;
        const cNew = a * this.c + c * this.d;
        const eNew = a * this.e + c * this.f + e;
        this.b = b * this.a + d * this.b;
        this.d = b * this.c + d * this.d;
        this.f = b * this.e + d * this.f + f;

        this.a = aNew;
        this.c = cNew;
        this.e = eNew;
        return this;
      }
      /*\
        * Matrix.invert
        [ method ]
        **
        * Returns an inverted version of the matrix
        = (object) @Matrix
      \*/
      invert() {
        const x = this.a * this.d - this.b * this.c;
        return new Matrix(
          this.d / x,
          -this.b / x,
          -this.c / x,
          this.a / x,
          (this.c * this.f - this.d * this.e) / x,
          (this.b * this.e - this.a * this.f) / x,
        );
      }
      /*\
        * Matrix.clone
        [ method ]
        **
        * Returns a copy of the matrix
        = (object) @Matrix
      \*/
      clone() {
        return new Matrix(this.a, this.b, this.c, this.d, this.e, this.f);
      }
      /*\
        * Matrix.translate
        [ method ]
        **
        * Translate the matrix
        - x (number) horizontal offset distance
        - y (number) vertical offset distance
      \*/
      translate(x, y) {
        this.e += x * this.a + y * this.c;
        this.f += x * this.b + y * this.d;
        return this;
      }
      /*\
        * Matrix.scale
        [ method ]
        **
        * Scales the matrix
        - x (number) amount to be scaled, with `1` resulting in no change
        - y (number) #optional amount to scale along the vertical axis. (Otherwise `x` applies to both axes.)
        - cx (number) #optional horizontal origin point from which to scale
        - cy (number) #optional vertical origin point from which to scale
        * Default cx, cy is the middle point of the element.
      \*/
      scale(x, y = x, cx = 0, cy = 0) {
        (cx || cy) && this.translate(cx, cy);
        this.a *= x;
        this.b *= x;
        this.c *= y;
        this.d *= y;
        (cx || cy) && this.translate(-cx, -cy);
        return this;
      }
      /*\
        * Matrix.rotate
        [ method ]
        **
        * Rotates the matrix
        - a (number) angle of rotation, in degrees
        - x (number) horizontal origin point from which to rotate
        - y (number) vertical origin point from which to rotate
      \*/
      rotate(angle, x = 0, y = 0) {
        const a = Snap.rad(angle);
        const cos = +math.cos(a).toFixed(9);
        const sin = +math.sin(a).toFixed(9);
        this.add(cos, sin, -sin, cos, x, y);
        return this.add(1, 0, 0, 1, -x, -y);
      }
      /*\
        * Matrix.skewX
        [ method ]
        **
        * Skews the matrix along the x-axis
        - x (number) Angle to skew along the x-axis (in degrees).
      \*/
      skewX(x) {
        return this.skew(x, 0);
      }
      /*\
        * Matrix.skewY
        [ method ]
        **
        * Skews the matrix along the y-axis
        - y (number) Angle to skew along the y-axis (in degrees).
      \*/
      skewY(y) {
        return this.skew(0, y);
      }
      /*\
        * Matrix.skew
        [ method ]
        **
        * Skews the matrix
        - y (number) Angle to skew along the y-axis (in degrees).
        - x (number) Angle to skew along the x-axis (in degrees).
      \*/
      skew(x = 0, y = 0) {
        const c = Snap.tan(x).toFixed(9);
        const b = Snap.tan(y).toFixed(9);
        return this.add(1, b, c, 1, 0, 0);
      }
      /*\
        * Matrix.x
        [ method ]
        **
        * Returns x coordinate for given point after transformation described by the matrix. See also @Matrix.y
        - x (number)
        - y (number)
        = (number) x
      \*/
      x(x, y) {
        return x * this.a + y * this.c + this.e;
      }
      /*\
        * Matrix.y
        [ method ]
        **
        * Returns y coordinate for given point after transformation described by the matrix. See also @Matrix.x
        - x (number)
        - y (number)
        = (number) y
      \*/
      y(x, y) {
        return x * this.b + y * this.d + this.f;
      }
      get(i) {
        return +this[Str.fromCharCode(97 + i)].toFixed(4);
      }
      toString() {
        return `matrix(${[this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)]})`;
      }
      offset() {
        return [this.e.toFixed(4), this.f.toFixed(4)];
      }
      /*\
        * Matrix.determinant
        [ method ]
        **
        * Finds determinant of the given matrix.
        = (number) determinant
      \*/
      determinant() {
        return this.a * this.d - this.b * this.c;
      }
      /*\
        * Matrix.split
        [ method ]
        **
        * Splits matrix into primitive transformations
        = (object) in format:
        o dx (number) translation by x
        o dy (number) translation by y
        o scalex (number) scale by x
        o scaley (number) scale by y
        o shear (number) shear
        o rotate (number) rotation in deg
        o isSimple (boolean) could it be represented via simple transformations
      \*/
      split() {
        const out = {};
        // translation
        out.dx = this.e;
        out.dy = this.f;

        // scale and shear
        const row = [
          [this.a, this.b],
          [this.c, this.d],
        ];
        out.scalex = math.sqrt(norm(row[0]));
        normalize(row[0]);

        out.shear = row[0][0] * row[1][0] + row[0][1] * row[1][1];
        row[1] = [
          row[1][0] - row[0][0] * out.shear,
          row[1][1] - row[0][1] * out.shear,
        ];

        out.scaley = math.sqrt(norm(row[1]));
        normalize(row[1]);
        out.shear /= out.scaley;

        if (this.determinant() < 0) {
          out.scalex = -out.scalex;
        }

        // rotation
        const sin = row[0][1];
        const cos = row[1][1];
        if (cos < 0) {
          out.rotate = Snap.deg(math.acos(cos));
          if (sin < 0) {
            out.rotate = 360 - out.rotate;
          }
        } else {
          out.rotate = Snap.deg(math.asin(sin));
        }

        out.isSimple =
          !+out.shear.toFixed(9) &&
          (out.scalex.toFixed(9) == out.scaley.toFixed(9) || !out.rotate);
        out.isSuperSimple =
          !+out.shear.toFixed(9) &&
          out.scalex.toFixed(9) == out.scaley.toFixed(9) &&
          !out.rotate;
        out.noRotation = !+out.shear.toFixed(9) && !out.rotate;
        return out;
      }
      /*\
        * Matrix.toTransformString
        [ method ]
        **
        * Returns transform string that represents given matrix
        = (string) transform string
      \*/
      toTransformString(shorter) {
        const s = shorter || this.split();
        if (!+s.shear.toFixed(9)) {
          s.scalex = +s.scalex.toFixed(4);
          s.scaley = +s.scaley.toFixed(4);
          s.rotate = +s.rotate.toFixed(4);
          return (
            (s.dx || s.dy ? `t${[+s.dx.toFixed(4), +s.dy.toFixed(4)]}` : E) +
            (s.rotate ? `r${[+s.rotate.toFixed(4), 0, 0]}` : E) +
            (s.scalex != 1 || s.scaley != 1
              ? `s${[s.scalex, s.scaley, 0, 0]}`
              : E)
          );
        }
        return `m${[this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)]}`;
      }
    }
    const norm = (a) => a[0] * a[0] + a[1] * a[1];
    const normalize = (a) => {
      const mag = math.sqrt(norm(a));
      if (a[0]) {
        a[0] /= mag;
      }
      if (a[1]) {
        a[1] /= mag;
      }
    };
    /*\
       * Snap.Matrix
       [ method ]
       **
       * Matrix constructor, extend on your own risk.
       * To create matrices use @Snap.matrix.
      \*/
    Snap.Matrix = Matrix;
    /*\
       * Snap.matrix
       [ method ]
       **
       * Utility method
       **
       * Returns a matrix based on the given parameters
       - a (number)
       - b (number)
       - c (number)
       - d (number)
       - e (number)
       - f (number)
       * or
       - svgMatrix (SVGMatrix)
       = (object) @Matrix
      \*/
    Snap.matrix = (a, b, c, d, e, f) => new Matrix(a, b, c, d, e, f);
  });

  // Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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


  Snap.plugin((Snap, Element, _Paper, glob, Fragment) => {
    const make = Snap._.make;
    const wrap = Snap._.wrap;
    const is = Snap.is;
    const getSomeDefs = Snap._.getSomeDefs;
    const reURLValue = /^url\((['"]?)([^)]+)\1\)$/;
    const $ = Snap._.$;
    const URL = Snap.url;
    const Str = String;
    const separator = Snap._.separator;
    const E = "";
    /*\
       * Snap.deurl
       [ method ]
       **
       * Unwraps path from `"url(<path>)"`.
       - value (string) url path
       = (string) unwrapped path
      \*/
    Snap.deurl = (value) => {
      // Match Snap.prefixURL: drop the page-URL fragment before stripping the
      // prefix, and escape it so URL metacharacters (".", "?") stay literal.
      const prefix = (window ? window.location.href : "")
        .replace(/#.*$/, "")
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const reURLValue = new RegExp(
        `^url\\((['"]?)(?:${prefix})?([^)]+)\\1\\)$`,
        "i",
      );
      const res = String(value).match(reURLValue);
      return res ? res[2] : value;
    };
    // Attributes event handlers
    eve.on("snap.util.attr.mask", function (val) {
      let value = val;
      if (value instanceof Element || value instanceof Fragment) {
        eve.stop();
        if (value instanceof Fragment && value.node.childNodes.length == 1) {
          value = value.node.firstChild;
          getSomeDefs(this).appendChild(value);
          value = wrap(value);
        }
        let mask;
        if (value.type == "mask") {
          mask = value;
        } else {
          mask = make("mask", getSomeDefs(this));
          mask.node.appendChild(value.node);
        }
        !mask.node.id &&
          $(mask.node, {
            id: mask.id,
          });
        $(this.node, {
          mask: Snap.prefixURL(URL(mask.id)),
        });
      }
    });
    ((clipIt) => {
      eve.on("snap.util.attr.clip", clipIt);
      eve.on("snap.util.attr.clip-path", clipIt);
      eve.on("snap.util.attr.clipPath", clipIt);
    })(function (value) {
      if (value instanceof Element || value instanceof Fragment) {
        eve.stop();
        let clip;
        let node = value.node;
        while (node) {
          if (node.nodeName == "clipPath") {
            clip = new Element(node);
            break;
          }
          if (node.nodeName == "svg") {
            clip = undefined;
            break;
          }
          node = node.parentNode;
        }
        if (!clip) {
          clip = make("clipPath", getSomeDefs(this));
          clip.node.appendChild(value.node);
          !clip.node.id &&
            $(clip.node, {
              id: clip.id,
            });
        }
        $(this.node, {
          "clip-path": Snap.prefixURL(URL(clip.node.id || clip.id)),
        });
      }
    });
    const fillStroke = (name) => {
      return function (val) {
        let value = val;
        let fill;
        eve.stop();
        if (
          value instanceof Fragment &&
          value.node.childNodes.length == 1 &&
          (value.node.firstChild.tagName == "radialGradient" ||
            value.node.firstChild.tagName == "linearGradient" ||
            value.node.firstChild.tagName == "pattern")
        ) {
          value = value.node.firstChild;
          getSomeDefs(this).appendChild(value);
          value = wrap(value);
        }
        if (value instanceof Element) {
          if (
            value.type == "radialGradient" ||
            value.type == "linearGradient" ||
            value.type == "pattern"
          ) {
            if (!value.node.id) {
              $(value.node, {
                id: value.id,
              });
            }
            fill = Snap.prefixURL(URL(value.node.id));
          } else {
            fill = value.attr(name);
          }
        } else {
          fill = Snap.color(value);
          if (fill.error) {
            const grad = Snap(getSomeDefs(this).ownerSVGElement).gradient(value);
            if (grad) {
              if (!grad.node.id) {
                $(grad.node, {
                  id: grad.id,
                });
              }
              fill = Snap.prefixURL(URL(grad.node.id));
            } else {
              fill = value;
            }
          } else {
            fill = Str(fill);
          }
        }
        const attrs = {};
        attrs[name] = fill;
        $(this.node, attrs);
        this.node.style[name] = E;
      };
    };
    eve.on("snap.util.attr.fill", fillStroke("fill"));
    eve.on("snap.util.attr.stroke", fillStroke("stroke"));
    const gradrg = /^([lr])(?:\(([^)]*)\))?(.*)$/i;
    eve.on("snap.util.grad.parse", function parseGrad(str) {
      let string = str;
      string = Str(string);
      const tokens = string.match(gradrg);
      if (!tokens) {
        return null;
      }
      const type = tokens[1];
      let params = tokens[2];
      let stops = tokens[3];
      params = params.split(/\s*,\s*/).map((el) => (+el == el ? +el : el));
      if (params.length == 1 && params[0] == 0) {
        params = [];
      }
      stops = stops.split("-");
      stops = stops.map((e) => {
        const el = e.split(":");
        const out = {
          color: el[0],
        };
        if (el[1]) {
          out.offset = Number.parseFloat(el[1]);
        }
        return out;
      });
      let len = stops.length;
      let start = 0;
      let j = 0;
      const seed = (i, end) => {
        const step = (end - start) / (i - j);
        for (let k = j; k < i; k++) {
          stops[k].offset = +(+start + step * (k - j)).toFixed(2);
        }
        j = i;
        start = end;
      };
      len--;
      for (let i = 0; i < len; i++)
        if ("offset" in stops[i]) {
          seed(i, stops[i].offset);
        }
      stops[len].offset = stops[len].offset || 100;
      seed(len, stops[len].offset);
      return {
        type,
        params,
        stops,
      };
    });

    eve.on("snap.util.attr.d", function (val) {
      let value = val;
      eve.stop();
      if (is(value, "array") && is(value[0], "array")) {
        value = Snap.path.toString.call(value);
      }
      value = Str(value);
      if (value.match(/[ruo]/i)) {
        value = Snap.path.toAbsolute(value);
      }
      $(this.node, { d: value });
    })(-1);
    eve.on("snap.util.attr.#text", function (val) {
      let value = val;
      eve.stop();
      value = Str(value);
      const txt = glob.doc.createTextNode(value);
      while (this.node.firstChild) {
        this.node.removeChild(this.node.firstChild);
      }
      this.node.appendChild(txt);
    })(-1);
    eve.on("snap.util.attr.path", function (value) {
      eve.stop();
      this.attr({ d: value });
    })(-1);
    eve.on("snap.util.attr.class", function (value) {
      eve.stop();
      this.node.className.baseVal = value;
    })(-1);
    eve.on("snap.util.attr.viewBox", function (value) {
      let vb;
      if (is(value, "object") && "x" in value) {
        vb = [value.x, value.y, value.width, value.height].join(" ");
      } else if (is(value, "array")) {
        vb = value.join(" ");
      } else {
        vb = value;
      }
      $(this.node, {
        viewBox: vb,
      });
      eve.stop();
    })(-1);
    eve.on("snap.util.attr.transform", function (value) {
      this.transform(value);
      eve.stop();
    })(-1);
    eve.on("snap.util.attr.r", function (value) {
      if (this.type == "rect") {
        eve.stop();
        $(this.node, {
          rx: value,
          ry: value,
        });
      }
    })(-1);
    eve.on("snap.util.attr.textpath", function (val) {
      let value = val;
      eve.stop();
      if (this.type == "text") {
        let id;
        let tp;
        let node;
        if (!value && this.textPath) {
          tp = this.textPath;
          while (tp.node.firstChild) {
            this.node.appendChild(tp.node.firstChild);
          }
          tp.remove();
          this.textPath = undefined;
          return;
        }
        if (is(value, "string")) {
          const defs = getSomeDefs(this);
          const path = wrap(defs.parentNode).path(value);
          defs.appendChild(path.node);
          id = path.id;
          path.attr({ id });
        } else {
          value = wrap(value);
          if (value instanceof Element) {
            id = value.attr("id");
            if (!id) {
              id = value.id;
              value.attr({ id });
            }
          }
        }
        if (id) {
          tp = this.textPath;
          node = this.node;
          if (tp) {
            tp.attr({ "xlink:href": `#${id}` });
          } else {
            tp = $("textPath", {
              "xlink:href": `#${id}`,
            });
            while (node.firstChild) {
              tp.appendChild(node.firstChild);
            }
            node.appendChild(tp);
            this.textPath = wrap(tp);
          }
        }
      }
    })(-1);
    eve.on("snap.util.attr.text", function (value) {
      if (this.type == "text") {
        const node = this.node;
        const tuner = (chunk) => {
          const out = $("tspan");
          if (is(chunk, "array")) {
            for (let i = 0; i < chunk.length; i++) {
              out.appendChild(tuner(chunk[i]));
            }
          } else {
            out.appendChild(glob.doc.createTextNode(chunk));
          }
          out.normalize?.();
          return out;
        };
        while (node.firstChild) {
          node.removeChild(node.firstChild);
        }
        const tuned = tuner(value);
        while (tuned.firstChild) {
          node.appendChild(tuned.firstChild);
        }
      } else if (this.type == "tspan") {
        this.node.textContent = value;
      }
      eve.stop();
    })(-1);
    function setFontSize(val) {
      let value = val;
      eve.stop();
      if (value == +value) {
        value += "px";
      }
      this.node.style.fontSize = value;
    }
    eve.on("snap.util.attr.fontSize", setFontSize)(-1);
    eve.on("snap.util.attr.font-size", setFontSize)(-1);

    eve.on("snap.util.getattr.transform", function () {
      eve.stop();
      return this.transform();
    })(-1);
    eve.on("snap.util.getattr.textpath", function () {
      eve.stop();
      return this.textPath;
    })(-1);
    // Markers
    (() => {
      const getter = (end) => {
        return function () {
          eve.stop();
          const style = glob.doc.defaultView
            .getComputedStyle(this.node, null)
            .getPropertyValue(`marker-${end}`);
          if (style == "none") {
            return style;
          }
          return Snap(glob.doc.getElementById(style.match(reURLValue)[1]));
        };
      };
      const setter = (end) => {
        return function (value) {
          eve.stop();
          const name = `marker${end.charAt(0).toUpperCase()}${end.substring(1)}`;
          if (value == "" || !value) {
            this.node.style[name] = "none";
            return;
          }
          if (value.type == "marker") {
            const id = value.node.id;
            if (!id) {
              $(value.node, { id: value.id });
            }
            this.node.style[name] = Snap.prefixURL(URL(id));
            return;
          }
        };
      };
      eve.on("snap.util.getattr.marker-end", getter("end"))(-1);
      eve.on("snap.util.getattr.markerEnd", getter("end"))(-1);
      eve.on("snap.util.getattr.marker-start", getter("start"))(-1);
      eve.on("snap.util.getattr.markerStart", getter("start"))(-1);
      eve.on("snap.util.getattr.marker-mid", getter("mid"))(-1);
      eve.on("snap.util.getattr.markerMid", getter("mid"))(-1);
      eve.on("snap.util.attr.marker-end", setter("end"))(-1);
      eve.on("snap.util.attr.markerEnd", setter("end"))(-1);
      eve.on("snap.util.attr.marker-start", setter("start"))(-1);
      eve.on("snap.util.attr.markerStart", setter("start"))(-1);
      eve.on("snap.util.attr.marker-mid", setter("mid"))(-1);
      eve.on("snap.util.attr.markerMid", setter("mid"))(-1);
    })();
    eve.on("snap.util.getattr.r", function () {
      if (this.type == "rect" && $(this.node, "rx") == $(this.node, "ry")) {
        eve.stop();
        return $(this.node, "rx");
      }
    })(-1);
    const textExtract = (node) => {
      const out = [];
      const children = node.childNodes;
      for (let i = 0, ii = children.length; i < ii; i++) {
        const chi = children[i];
        if (chi.nodeType == 3) {
          out.push(chi.nodeValue);
        }
        if (chi.tagName == "tspan") {
          if (chi.childNodes.length == 1 && chi.firstChild.nodeType == 3) {
            out.push(chi.firstChild.nodeValue);
          } else {
            out.push(textExtract(chi));
          }
        }
      }
      return out;
    };
    eve.on("snap.util.getattr.text", function () {
      if (this.type == "text" || this.type == "tspan") {
        eve.stop();
        const out = textExtract(this.node);
        return out.length == 1 ? out[0] : out;
      }
    })(-1);
    eve.on("snap.util.getattr.#text", function () {
      return this.node.textContent;
    })(-1);
    eve.on("snap.util.getattr.fill", function (internal) {
      if (internal) {
        return;
      }
      eve.stop();
      const value = eve("snap.util.getattr.fill", this, true).firstDefined();
      return Snap(Snap.deurl(value)) || value;
    })(-1);
    eve.on("snap.util.getattr.stroke", function (internal) {
      if (internal) {
        return;
      }
      eve.stop();
      const value = eve("snap.util.getattr.stroke", this, true).firstDefined();
      return Snap(Snap.deurl(value)) || value;
    })(-1);
    eve.on("snap.util.getattr.viewBox", function () {
      eve.stop();
      let vb = $(this.node, "viewBox");
      if (vb) {
        vb = vb.split(separator);
        return Snap._.box(+vb[0], +vb[1], +vb[2], +vb[3]);
      }
      return;
    })(-1);
    eve.on("snap.util.getattr.points", function () {
      const p = $(this.node, "points");
      eve.stop();
      if (p) {
        return p.split(separator);
      }
      return;
    })(-1);
    eve.on("snap.util.getattr.path", function () {
      const p = $(this.node, "d");
      eve.stop();
      return p;
    })(-1);
    eve.on("snap.util.getattr.class", function () {
      return this.node.className.baseVal;
    })(-1);
    function getFontSize() {
      eve.stop();
      return this.node.style.fontSize;
    }
    eve.on("snap.util.getattr.fontSize", getFontSize)(-1);
    eve.on("snap.util.getattr.font-size", getFontSize)(-1);
  });

  // Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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

  Snap.plugin((_Snap, Element, _Paper, _glob, _Fragment) => {
    const rgNotSpace = /\S+/g;
    const Str = String;
    const elproto = Element.prototype;
    /*\
       * Element.addClass
       [ method ]
       **
       * Adds given class name or list of class names to the element.
       - value (string) class name or space separated list of class names
       **
       = (Element) original element.
      \*/
    elproto.addClass = function (value) {
      const classes = Str(value || "").match(rgNotSpace) || [];
      const elem = this.node;
      const className = elem.className.baseVal;
      const curClasses = className.match(rgNotSpace) || [];
      let j;
      let pos;
      let clazz;
      let finalValue;

      if (classes.length) {
        j = 0;
        clazz = classes[j++];
        while (clazz) {
          pos = curClasses.indexOf(clazz);
          if (!~pos) {
            curClasses.push(clazz);
          }
          clazz = classes[j++];
        }

        finalValue = curClasses.join(" ");
        if (className != finalValue) {
          elem.className.baseVal = finalValue;
        }
      }
      return this;
    };
    /*\
       * Element.removeClass
       [ method ]
       **
       * Removes given class name or list of class names from the element.
       - value (string) class name or space separated list of class names
       **
       = (Element) original element.
      \*/
    elproto.removeClass = function (value) {
      const classes = Str(value || "").match(rgNotSpace) || [];
      const elem = this.node;
      const className = elem.className.baseVal;
      const curClasses = className.match(rgNotSpace) || [];
      let j;
      let pos;
      let clazz;
      let finalValue;
      if (curClasses.length) {
        j = 0;
        clazz = classes[j++];
        while (clazz) {
          pos = curClasses.indexOf(clazz);
          if (~pos) {
            curClasses.splice(pos, 1);
          }
          clazz = classes[j++];
        }

        finalValue = curClasses.join(" ");
        if (className != finalValue) {
          elem.className.baseVal = finalValue;
        }
      }
      return this;
    };
    /*\
       * Element.hasClass
       [ method ]
       **
       * Checks if the element has a given class name in the list of class names applied to it.
       - value (string) class name
       **
       = (boolean) `true` if the element has given class
      \*/
    elproto.hasClass = function (value) {
      const elem = this.node;
      const className = elem.className.baseVal;
      const curClasses = className.match(rgNotSpace) || [];
      return !!~curClasses.indexOf(value);
    };
    /*\
       * Element.toggleClass
       [ method ]
       **
       * Add or remove one or more classes from the element, depending on either
       * the class’s presence or the value of the `flag` argument.
       - value (string) class name or space separated list of class names
       - flag (boolean) value to determine whether the class should be added or removed
       **
       = (Element) original element.
      \*/
    elproto.toggleClass = function (value, flag) {
      if (flag != null) {
        if (flag) {
          return this.addClass(value);
        }
        return this.removeClass(value);
      }
      const classes = (value || "").match(rgNotSpace) || [];
      const elem = this.node;
      const className = elem.className.baseVal;
      const curClasses = className.match(rgNotSpace) || [];
      let j;
      let pos;
      let clazz;
      let finalValue;
      j = 0;
      clazz = classes[j++];
      while (clazz) {
        pos = curClasses.indexOf(clazz);
        if (~pos) {
          curClasses.splice(pos, 1);
        } else {
          curClasses.push(clazz);
        }
        clazz = classes[j++];
      }

      finalValue = curClasses.join(" ");
      if (className != finalValue) {
        elem.className.baseVal = finalValue;
      }
      return this;
    };
  });

  // Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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


  Snap.plugin((_Snap, _Element, _Paper, _glob, _Fragment) => {
    const operators = {
      "+": (x, y) => x + y,
      "-": (x, y) => x - y,
      "/": (x, y) => x / y,
      "*": (x, y) => x * y,
    };
    const Str = String;
    const reUnit = /[a-z]+$/i;
    const reAddon = /^\s*([+\-/*])\s*=\s*([\d.eE+-]+)\s*([^\d\s]+)?\s*$/;
    const getNumber = (val) => val;
    const getUnit = (unit) => (val) => +val.toFixed(3) + unit;
    eve.on("snap.util.attr", function (value) {
      let val = value;
      const plus = Str(val).match(reAddon);
      if (plus) {
        const evnt = eve.nt();
        const name = evnt.substring(evnt.lastIndexOf(".") + 1);
        let a = this.attr(name);
        const atr = {};
        eve.stop();
        const unit = plus[3] || "";
        const aUnit = a.match(reUnit);
        const op = operators[plus[1]];
        if (aUnit && aUnit == unit) {
          val = op(Number.parseFloat(a), +plus[2]);
        } else {
          a = this.asPX(name);
          val = op(this.asPX(name), this.asPX(name, plus[2] + unit));
        }
        if (Number.isNaN(+a) || Number.isNaN(+val)) {
          return;
        }
        atr[name] = val;
        this.attr(atr);
      }
    })(-10);
    eve.on("snap.util.equal", function (name, b) {
      let a = Str(this.attr(name) || "");
      const bplus = Str(b).match(reAddon);
      if (bplus) {
        eve.stop();
        const unit = bplus[3] || "";
        const aUnit = a.match(reUnit);
        const op = operators[bplus[1]];
        if (aUnit && aUnit == unit) {
          return {
            from: Number.parseFloat(a),
            to: op(Number.parseFloat(a), +bplus[2]),
            f: getUnit(aUnit),
          };
        }
        a = this.asPX(name);
        return {
          from: a,
          to: op(a, this.asPX(name, bplus[2] + unit)),
          f: getNumber,
        };
      }
    })(-10);
  });

  // Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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


  Snap.plugin((Snap, Element, Paper, glob, _Fragment) => {
    const proto = Paper.prototype;
    const is = Snap.is;
    /*\
       * Paper.rect
       [ method ]
       *
       * Draws a rectangle
       **
       - x (number) x coordinate of the top left corner
       - y (number) y coordinate of the top left corner
       - width (number) width
       - height (number) height
       - rx (number) #optional horizontal radius for rounded corners, default is 0
       - ry (number) #optional vertical radius for rounded corners, default is rx or 0
       = (object) the `rect` element
       **
       > Usage
       | // regular rectangle
       | var c = paper.rect(10, 10, 50, 50);
       | // rectangle with rounded corners
       | var c = paper.rect(40, 40, 50, 50, 10);
      \*/
    proto.rect = function (x, y, width, height, rx, ry = rx) {
      let attr;
      if (is(x, "object") && x == "[object Object]") {
        attr = x;
      } else if (x != null) {
        if (width == null) {
          attr = {
            x: 0,
            y: 0,
            width: x,
            height: y,
          };
        } else {
          attr = {
            x,
            y,
            width,
            height,
          };
        }
        if (rx != null) {
          attr.rx = rx;
          attr.ry = ry;
        }
      }
      return this.el("rect", attr);
    };
    /*\
       * Paper.circle
       [ method ]
       **
       * Draws a circle
       **
       - x (number) x coordinate of the centre
       - y (number) y coordinate of the centre
       - r (number) radius
       = (object) the `circle` element
       **
       > Usage
       | var c = paper.circle(50, 50, 40);
      \*/
    proto.circle = function (cx, cy, r = 0) {
      let attr;
      if (is(cx, "object") && cx == "[object Object]") {
        attr = cx;
      } else if (cx != null) {
        attr = {
          cx,
          cy,
          r,
        };
      }
      return this.el("circle", attr);
    };

    const preload = (() => {
      function onerror() {
        this.parentNode.removeChild(this);
      }
      return (src, f) => {
        const img = glob.doc.createElement("img");
        const body = glob.doc.body;
        img.style.cssText = "position:absolute;left:-9999em;top:-9999em";
        img.onload = () => {
          f.call(img);
          img.onload = img.onerror = null;
          body.removeChild(img);
        };
        img.onerror = onerror;
        body.appendChild(img);
        img.src = src;
      };
    })();

    /*\
       * Paper.image
       [ method ]
       **
       * Places an image on the surface
       **
       - src (string) URI of the source image
       - x (number) x offset position
       - y (number) y offset position
       - width (number) width of the image
       - height (number) height of the image
       = (object) the `image` element
       * or
       = (object) Snap element object with type `image`
       **
       > Usage
       | var c = paper.image("apple.png", 10, 10, 80, 80);
      \*/
    proto.image = function (src, x, y, width, height) {
      const el = this.el("image");
      if (is(src, "object") && "src" in src) {
        el.attr(src);
      } else if (src != null) {
        const set = {
          "xlink:href": src,
          preserveAspectRatio: "none",
        };
        if (x != null && y != null) {
          set.x = x;
          set.y = y;
        }
        if (width != null && height != null) {
          set.width = width;
          set.height = height;
        } else {
          preload(src, function () {
            let width;
            let height;
            const bcr = this.getBoundingClientRect?.();
            if (bcr) {
              width = bcr.width;
              height = bcr.height;
            } else {
              width = this.offsetWidth;
              height = this.offsetHeight;
            }
            Snap._.$(el.node, {
              width,
              height,
            });
          });
        }
        Snap._.$(el.node, set);
      }
      return el;
    };
    /*\
       * Paper.ellipse
       [ method ]
       **
       * Draws an ellipse
       **
       - x (number) x coordinate of the centre
       - y (number) y coordinate of the centre
       - rx (number) horizontal radius
       - ry (number) vertical radius
       = (object) the `ellipse` element
       **
       > Usage
       | var c = paper.ellipse(50, 50, 40, 20);
      \*/
    proto.ellipse = function (cx, cy, rx = 0, ry = 0) {
      let attr;
      if (is(cx, "object") && cx == "[object Object]") {
        attr = cx;
      } else if (cx != null) {
        attr = {
          cx,
          cy,
          rx,
          ry,
        };
      }
      return this.el("ellipse", attr);
    };
    // SIERRA Paper.path(): Unclear from the link what a Catmull-Rom curveto is, and why it would make life any easier.
    /*\
       * Paper.path
       [ method ]
       **
       * Creates a `<path>` element using the given string as the path's definition
       - pathString (string) #optional path string in SVG format
       * Path string consists of one-letter commands, followed by comma seprarated arguments in numerical form. Example:
       | "M10,20L30,40"
       * This example features two commands: `M`, with arguments `(10, 20)` and `L` with arguments `(30, 40)`. Uppercase letter commands express coordinates in absolute terms, while lowercase commands express them in relative terms from the most recently declared coordinates.
       *
       # <p>Here is short list of commands available, for more details see <a href="http://www.w3.org/TR/SVG/paths.html#PathData" title="Details of a path's data attribute's format are described in the SVG specification.">SVG path string format</a> or <a href="https://developer.mozilla.org/en/SVG/Tutorial/Paths">article about path strings at MDN</a>.</p>
       # <table><thead><tr><th>Command</th><th>Name</th><th>Parameters</th></tr></thead><tbody>
       # <tr><td>M</td><td>moveto</td><td>(x y)+</td></tr>
       # <tr><td>Z</td><td>closepath</td><td>(none)</td></tr>
       # <tr><td>L</td><td>lineto</td><td>(x y)+</td></tr>
       # <tr><td>H</td><td>horizontal lineto</td><td>x+</td></tr>
       # <tr><td>V</td><td>vertical lineto</td><td>y+</td></tr>
       # <tr><td>C</td><td>curveto</td><td>(x1 y1 x2 y2 x y)+</td></tr>
       # <tr><td>S</td><td>smooth curveto</td><td>(x2 y2 x y)+</td></tr>
       # <tr><td>Q</td><td>quadratic Bézier curveto</td><td>(x1 y1 x y)+</td></tr>
       # <tr><td>T</td><td>smooth quadratic Bézier curveto</td><td>(x y)+</td></tr>
       # <tr><td>A</td><td>elliptical arc</td><td>(rx ry x-axis-rotation large-arc-flag sweep-flag x y)+</td></tr>
       # <tr><td>R</td><td><a href="http://en.wikipedia.org/wiki/Catmull–Rom_spline#Catmull.E2.80.93Rom_spline">Catmull-Rom curveto</a>*</td><td>x1 y1 (x y)+</td></tr></tbody></table>
       * * _Catmull-Rom curveto_ is a not standard SVG command and added to make life easier.
       * Note: there is a special case when a path consists of only three commands: `M10,10R…z`. In this case the path connects back to its starting point.
       > Usage
       | var c = paper.path("M10 10L90 90");
       | // draw a diagonal line:
       | // move to 10,10, line to 90,90
      \*/
    proto.path = function (d) {
      let attr;
      if (is(d, "object") && !is(d, "array")) {
        attr = d;
      } else if (d) {
        attr = { d: d };
      }
      return this.el("path", attr);
    };
    /*\
       * Paper.g
       [ method ]
       **
       * Creates a group element
       **
       - varargs (…) #optional elements to nest within the group
       = (object) the `g` element
       **
       > Usage
       | var c1 = paper.circle(),
       |     c2 = paper.rect(),
       |     g = paper.g(c2, c1); // note that the order of elements is different
       * or
       | var c1 = paper.circle(),
       |     c2 = paper.rect(),
       |     g = paper.g();
       | g.add(c2, c1);
      \*/
    /*\
       * Paper.group
       [ method ]
       **
       * See @Paper.g
      \*/
    proto.group = proto.g = function (...list) {
      const el = this.el("g");
      if (list.length == 1 && list[0] && !list[0].type) {
        el.attr(list[0]);
      } else if (list.length) {
        el.add(list.slice(0));
      }
      return el;
    };
    /*\
       * Paper.svg
       [ method ]
       **
       * Creates a nested SVG element.
       - x (number) @optional X of the element
       - y (number) @optional Y of the element
       - width (number) @optional width of the element
       - height (number) @optional height of the element
       - vbx (number) @optional viewbox X
       - vby (number) @optional viewbox Y
       - vbw (number) @optional viewbox width
       - vbh (number) @optional viewbox height
       **
       = (object) the `svg` element
       **
      \*/
    proto.svg = function (x, y, width, height, vbx, vby, vbw, vbh) {
      let attrs = {};
      if (is(x, "object") && y == null) {
        attrs = x;
      } else {
        if (x != null) {
          attrs.x = x;
        }
        if (y != null) {
          attrs.y = y;
        }
        if (width != null) {
          attrs.width = width;
        }
        if (height != null) {
          attrs.height = height;
        }
        if (vbx != null && vby != null && vbw != null && vbh != null) {
          attrs.viewBox = [vbx, vby, vbw, vbh];
        }
      }
      return this.el("svg", attrs);
    };
    /*\
       * Paper.mask
       [ method ]
       **
       * Equivalent in behaviour to @Paper.g, except it’s a mask.
       **
       = (object) the `mask` element
       **
      \*/
    proto.mask = function (...list) {
      const el = this.el("mask");
      if (list.length == 1 && list[0] && !list[0].type) {
        el.attr(list[0]);
      } else if (list.length) {
        el.add(list.slice(0));
      }
      return el;
    };
    /*\
       * Paper.ptrn
       [ method ]
       **
       * Equivalent in behaviour to @Paper.g, except it’s a pattern.
       - x (number) @optional X of the element
       - y (number) @optional Y of the element
       - width (number) @optional width of the element
       - height (number) @optional height of the element
       - vbx (number) @optional viewbox X
       - vby (number) @optional viewbox Y
       - vbw (number) @optional viewbox width
       - vbh (number) @optional viewbox height
       **
       = (object) the `pattern` element
       **
      \*/
    proto.ptrn = function (x, y, width, height, vx, vy, vw, vh) {
      let attr;
      if (is(x, "object")) {
        attr = x;
      } else {
        attr = { patternUnits: "userSpaceOnUse" };
        if (x) {
          attr.x = x;
        }
        if (y) {
          attr.y = y;
        }
        if (width != null) {
          attr.width = width;
        }
        if (height != null) {
          attr.height = height;
        }
        if (vx != null && vy != null && vw != null && vh != null) {
          attr.viewBox = [vx, vy, vw, vh];
        } else {
          attr.viewBox = [x || 0, y || 0, width || 0, height || 0];
        }
      }
      return this.el("pattern", attr);
    };
    /*\
       * Paper.use
       [ method ]
       **
       * Creates a <use> element.
       - id (string) @optional id of element to link
       * or
       - id (Element) @optional element to link
       **
       = (object) the `use` element
       **
      \*/
    proto.use = function (ID) {
      let id = ID;
      if (id != null) {
        if (id instanceof Element) {
          if (!id.attr("id")) {
            id.attr({ id: Snap._.id(id) });
          }
          id = id.attr("id");
        }
        if (String(id).charAt() == "#") {
          id = id.substring(1);
        }
        return this.el("use", { "xlink:href": `#${id}` });
      }
      return Element.prototype.use.call(this);
    };
    /*\
       * Paper.symbol
       [ method ]
       **
       * Creates a <symbol> element.
       - vbx (number) @optional viewbox X
       - vby (number) @optional viewbox Y
       - vbw (number) @optional viewbox width
       - vbh (number) @optional viewbox height
       = (object) the `symbol` element
       **
      \*/
    proto.symbol = function (vx, vy, vw, vh) {
      const attr = {};
      if (vx != null && vy != null && vw != null && vh != null) {
        attr.viewBox = [vx, vy, vw, vh];
      }

      return this.el("symbol", attr);
    };
    /*\
       * Paper.text
       [ method ]
       **
       * Draws a text string
       **
       - x (number) x coordinate position
       - y (number) y coordinate position
       - text (string|array) The text string to draw or array of strings to nest within separate `<tspan>` elements
       = (object) the `text` element
       **
       > Usage
       | var t1 = paper.text(50, 50, "Snap");
       | var t2 = paper.text(50, 50, ["S","n","a","p"]);
       | // Text path usage
       | t1.attr({textpath: "M10,10L100,100"});
       | // or
       | var pth = paper.path("M10,10L100,100");
       | t1.attr({textpath: pth});
      \*/
    proto.text = function (x, y, text) {
      let attr = {};
      if (is(x, "object")) {
        attr = x;
      } else if (x != null) {
        attr = {
          x,
          y,
          text: text || "",
        };
      }
      return this.el("text", attr);
    };
    /*\
       * Paper.line
       [ method ]
       **
       * Draws a line
       **
       - x1 (number) x coordinate position of the start
       - y1 (number) y coordinate position of the start
       - x2 (number) x coordinate position of the end
       - y2 (number) y coordinate position of the end
       = (object) the `line` element
       **
       > Usage
       | var t1 = paper.line(50, 50, 100, 100);
      \*/
    proto.line = function (x1, y1, x2, y2) {
      let attr = {};
      if (is(x1, "object")) {
        attr = x1;
      } else if (x1 != null) {
        attr = {
          x1,
          x2,
          y1,
          y2,
        };
      }
      return this.el("line", attr);
    };
    /*\
       * Paper.polyline
       [ method ]
       **
       * Draws a polyline
       **
       - points (array) array of points
       * or
       - varargs (…) points
       = (object) the `polyline` element
       **
       > Usage
       | var p1 = paper.polyline([10, 10, 100, 100]);
       | var p2 = paper.polyline(10, 10, 100, 100);
      \*/
    proto.polyline = function (...list) {
      let points = list[0];
      if (list.length > 1) {
        points = list.slice(0);
      }
      let attr = {};
      if (is(points, "object") && !is(points, "array")) {
        attr = points;
      } else if (points != null) {
        attr = { points: points };
      }
      return this.el("polyline", attr);
    };
    /*\
       * Paper.polygon
       [ method ]
       **
       * Draws a polygon. See @Paper.polyline
      \*/
    proto.polygon = function (...list) {
      let points = list[0];
      if (list.length > 1) {
        points = list.slice(0);
      }
      let attr = {};
      if (is(points, "object") && !is(points, "array")) {
        attr = points;
      } else if (points != null) {
        attr = { points: points };
      }
      return this.el("polygon", attr);
    };
    // gradients
    (() => {
      const $ = Snap._.$;
      // gradients' helpers
      /*\
           * Element.stops
           [ method ]
           **
           * Only for gradients!
           * Returns array of gradient stops elements.
           = (array) the stops array.
          \*/
      function Gstops() {
        return this.selectAll("stop");
      }
      /*\
           * Element.addStop
           [ method ]
           **
           * Only for gradients!
           * Adds another stop to the gradient.
           - color (string) stops color
           - offset (number) stops offset 0..100
           = (object) gradient element
          \*/
      function GaddStop(colour, offset) {
        let color = colour;
        const stop = $("stop");
        const attr = {
          offset: `${+offset}%`,
        };
        color = Snap.color(color);
        attr["stop-color"] = color.hex;
        if (color.opacity < 1) {
          attr["stop-opacity"] = color.opacity;
        }
        $(stop, attr);
        const stops = this.stops();
        let inserted;
        for (let i = 0; i < stops.length; i++) {
          const stopOffset = Number.parseFloat(stops[i].attr("offset"));
          if (stopOffset > offset) {
            this.node.insertBefore(stop, stops[i].node);
            inserted = true;
            break;
          }
        }
        if (!inserted) {
          this.node.appendChild(stop);
        }
        return this;
      }
      function GgetBBox() {
        if (this.type == "linearGradient") {
          const x1 = $(this.node, "x1") || 0;
          const x2 = $(this.node, "x2") || 1;
          const y1 = $(this.node, "y1") || 0;
          const y2 = $(this.node, "y2") || 0;
          return Snap._.box(x1, y1, Math.abs(x2 - x1), Math.abs(y2 - y1));
        }
        const cx = this.node.cx || 0.5;
        const cy = this.node.cy || 0.5;
        const r = this.node.r || 0;
        return Snap._.box(cx - r, cy - r, r * 2, r * 2);
      }
      /*\
           * Element.setStops
           [ method ]
           **
           * Only for gradients!
           * Updates stops of the gradient based on passed gradient descriptor. See @Ppaer.gradient
           - str (string) gradient descriptor part after `()`.
           = (object) gradient element
           | var g = paper.gradient("l(0, 0, 1, 1)#000-#f00-#fff");
           | g.setStops("#fff-#000-#f00-#fc0");
          \*/
      function GsetStops(str) {
        let grad = str;
        const stops = this.stops();
        if (typeof str == "string") {
          grad = eve(
            "snap.util.grad.parse",
            null,
            `l(0,0,0,1)${str}`,
          ).firstDefined().stops;
        }
        if (!Snap.is(grad, "array")) {
          return;
        }
        for (let i = 0; i < stops.length; i++) {
          if (grad[i]) {
            const color = Snap.color(grad[i].color);
            const attr = { offset: `${grad[i].offset}%` };
            attr["stop-color"] = color.hex;
            if (color.opacity < 1) {
              attr["stop-opacity"] = color.opacity;
            }
            stops[i].attr(attr);
          } else {
            stops[i].remove();
          }
        }
        for (let i = stops.length; i < grad.length; i++) {
          this.addStop(grad[i].color, grad[i].offset);
        }
        return this;
      }
      const gradient = (defs, str) => {
        const grad = eve("snap.util.grad.parse", null, str).firstDefined();
        let el;
        if (!grad) {
          return null;
        }
        grad.params.unshift(defs);
        if (grad.type.toLowerCase() == "l") {
          el = gradientLinear.apply(0, grad.params);
        } else {
          el = gradientRadial.apply(0, grad.params);
        }
        if (grad.type != grad.type.toLowerCase()) {
          $(el.node, {
            gradientUnits: "userSpaceOnUse",
          });
        }
        const stops = grad.stops;
        const len = stops.length;
        for (let i = 0; i < len; i++) {
          const stop = stops[i];
          el.addStop(stop.color, stop.offset);
        }
        return el;
      };
      const gradientLinear = (defs, x1, y1, x2, y2) => {
        const el = Snap._.make("linearGradient", defs);
        el.stops = Gstops;
        el.addStop = GaddStop;
        el.getBBox = GgetBBox;
        el.setStops = GsetStops;
        if (x1 != null) {
          $(el.node, {
            x1,
            y1,
            x2,
            y2,
          });
        }
        return el;
      };
      const gradientRadial = (defs, cx, cy, r, fx, fy) => {
        const el = Snap._.make("radialGradient", defs);
        el.stops = Gstops;
        el.addStop = GaddStop;
        el.getBBox = GgetBBox;
        el.setStops = GsetStops;
        if (cx != null) {
          $(el.node, {
            cx,
            cy,
            r,
          });
        }
        if (fx != null && fy != null) {
          $(el.node, {
            fx,
            fy,
          });
        }
        return el;
      };
      /*\
           * Paper.gradient
           [ method ]
           **
           * Creates a gradient element
           **
           - gradient (string) gradient descriptor
           > Gradient Descriptor
           * The gradient descriptor is an expression formatted as
           * follows: `<type>(<coords>)<colors>`.  The `<type>` can be
           * either linear or radial.  The uppercase `L` or `R` letters
           * indicate absolute coordinates offset from the SVG surface.
           * Lowercase `l` or `r` letters indicate coordinates
           * calculated relative to the element to which the gradient is
           * applied.  Coordinates specify a linear gradient vector as
           * `x1`, `y1`, `x2`, `y2`, or a radial gradient as `cx`, `cy`,
           * `r` and optional `fx`, `fy` specifying a focal point away
           * from the center of the circle. Specify `<colors>` as a list
           * of dash-separated CSS color values.  Each color may be
           * followed by a custom offset value, separated with a colon
           * character.
           > Examples
           * Linear gradient, relative from top-left corner to bottom-right
           * corner, from black through red to white:
           | var g = paper.gradient("l(0, 0, 1, 1)#000-#f00-#fff");
           * Linear gradient, absolute from (0, 0) to (100, 100), from black
           * through red at 25% to white:
           | var g = paper.gradient("L(0, 0, 100, 100)#000-#f00:25-#fff");
           * Radial gradient, relative from the center of the element with radius
           * half the width, from black to white:
           | var g = paper.gradient("r(0.5, 0.5, 0.5)#000-#fff");
           * To apply the gradient:
           | paper.circle(50, 50, 40).attr({
           |     fill: g
           | });
           = (object) the `gradient` element
          \*/
      proto.gradient = function (str) {
        return gradient(this.defs, str);
      };
      proto.gradientLinear = function (x1, y1, x2, y2) {
        return gradientLinear(this.defs, x1, y1, x2, y2);
      };
      proto.gradientRadial = function (cx, cy, r, fx, fy) {
        return gradientRadial(this.defs, cx, cy, r, fx, fy);
      };
      /*\
           * Paper.toString
           [ method ]
           **
           * Returns SVG code for the @Paper
           = (string) SVG code for the @Paper
          \*/
      proto.toString = function () {
        const doc = this.node.ownerDocument;
        const f = doc.createDocumentFragment();
        const d = doc.createElement("div");
        const svg = this.node.cloneNode(true);
        f.appendChild(d);
        d.appendChild(svg);
        Snap._.$(svg, { xmlns: "http://www.w3.org/2000/svg" });
        const res = d.innerHTML;
        f.removeChild(f.firstChild);
        return res;
      };
      /*\
           * Paper.toDataURL
           [ method ]
           **
           * Returns SVG code for the @Paper as Data URI string.
           = (string) Data URI string
          \*/
      proto.toDataURL = function () {
        if (window?.btoa) {
          return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(this)))}`;
        }
      };
      /*\
           * Paper.clear
           [ method ]
           **
           * Removes all child nodes of the paper, except <defs>.
          \*/
      proto.clear = function () {
        let node = this.node.firstChild;
        let next;
        while (node) {
          next = node.nextSibling;
          if (node.tagName != "defs") {
            node.parentNode.removeChild(node);
          } else {
            proto.clear.call({ node: node });
          }
          node = next;
        }
      };
    })();
  });

  // Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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

  Snap.plugin((Snap, Element) => {
    const elproto = Element.prototype;
    const is = Snap.is;
    const clone = Snap._.clone;
    const has = "hasOwnProperty";
    const p2s = /,?([a-z]),?/gi;
    const toFloat = Number.parseFloat;
    const math = Math;
    const PI = math.PI;
    const mmin = math.min;
    const mmax = math.max;
    const pow = math.pow;
    const abs = math.abs;
    const paths = (ps) => {
      paths.ps = paths.ps || {};
      const p = paths.ps;
      if (p[ps]) {
        p[ps].sleep = 100;
      } else {
        p[ps] = {
          sleep: 100,
        };
      }
      setTimeout(() => {
        for (const key in p)
          if (p[has](key) && key != ps) {
            p[key].sleep--;
            !p[key].sleep && delete p[key];
          }
      });
      return p[ps];
    };
    const box = (x1, y1, w, h) => {
      let width = w;
      let height = h;
      let x = x1;
      let y = y1;
      if (x == null) {
        x = y = width = height = 0;
      }
      if (y == null) {
        y = x.y;
        width = x.width;
        height = x.height;
        x = x.x;
      }
      return {
        x,
        y,
        width,
        w: width,
        height,
        h: height,
        x2: x + width,
        y2: y + height,
        cx: x + width / 2,
        cy: y + height / 2,
        r1: math.min(width, height) / 2,
        r2: math.max(width, height) / 2,
        r0: math.sqrt(width * width + height * height) / 2,
        path: rectPath(x, y, width, height),
        vb: [x, y, width, height].join(" "),
      };
    };
    function toString() {
      return this.join(",").replace(p2s, "$1");
    }
    const pathClone = (pathArray) => {
      const res = clone(pathArray);
      res.toString = toString;
      return res;
    };
    const getPointAtSegmentLength = (
      p1x,
      p1y,
      c1x,
      c1y,
      c2x,
      c2y,
      p2x,
      p2y,
      length,
    ) => {
      if (length == null) {
        return bezlen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y);
      }
      return findDotsAtSegment(
        p1x,
        p1y,
        c1x,
        c1y,
        c2x,
        c2y,
        p2x,
        p2y,
        getTotLen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length),
      );
    };
    const getLengthFactory = (istotal, subpath) => {
      const O = (val) => math.round(val * 1e3) / 1e3;
      return Snap._.cacher(
        (path2, length, onlystart) => {
          let path = path2;
          if (path instanceof Element) {
            path = path.attr("d");
          }
          path = path2curve(path);
          let x;
          let y;
          let p;
          let l;
          let sp = "";
          const subpaths = {};
          let point;
          let len = 0;
          for (let i = 0, ii = path.length; i < ii; i++) {
            p = path[i];
            if (p[0] == "M") {
              x = +p[1];
              y = +p[2];
            } else {
              l = getPointAtSegmentLength(
                x,
                y,
                p[1],
                p[2],
                p[3],
                p[4],
                p[5],
                p[6],
              );
              if (len + l > length) {
                if (subpath && !subpaths.start) {
                  point = getPointAtSegmentLength(
                    x,
                    y,
                    p[1],
                    p[2],
                    p[3],
                    p[4],
                    p[5],
                    p[6],
                    length - len,
                  );
                  sp += [
                    `C${O(point.start.x)}`,
                    O(point.start.y),
                    O(point.m.x),
                    O(point.m.y),
                    O(point.x),
                    O(point.y),
                  ];
                  if (onlystart) {
                    return sp;
                  }
                  subpaths.start = sp;
                  sp = [
                    `M${O(point.x)}`,
                    `${O(point.y)}C${O(point.n.x)}`,
                    O(point.n.y),
                    O(point.end.x),
                    O(point.end.y),
                    O(p[5]),
                    O(p[6]),
                  ].join();
                  len += l;
                  x = +p[5];
                  y = +p[6];
                  continue;
                }
                if (!istotal && !subpath) {
                  point = getPointAtSegmentLength(
                    x,
                    y,
                    p[1],
                    p[2],
                    p[3],
                    p[4],
                    p[5],
                    p[6],
                    length - len,
                  );
                  return point;
                }
              }
              len += l;
              x = +p[5];
              y = +p[6];
            }
            sp += p.shift() + p;
          }
          subpaths.end = sp;
          point = istotal
            ? len
            : subpath
              ? subpaths
              : findDotsAtSegment(x, y, p[0], p[1], p[2], p[3], p[4], p[5], 1);
          return point;
        },
        null,
        Snap._.clone,
      );
    };
    const getTotalLength = getLengthFactory(1);
    const getPointAtLength = getLengthFactory();
    const getSubpathsAtLength = getLengthFactory(0, 1);
    const findDotsAtSegment = (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) => {
      const t1 = 1 - t;
      const t13 = pow(t1, 3);
      const t12 = pow(t1, 2);
      const t2 = t * t;
      const t3 = t2 * t;
      const x = t13 * p1x + t12 * 3 * t * c1x + t1 * 3 * t * t * c2x + t3 * p2x;
      const y = t13 * p1y + t12 * 3 * t * c1y + t1 * 3 * t * t * c2y + t3 * p2y;
      const mx = p1x + 2 * t * (c1x - p1x) + t2 * (c2x - 2 * c1x + p1x);
      const my = p1y + 2 * t * (c1y - p1y) + t2 * (c2y - 2 * c1y + p1y);
      const nx = c1x + 2 * t * (c2x - c1x) + t2 * (p2x - 2 * c2x + c1x);
      const ny = c1y + 2 * t * (c2y - c1y) + t2 * (p2y - 2 * c2y + c1y);
      const ax = t1 * p1x + t * c1x;
      const ay = t1 * p1y + t * c1y;
      const cx = t1 * c2x + t * p2x;
      const cy = t1 * c2y + t * p2y;
      // Tangent points in the increasing-t direction n - m (B'(t) = 3*(n - m)).
      // The old form `90 - atan2(mx - nx, my - ny)` used m - n, so every angle
      // came out 180 deg reversed.
      const alpha = (math.atan2(ny - my, nx - mx) * 180) / PI;
      return {
        x,
        y,
        m: { x: mx, y: my },
        n: { x: nx, y: ny },
        start: { x: ax, y: ay },
        end: { x: cx, y: cy },
        alpha,
      };
    };
    const bezierBBox = (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y) => {
      let arr = p1x;
      if (!Snap.is(arr, "array")) {
        arr = [p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y];
      }
      const bbox = curveDim.apply(null, arr);
      return box(
        bbox.min.x,
        bbox.min.y,
        bbox.max.x - bbox.min.x,
        bbox.max.y - bbox.min.y,
      );
    };
    const isPointInsideBBox = (bbox, x, y) => {
      return (
        x >= bbox.x &&
        x <= bbox.x + bbox.width &&
        y >= bbox.y &&
        y <= bbox.y + bbox.height
      );
    };
    const isBBoxIntersect = (obbox1, obbox2) => {
      const bbox1 = box(obbox1);
      const bbox2 = box(obbox2);
      return (
        isPointInsideBBox(bbox2, bbox1.x, bbox1.y) ||
        isPointInsideBBox(bbox2, bbox1.x2, bbox1.y) ||
        isPointInsideBBox(bbox2, bbox1.x, bbox1.y2) ||
        isPointInsideBBox(bbox2, bbox1.x2, bbox1.y2) ||
        isPointInsideBBox(bbox1, bbox2.x, bbox2.y) ||
        isPointInsideBBox(bbox1, bbox2.x2, bbox2.y) ||
        isPointInsideBBox(bbox1, bbox2.x, bbox2.y2) ||
        isPointInsideBBox(bbox1, bbox2.x2, bbox2.y2) ||
        (((bbox1.x < bbox2.x2 && bbox1.x > bbox2.x) ||
          (bbox2.x < bbox1.x2 && bbox2.x > bbox1.x)) &&
          ((bbox1.y < bbox2.y2 && bbox1.y > bbox2.y) ||
            (bbox2.y < bbox1.y2 && bbox2.y > bbox1.y)))
      );
    };
    const base3 = (t, p1, p2, p3, p4) => {
      const t1 = -3 * p1 + 9 * p2 - 9 * p3 + 3 * p4;
      const t2 = t * t1 + 6 * p1 - 12 * p2 + 6 * p3;
      return t * t2 - 3 * p1 + 3 * p2;
    };
    const bezlen = (x1, y1, x2, y2, x3, y3, x4, y4, z1 = 1) => {
      const z = z1 > 1 ? 1 : z1 < 0 ? 0 : z1;
      const z2 = z / 2;
      const n = 12;
      const Tvalues = [
        -0.1252, 0.1252, -0.3678, 0.3678, -0.5873, 0.5873, -0.7699, 0.7699,
        -0.9041, 0.9041, -0.9816, 0.9816,
      ];
      const Cvalues = [
        0.2491, 0.2491, 0.2335, 0.2335, 0.2032, 0.2032, 0.1601, 0.1601, 0.1069,
        0.1069, 0.0472, 0.0472,
      ];
      let sum = 0;
      for (let i = 0; i < n; i++) {
        const ct = z2 * Tvalues[i] + z2;
        const xbase = base3(ct, x1, x2, x3, x4);
        const ybase = base3(ct, y1, y2, y3, y4);
        const comb = xbase * xbase + ybase * ybase;
        sum += Cvalues[i] * math.sqrt(comb);
      }
      return z2 * sum;
    };
    const getTotLen = (x1, y1, x2, y2, x3, y3, x4, y4, ll) => {
      if (ll < 0 || bezlen(x1, y1, x2, y2, x3, y3, x4, y4) < ll) {
        return;
      }
      const t = 1;
      let step = t / 2;
      let t2 = t - step;
      let l;
      const e = 0.01;
      l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
      while (abs(l - ll) > e) {
        step /= 2;
        t2 += (l < ll ? 1 : -1) * step;
        l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
      }
      return t2;
    };
    const intersect = (x1, y1, x2, y2, x3, y3, x4, y4) => {
      if (
        mmax(x1, x2) < mmin(x3, x4) ||
        mmin(x1, x2) > mmax(x3, x4) ||
        mmax(y1, y2) < mmin(y3, y4) ||
        mmin(y1, y2) > mmax(y3, y4)
      ) {
        return;
      }
      const nx =
        (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4);
      const ny =
        (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);
      const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

      if (!denominator) {
        return;
      }
      const px = nx / denominator;
      const py = ny / denominator;
      const px2 = +px.toFixed(2);
      const py2 = +py.toFixed(2);
      if (
        px2 < +mmin(x1, x2).toFixed(2) ||
        px2 > +mmax(x1, x2).toFixed(2) ||
        px2 < +mmin(x3, x4).toFixed(2) ||
        px2 > +mmax(x3, x4).toFixed(2) ||
        py2 < +mmin(y1, y2).toFixed(2) ||
        py2 > +mmax(y1, y2).toFixed(2) ||
        py2 < +mmin(y3, y4).toFixed(2) ||
        py2 > +mmax(y3, y4).toFixed(2)
      ) {
        return;
      }
      return { x: px, y: py };
    };
    const interHelper = (bez1, bez2, justCount) => {
      const bbox1 = bezierBBox(bez1);
      const bbox2 = bezierBBox(bez2);
      if (!isBBoxIntersect(bbox1, bbox2)) {
        return justCount ? 0 : [];
      }
      const l1 = bezlen.apply(0, bez1);
      const l2 = bezlen.apply(0, bez2);
      const n1 = ~~(l1 / 8);
      const n2 = ~~(l2 / 8);
      const dots1 = [];
      const dots2 = [];
      const xy = {};
      let res = justCount ? 0 : [];
      for (let i = 0; i < n1 + 1; i++) {
        const p = findDotsAtSegment.apply(0, bez1.concat(i / n1));
        dots1.push({ x: p.x, y: p.y, t: i / n1 });
      }
      for (let i = 0; i < n2 + 1; i++) {
        const p = findDotsAtSegment.apply(0, bez2.concat(i / n2));
        dots2.push({ x: p.x, y: p.y, t: i / n2 });
      }
      for (let i = 0; i < n1; i++) {
        for (let j = 0; j < n2; j++) {
          const di = dots1[i];
          const di1 = dots1[i + 1];
          const dj = dots2[j];
          const dj1 = dots2[j + 1];
          const ci = abs(di1.x - di.x) < 0.001 ? "y" : "x";
          const cj = abs(dj1.x - dj.x) < 0.001 ? "y" : "x";
          const is = intersect(
            di.x,
            di.y,
            di1.x,
            di1.y,
            dj.x,
            dj.y,
            dj1.x,
            dj1.y,
          );
          if (is) {
            if (xy[is.x.toFixed(4)] == is.y.toFixed(4)) {
              continue;
            }
            xy[is.x.toFixed(4)] = is.y.toFixed(4);
            const t1 =
              di.t + abs((is[ci] - di[ci]) / (di1[ci] - di[ci])) * (di1.t - di.t);
            const t2 =
              dj.t + abs((is[cj] - dj[cj]) / (dj1[cj] - dj[cj])) * (dj1.t - dj.t);
            if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
              if (justCount) {
                res++;
              } else {
                res.push({
                  x: is.x,
                  y: is.y,
                  t1,
                  t2,
                });
              }
            }
          }
        }
      }
      return res;
    };
    const pathIntersection = (path1, path2) => interPathHelper(path1, path2);
    const pathIntersectionNumber = (path1, path2) =>
      interPathHelper(path1, path2, 1);
    const interPathHelper = (opath1, opath2, justCount) => {
      const path1 = path2curve(opath1);
      const path2 = path2curve(opath2);
      let x1;
      let y1;
      let x2;
      let y2;
      let x1m;
      let y1m;
      let x2m;
      let y2m;
      let bez1;
      let bez2;
      let res = justCount ? 0 : [];
      for (let i = 0, ii = path1.length; i < ii; i++) {
        const pi = path1[i];
        if (pi[0] == "M") {
          x1 = x1m = pi[1];
          y1 = y1m = pi[2];
        } else {
          if (pi[0] == "C") {
            bez1 = [x1, y1].concat(pi.slice(1));
            x1 = bez1[6];
            y1 = bez1[7];
          } else {
            bez1 = [x1, y1, x1, y1, x1m, y1m, x1m, y1m];
            x1 = x1m;
            y1 = y1m;
          }
          for (let j = 0, jj = path2.length; j < jj; j++) {
            const pj = path2[j];
            if (pj[0] == "M") {
              x2 = x2m = pj[1];
              y2 = y2m = pj[2];
            } else {
              if (pj[0] == "C") {
                bez2 = [x2, y2].concat(pj.slice(1));
                x2 = bez2[6];
                y2 = bez2[7];
              } else {
                bez2 = [x2, y2, x2, y2, x2m, y2m, x2m, y2m];
                x2 = x2m;
                y2 = y2m;
              }
              const intr = interHelper(bez1, bez2, justCount);
              if (justCount) {
                res += intr;
              } else {
                for (let k = 0, kk = intr.length; k < kk; k++) {
                  intr[k].segment1 = i;
                  intr[k].segment2 = j;
                  intr[k].bez1 = bez1;
                  intr[k].bez2 = bez2;
                }
                res = res.concat(intr);
              }
            }
          }
        }
      }
      return res;
    };
    const isPointInsidePath = (path, x, y) => {
      const bbox = pathBBox(path);
      return (
        isPointInsideBBox(bbox, x, y) &&
        interPathHelper(
          path,
          [
            ["M", x, y],
            ["H", bbox.x2 + 10],
          ],
          1,
        ) %
          2 ==
          1
      );
    };
    const pathBBox = (path2) => {
      const pth = paths(path2);
      if (pth.bbox) {
        return clone(pth.bbox);
      }
      if (!path2) {
        return box();
      }
      const path = path2curve(path2);
      let x = 0;
      let y = 0;
      let X = [];
      let Y = [];
      let p;
      for (let i = 0, ii = path.length; i < ii; i++) {
        p = path[i];
        if (p[0] == "M") {
          x = p[1];
          y = p[2];
          X.push(x);
          Y.push(y);
        } else {
          const dim = curveDim(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
          X = X.concat(dim.min.x, dim.max.x);
          Y = Y.concat(dim.min.y, dim.max.y);
          x = p[5];
          y = p[6];
        }
      }
      const xmin = mmin.apply(0, X);
      const ymin = mmin.apply(0, Y);
      const xmax = mmax.apply(0, X);
      const ymax = mmax.apply(0, Y);
      const bb = box(xmin, ymin, xmax - xmin, ymax - ymin);
      pth.bbox = clone(bb);
      return bb;
    };
    const rectPath = (x, y, w, h, r) => {
      if (r) {
        return [
          ["M", +x + +r, y],
          ["l", w - r * 2, 0],
          ["a", r, r, 0, 0, 1, r, r],
          ["l", 0, h - r * 2],
          ["a", r, r, 0, 0, 1, -r, r],
          ["l", r * 2 - w, 0],
          ["a", r, r, 0, 0, 1, -r, -r],
          ["l", 0, r * 2 - h],
          ["a", r, r, 0, 0, 1, r, -r],
          ["z"],
        ];
      }
      const res = [["M", x, y], ["l", w, 0], ["l", 0, h], ["l", -w, 0], ["z"]];
      res.toString = toString;
      return res;
    };
    const ellipsePath = (x1, y1, radiusx, radiusy, a) => {
      let x = x1;
      let y = y1;
      let rx = radiusx;
      let ry = radiusy;
      if (a == null && ry == null) {
        ry = rx;
      }
      x = +x;
      y = +y;
      rx = +rx;
      ry = +ry;
      let res;
      if (a != null) {
        const rad = Math.PI / 180;
        const x1 = x + rx * Math.cos(-ry * rad);
        const x2 = x + rx * Math.cos(-a * rad);
        const y1 = y + rx * Math.sin(-ry * rad);
        const y2 = y + rx * Math.sin(-a * rad);
        res = [
          ["M", x1, y1],
          ["A", rx, rx, 0, +(a - ry > 180), 0, x2, y2],
        ];
      } else {
        res = [
          ["M", x, y],
          ["m", 0, -ry],
          ["a", rx, ry, 0, 1, 1, 0, 2 * ry],
          ["a", rx, ry, 0, 1, 1, 0, -2 * ry],
          ["z"],
        ];
      }
      res.toString = toString;
      return res;
    };
    const unit2px = Snap._unit2px;
    const getPath = {
      path: (el) => el.attr("path"),
      circle: (el) => {
        const attr = unit2px(el);
        return ellipsePath(attr.cx, attr.cy, attr.r);
      },
      ellipse: (el) => {
        const attr = unit2px(el);
        return ellipsePath(attr.cx || 0, attr.cy || 0, attr.rx, attr.ry);
      },
      rect: (el) => {
        const attr = unit2px(el);
        return rectPath(
          attr.x || 0,
          attr.y || 0,
          attr.width,
          attr.height,
          attr.rx,
          attr.ry,
        );
      },
      image: (el) => {
        const attr = unit2px(el);
        return rectPath(attr.x || 0, attr.y || 0, attr.width, attr.height);
      },
      line: (el) =>
        `M${[el.attr("x1") || 0, el.attr("y1") || 0, el.attr("x2"), el.attr("y2")]}`,
      polyline: (el) => `M${el.attr("points")}`,
      polygon: (el) => `M${el.attr("points")}z`,
      deflt: (el) => {
        const bbox = el.node.getBBox();
        return rectPath(bbox.x, bbox.y, bbox.width, bbox.height);
      },
    };
    const pathToRelative = (path) => {
      let pathArray = path;
      const pth = paths(pathArray);
      const lowerCase = String.prototype.toLowerCase;
      if (pth.rel) {
        return pathClone(pth.rel);
      }
      if (!Snap.is(pathArray, "array") || !Snap.is(pathArray?.[0], "array")) {
        pathArray = Snap.parsePathString(pathArray);
      }
      const res = [];
      let x = 0;
      let y = 0;
      let mx = 0;
      let my = 0;
      let start = 0;
      if (pathArray[0][0] == "M") {
        x = pathArray[0][1];
        y = pathArray[0][2];
        mx = x;
        my = y;
        start++;
        res.push(["M", x, y]);
      }
      for (let i = start, ii = pathArray.length; i < ii; i++) {
        res[i] = [];
        let r = res[i];
        const pa = pathArray[i];
        if (pa[0] != lowerCase.call(pa[0])) {
          r[0] = lowerCase.call(pa[0]);
          switch (r[0]) {
            case "a":
              r[1] = pa[1];
              r[2] = pa[2];
              r[3] = pa[3];
              r[4] = pa[4];
              r[5] = pa[5];
              r[6] = +(pa[6] - x).toFixed(3);
              r[7] = +(pa[7] - y).toFixed(3);
              break;
            case "v":
              r[1] = +(pa[1] - y).toFixed(3);
              break;
            case "m":
              mx = pa[1];
              my = pa[2];
            default:
              for (let j = 1, jj = pa.length; j < jj; j++) {
                r[j] = +(pa[j] - (j % 2 ? x : y)).toFixed(3);
              }
          }
        } else {
          r = res[i] = [];
          if (pa[0] == "m") {
            mx = pa[1] + x;
            my = pa[2] + y;
          }
          for (let k = 0, kk = pa.length; k < kk; k++) {
            res[i][k] = pa[k];
          }
        }
        const len = res[i].length;
        switch (res[i][0]) {
          case "z":
            x = mx;
            y = my;
            break;
          case "h":
            x += +res[i][len - 1];
            break;
          case "v":
            y += +res[i][len - 1];
            break;
          default:
            x += +res[i][len - 2];
            y += +res[i][len - 1];
        }
      }
      res.toString = toString;
      pth.rel = pathClone(res);
      return res;
    };
    const pathToAbsolute = (path) => {
      let pathArray = path;
      const pth = paths(pathArray);
      if (pth.abs) {
        return pathClone(pth.abs);
      }
      if (!is(pathArray, "array") || !is(pathArray?.[0], "array")) {
        // rough assumption
        pathArray = Snap.parsePathString(pathArray);
      }
      if (!pathArray?.length) {
        return [["M", 0, 0]];
      }
      let res = [];
      let x = 0;
      let y = 0;
      let mx = 0;
      let my = 0;
      let start = 0;
      let pa0;
      let dots;
      if (pathArray[0][0] == "M") {
        x = +pathArray[0][1];
        y = +pathArray[0][2];
        mx = x;
        my = y;
        start++;
        res[0] = ["M", x, y];
      }
      const crz =
        pathArray.length == 3 &&
        pathArray[0][0] == "M" &&
        pathArray[1][0].toUpperCase() == "R" &&
        pathArray[2][0].toUpperCase() == "Z";
      for (let r, pa, i = start, ii = pathArray.length; i < ii; i++) {
        r = [];
        res.push(r);
        pa = pathArray[i];
        pa0 = pa[0];
        if (pa0 != pa0.toUpperCase()) {
          r[0] = pa0.toUpperCase();
          switch (r[0]) {
            case "A":
              r[1] = pa[1];
              r[2] = pa[2];
              r[3] = pa[3];
              r[4] = pa[4];
              r[5] = pa[5];
              r[6] = +pa[6] + x;
              r[7] = +pa[7] + y;
              break;
            case "V":
              r[1] = +pa[1] + y;
              break;
            case "H":
              r[1] = +pa[1] + x;
              break;
            case "R": {
              const dots = [x, y].concat(pa.slice(1));
              for (let j = 2, jj = dots.length; j < jj; j++) {
                dots[j] = +dots[j] + x;
                dots[++j] = +dots[j] + y;
              }
              res.pop();
              res = res.concat(catmullRom2bezier(dots, crz));
              break;
            }
            case "O":
              res.pop();
              dots = ellipsePath(x, y, pa[1], pa[2]);
              dots.push(dots[0]);
              res = res.concat(dots);
              break;
            case "U":
              res.pop();
              res = res.concat(ellipsePath(x, y, pa[1], pa[2], pa[3]));
              r = ["U"].concat(res[res.length - 1].slice(-2));
              break;
            case "M":
              mx = +pa[1] + x;
              my = +pa[2] + y;
            default:
              for (let j = 1, jj = pa.length; j < jj; j++) {
                r[j] = +pa[j] + (j % 2 ? x : y);
              }
          }
        } else if (pa0 == "R") {
          dots = [x, y].concat(pa.slice(1));
          res.pop();
          res = res.concat(catmullRom2bezier(dots, crz));
          r = ["R"].concat(pa.slice(-2));
        } else if (pa0 == "O") {
          res.pop();
          dots = ellipsePath(x, y, pa[1], pa[2]);
          dots.push(dots[0]);
          res = res.concat(dots);
        } else if (pa0 == "U") {
          res.pop();
          res = res.concat(ellipsePath(x, y, pa[1], pa[2], pa[3]));
          r = ["U"].concat(res[res.length - 1].slice(-2));
        } else {
          for (let k = 0, kk = pa.length; k < kk; k++) {
            r[k] = pa[k];
          }
        }
        pa0 = pa0.toUpperCase();
        if (pa0 != "O") {
          switch (r[0]) {
            case "Z":
              x = +mx;
              y = +my;
              break;
            case "H":
              x = r[1];
              break;
            case "V":
              y = r[1];
              break;
            case "M":
              mx = r[r.length - 2];
              my = r[r.length - 1];
            default:
              x = r[r.length - 2];
              y = r[r.length - 1];
          }
        }
      }
      res.toString = toString;
      pth.abs = pathClone(res);
      return res;
    };
    const l2c = (x1, y1, x2, y2) => [x1, y1, x2, y2, x2, y2];
    const q2c = (x1, y1, ax, ay, x2, y2) => {
      const _13 = 1 / 3;
      const _23 = 2 / 3;
      return [
        _13 * x1 + _23 * ax,
        _13 * y1 + _23 * ay,
        _13 * x2 + _23 * ax,
        _13 * y2 + _23 * ay,
        x2,
        y2,
      ];
    };
    const a2c = (
      sx,
      sy,
      radiusx,
      radiusy,
      angle,
      large_arc_flag,
      sweep_flag,
      ex,
      ey,
      recursive,
    ) => {
      // for more information of where this math came from visit:
      // http://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
      let x1 = sx;
      let x2 = ex;
      let y1 = sy;
      let y2 = ey;
      let rx = radiusx;
      let ry = radiusy;
      const _120 = (PI * 120) / 180;
      const rad = (PI / 180) * (+angle || 0);
      let res = [];
      let xy;
      // f1/f2/cx/cy are assigned in both the !recursive and recursive branches and
      // read again below, so they must be function-scoped (not block-scoped).
      let f1;
      let f2;
      let cx;
      let cy;
      const rotate = Snap._.cacher((x, y, rad) => {
        const X = x * math.cos(rad) - y * math.sin(rad);
        const Y = x * math.sin(rad) + y * math.cos(rad);
        return { x: X, y: Y };
      });
      if (!rx || !ry) {
        const x3 = (x2 - x1) / 3;
        const y3 = (y2 - y1) / 3;
        return [x1 + x3, y1 + y3, x2 - x3, y2 - y3, x2, y2];
      }
      if (!recursive) {
        xy = rotate(x1, y1, -rad);
        x1 = xy.x;
        y1 = xy.y;
        xy = rotate(x2, y2, -rad);
        x2 = xy.x;
        y2 = xy.y;
        const x = (x1 - x2) / 2;
        const y = (y1 - y2) / 2;
        let h = (x * x) / (rx * rx) + (y * y) / (ry * ry);
        if (h > 1) {
          h = math.sqrt(h);
          rx = h * rx;
          ry = h * ry;
        }
        const rx2 = rx * rx;
        const ry2 = ry * ry;
        const k =
          (large_arc_flag == sweep_flag ? -1 : 1) *
          math.sqrt(
            abs(
              (rx2 * ry2 - rx2 * y * y - ry2 * x * x) /
                (rx2 * y * y + ry2 * x * x),
            ),
          );
        cx = (k * rx * y) / ry + (x1 + x2) / 2;
        cy = (k * -ry * x) / rx + (y1 + y2) / 2;
        f1 = math.asin(((y1 - cy) / ry).toFixed(9));
        f2 = math.asin(((y2 - cy) / ry).toFixed(9));

        f1 = x1 < cx ? PI - f1 : f1;
        f2 = x2 < cx ? PI - f2 : f2;
        if (f1 < 0) {
          f1 = PI * 2 + f1;
        }
        if (f2 < 0) {
          f2 = PI * 2 + f2;
        }
        if (sweep_flag && f1 > f2) {
          f1 = f1 - PI * 2;
        }
        if (!sweep_flag && f2 > f1) {
          f2 = f2 - PI * 2;
        }
      } else {
        f1 = recursive[0];
        f2 = recursive[1];
        cx = recursive[2];
        cy = recursive[3];
      }
      let df = f2 - f1;
      if (abs(df) > _120) {
        const f2old = f2;
        const x2old = x2;
        const y2old = y2;
        f2 = f1 + _120 * (sweep_flag && f2 > f1 ? 1 : -1);
        x2 = cx + rx * math.cos(f2);
        y2 = cy + ry * math.sin(f2);
        res = a2c(x2, y2, rx, ry, angle, 0, sweep_flag, x2old, y2old, [
          f2,
          f2old,
          cx,
          cy,
        ]);
      }
      df = f2 - f1;
      const c1 = math.cos(f1);
      const s1 = math.sin(f1);
      const c2 = math.cos(f2);
      const s2 = math.sin(f2);
      const t = math.tan(df / 4);
      const hx = (4 / 3) * rx * t;
      const hy = (4 / 3) * ry * t;
      const m1 = [x1, y1];
      const m2 = [x1 + hx * s1, y1 - hy * c1];
      const m3 = [x2 + hx * s2, y2 - hy * c2];
      const m4 = [x2, y2];
      m2[0] = 2 * m1[0] - m2[0];
      m2[1] = 2 * m1[1] - m2[1];
      if (recursive) {
        return [m2, m3, m4].concat(res);
      }
      res = [m2, m3, m4].concat(res).join().split(",");
      const newres = [];
      for (let i = 0, ii = res.length; i < ii; i++) {
        newres[i] =
          i % 2
            ? rotate(res[i - 1], res[i], rad).y
            : rotate(res[i], res[i + 1], rad).x;
      }
      return newres;
    };
    Snap.findDotAtSegment = function findDotAtSegment(
      p1x,
      p1y,
      c1x,
      c1y,
      c2x,
      c2y,
      p2x,
      p2y,
      t,
    ) {
      const t1 = 1 - t;
      return {
        x:
          t1 * t1 * t1 * p1x +
          t1 * t1 * 3 * t * c1x +
          t1 * 3 * t * t * c2x +
          t * t * t * p2x,
        y:
          t1 * t1 * t1 * p1y +
          t1 * t1 * 3 * t * c1y +
          t1 * 3 * t * t * c2y +
          t * t * t * p2y,
      };
    };

    // Returns bounding box of cubic bezier curve.
    // Source: http://blog.hackers-cafe.net/2009/06/how-to-calculate-bezier-curves-bounding.html
    // Original version: NISHIO Hirokazu
    // Modifications: https://github.com/timo22345
    const curveDim = (x0, y0, x1, y1, x2, y2, x3, y3) => {
      const tvalues = [];
      const bounds = [[], []];
      let a;
      let b;
      let c;
      let t;
      let t1;
      let t2;
      let b2ac;
      let sqrtb2ac;
      for (let i = 0; i < 2; ++i) {
        if (i == 0) {
          b = 6 * x0 - 12 * x1 + 6 * x2;
          a = -3 * x0 + 9 * x1 - 9 * x2 + 3 * x3;
          c = 3 * x1 - 3 * x0;
        } else {
          b = 6 * y0 - 12 * y1 + 6 * y2;
          a = -3 * y0 + 9 * y1 - 9 * y2 + 3 * y3;
          c = 3 * y1 - 3 * y0;
        }
        if (abs(a) < 1e-12) {
          if (abs(b) < 1e-12) {
            continue;
          }
          t = -c / b;
          if (0 < t && t < 1) {
            tvalues.push(t);
          }
          continue;
        }
        b2ac = b * b - 4 * c * a;
        sqrtb2ac = math.sqrt(b2ac);
        if (b2ac < 0) {
          continue;
        }
        t1 = (-b + sqrtb2ac) / (2 * a);
        if (0 < t1 && t1 < 1) {
          tvalues.push(t1);
        }
        t2 = (-b - sqrtb2ac) / (2 * a);
        if (0 < t2 && t2 < 1) {
          tvalues.push(t2);
        }
      }

      let j = tvalues.length;
      const jlen = j;
      let mt;
      while (j--) {
        t = tvalues[j];
        mt = 1 - t;
        bounds[0][j] =
          mt * mt * mt * x0 +
          3 * mt * mt * t * x1 +
          3 * mt * t * t * x2 +
          t * t * t * x3;
        bounds[1][j] =
          mt * mt * mt * y0 +
          3 * mt * mt * t * y1 +
          3 * mt * t * t * y2 +
          t * t * t * y3;
      }

      bounds[0][jlen] = x0;
      bounds[1][jlen] = y0;
      bounds[0][jlen + 1] = x3;
      bounds[1][jlen + 1] = y3;
      bounds[0].length = bounds[1].length = jlen + 2;

      return {
        min: {
          x: mmin.apply(0, bounds[0]),
          y: mmin.apply(0, bounds[1]),
        },
        max: {
          x: mmax.apply(0, bounds[0]),
          y: mmax.apply(0, bounds[1]),
        },
      };
    };

    const path2curve = (path, path2) => {
      const pth = !path2 && paths(path);
      if (!path2 && pth.curve) {
        return pathClone(pth.curve);
      }
      const p = pathToAbsolute(path);
      const p2 = path2 && pathToAbsolute(path2);
      const attrs = { x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null };
      const attrs2 = { x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null };
      // i/ii are function-scoped because fixArc/fixM mutate `ii` (the main loop's
      // upper bound) to grow the loop when an A command expands into multiple C:s.
      let i;
      let ii;
      const processPath = (pathstr, d, pcom) => {
        let path = pathstr;
        let nx;
        let ny;
        if (!path) {
          return ["C", d.x, d.y, d.x, d.y, d.x, d.y];
        }
        if (!(path[0] in { T: 1, Q: 1 })) {
          d.qx = null;
          d.qy = null;
        }
        switch (path[0]) {
          case "M":
            d.X = path[1];
            d.Y = path[2];
            break;
          case "A":
            path = ["C"].concat(a2c.apply(0, [d.x, d.y].concat(path.slice(1))));
            break;
          case "S":
            if (pcom == "C" || pcom == "S") {
              // In "S" case we have to take into account, if the previous command is C/S.
              nx = d.x * 2 - d.bx; // And reflect the previous
              ny = d.y * 2 - d.by; // command's control point relative to the current point.
            } else {
              // or some else or nothing
              nx = d.x;
              ny = d.y;
            }
            path = ["C", nx, ny].concat(path.slice(1));
            break;
          case "T":
            if (pcom == "Q" || pcom == "T") {
              // In "T" case we have to take into account, if the previous command is Q/T.
              d.qx = d.x * 2 - d.qx; // And make a reflection similar
              d.qy = d.y * 2 - d.qy; // to case "S".
            } else {
              // or something else or nothing
              d.qx = d.x;
              d.qy = d.y;
            }
            path = ["C"].concat(q2c(d.x, d.y, d.qx, d.qy, path[1], path[2]));
            break;
          case "Q":
            d.qx = path[1];
            d.qy = path[2];
            path = ["C"].concat(
              q2c(d.x, d.y, path[1], path[2], path[3], path[4]),
            );
            break;
          case "L":
            path = ["C"].concat(l2c(d.x, d.y, path[1], path[2]));
            break;
          case "H":
            path = ["C"].concat(l2c(d.x, d.y, path[1], d.y));
            break;
          case "V":
            path = ["C"].concat(l2c(d.x, d.y, d.x, path[1]));
            break;
          case "Z":
            path = ["C"].concat(l2c(d.x, d.y, d.X, d.Y));
            break;
        }
        return path;
      };
      const fixArc = (pp, j) => {
        let i = j;
        if (pp[i].length > 7) {
          pp[i].shift();
          const pi = pp[i];
          while (pi.length) {
            pcoms1[i] = "A"; // if created multiple C:s, their original seg is saved
            if (p2) {
              pcoms2[i] = "A";
            } // the same as above
            pp.splice(i++, 0, ["C"].concat(pi.splice(0, 6)));
          }
          pp.splice(i, 1);
          ii = mmax(p.length, p2?.length || 0);
        }
      };
      const fixM = (path1, path2, a1, a2, i) => {
        if (path1 && path2 && path1[i][0] == "M" && path2[i][0] != "M") {
          path2.splice(i, 0, ["M", a2.x, a2.y]);
          a1.bx = 0;
          a1.by = 0;
          a1.x = path1[i][1];
          a1.y = path1[i][2];
          ii = mmax(p.length, p2?.length || 0);
        }
      };
      const pcoms1 = []; // path commands of original path p
      const pcoms2 = []; // path commands of original path p2
      let pfirst = ""; // temporary holder for original path command
      let pcom = ""; // holder for previous path command of original path
      for (i = 0, ii = mmax(p.length, p2?.length || 0); i < ii; i++) {
        if (p[i]) {
          pfirst = p[i][0];
        } // save current path command

        if (pfirst != "C") {
          // C is not saved yet, because it may be result of conversion
          pcoms1[i] = pfirst; // Save current path command
          if (i) {
            pcom = pcoms1[i - 1];
          } // Get previous path command pcom
        }
        p[i] = processPath(p[i], attrs, pcom); // Previous path command is inputted to processPath

        if (pcoms1[i] != "A" && pfirst == "C") pcoms1[i] = "C"; // A is the only command
        // which may produce multiple C:s
        // so we have to make sure that C is also C in original path

        fixArc(p, i); // fixArc adds also the right amount of A:s to pcoms1

        if (p2) {
          // the same procedures is done to p2
          if (p2[i]) {
            pfirst = p2[i][0];
          }
          if (pfirst != "C") {
            pcoms2[i] = pfirst;
            if (i) {
              pcom = pcoms2[i - 1];
            }
          }
          p2[i] = processPath(p2[i], attrs2, pcom);

          if (pcoms2[i] != "A" && pfirst == "C") {
            pcoms2[i] = "C";
          }

          fixArc(p2, i);
        }
        fixM(p, p2, attrs, attrs2, i);
        fixM(p2, p, attrs2, attrs, i);
        const seg = p[i];
        const seg2 = p2?.[i];
        const seglen = seg.length;
        const seg2len = p2 && seg2.length;
        attrs.x = seg[seglen - 2];
        attrs.y = seg[seglen - 1];
        attrs.bx = toFloat(seg[seglen - 4]) || attrs.x;
        attrs.by = toFloat(seg[seglen - 3]) || attrs.y;
        attrs2.bx = p2 && (toFloat(seg2[seg2len - 4]) || attrs2.x);
        attrs2.by = p2 && (toFloat(seg2[seg2len - 3]) || attrs2.y);
        attrs2.x = p2 && seg2[seg2len - 2];
        attrs2.y = p2 && seg2[seg2len - 1];
      }
      if (!p2) {
        pth.curve = pathClone(p);
      }
      return p2 ? [p, p2] : p;
    };
    const mapPath = (pathstr, matrix) => {
      let path = pathstr;
      if (!matrix) {
        return path;
      }
      let x;
      let y;
      let i;
      let j;
      let ii;
      let jj;
      let pathi;
      path = path2curve(path);
      for (i = 0, ii = path.length; i < ii; i++) {
        pathi = path[i];
        for (j = 1, jj = pathi.length; j < jj; j += 2) {
          x = matrix.x(pathi[j], pathi[j + 1]);
          y = matrix.y(pathi[j], pathi[j + 1]);
          pathi[j] = x;
          pathi[j + 1] = y;
        }
      }
      return path;
    };

    // http://schepers.cc/getting-to-the-point
    const catmullRom2bezier = (crp, z) => {
      const d = [];
      for (let i = 0, iLen = crp.length; iLen - 2 * !z > i; i += 2) {
        const p = [
          { x: +crp[i - 2], y: +crp[i - 1] },
          { x: +crp[i], y: +crp[i + 1] },
          { x: +crp[i + 2], y: +crp[i + 3] },
          { x: +crp[i + 4], y: +crp[i + 5] },
        ];
        if (z) {
          if (!i) {
            p[0] = { x: +crp[iLen - 2], y: +crp[iLen - 1] };
          } else if (iLen - 4 == i) {
            p[3] = { x: +crp[0], y: +crp[1] };
          } else if (iLen - 2 == i) {
            p[2] = { x: +crp[0], y: +crp[1] };
            p[3] = { x: +crp[2], y: +crp[3] };
          }
        } else {
          if (iLen - 4 == i) {
            p[3] = p[2];
          } else if (!i) {
            p[0] = { x: +crp[i], y: +crp[i + 1] };
          }
        }
        d.push([
          "C",
          (-p[0].x + 6 * p[1].x + p[2].x) / 6,
          (-p[0].y + 6 * p[1].y + p[2].y) / 6,
          (p[1].x + 6 * p[2].x - p[3].x) / 6,
          (p[1].y + 6 * p[2].y - p[3].y) / 6,
          p[2].x,
          p[2].y,
        ]);
      }

      return d;
    };

    // export
    Snap.path = paths;

    /*\
       * Snap.path.getTotalLength
       [ method ]
       **
       * Returns the length of the given path in pixels
       **
       - path (string) SVG path string
       **
       = (number) length
      \*/
    Snap.path.getTotalLength = getTotalLength;
    /*\
       * Snap.path.getPointAtLength
       [ method ]
       **
       * Returns the coordinates of the point located at the given length along the given path
       **
       - path (string) SVG path string
       - length (number) length, in pixels, from the start of the path, excluding non-rendering jumps
       **
       = (object) representation of the point:
       o {
       o     x: (number) x coordinate,
       o     y: (number) y coordinate,
       o     alpha: (number) angle of derivative
       o }
      \*/
    Snap.path.getPointAtLength = getPointAtLength;
    /*\
       * Snap.path.getSubpath
       [ method ]
       **
       * Returns the subpath of a given path between given start and end lengths
       **
       - path (string) SVG path string
       - from (number) length, in pixels, from the start of the path to the start of the segment
       - to (number) length, in pixels, from the start of the path to the end of the segment
       **
       = (string) path string definition for the segment
      \*/
    Snap.path.getSubpath = function (path, from, to) {
      if (this.getTotalLength(path) - to < 1e-6) {
        return getSubpathsAtLength(path, from).end;
      }
      const a = getSubpathsAtLength(path, to, 1);
      return from ? getSubpathsAtLength(a, from).end : a;
    };
    /*\
       * Element.getTotalLength
       [ method ]
       **
       * Returns the length of the path in pixels (only works for `path` elements)
       = (number) length
      \*/
    elproto.getTotalLength = function () {
      if (this.node.getTotalLength) {
        return this.node.getTotalLength();
      }
    };
    /*\
       * Element.getPointAtLength
       [ method ]
       **
       * Returns coordinates of the point located at the given length on the given path (only works for `path` elements)
       **
       - length (number) length, in pixels, from the start of the path, excluding non-rendering jumps
       **
       = (object) representation of the point:
       o {
       o     x: (number) x coordinate,
       o     y: (number) y coordinate,
       o     alpha: (number) angle of derivative
       o }
      \*/
    elproto.getPointAtLength = function (length) {
      return getPointAtLength(this.attr("d"), length);
    };
    /*\
       * Element.getSubpath
       [ method ]
       **
       * Returns subpath of a given element from given start and end lengths (only works for `path` elements)
       **
       - from (number) length, in pixels, from the start of the path to the start of the segment
       - to (number) length, in pixels, from the start of the path to the end of the segment
       **
       = (string) path string definition for the segment
      \*/
    elproto.getSubpath = function (from, to) {
      return Snap.path.getSubpath(this.attr("d"), from, to);
    };
    Snap._.box = box;
    /*\
       * Snap.path.findDotsAtSegment
       [ method ]
       **
       * Utility method
       **
       * Finds dot coordinates on the given cubic beziér curve at the given t
       - p1x (number) x of the first point of the curve
       - p1y (number) y of the first point of the curve
       - c1x (number) x of the first anchor of the curve
       - c1y (number) y of the first anchor of the curve
       - c2x (number) x of the second anchor of the curve
       - c2y (number) y of the second anchor of the curve
       - p2x (number) x of the second point of the curve
       - p2y (number) y of the second point of the curve
       - t (number) position on the curve (0..1)
       = (object) point information in format:
       o {
       o     x: (number) x coordinate of the point,
       o     y: (number) y coordinate of the point,
       o     m: {
       o         x: (number) x coordinate of the left anchor,
       o         y: (number) y coordinate of the left anchor
       o     },
       o     n: {
       o         x: (number) x coordinate of the right anchor,
       o         y: (number) y coordinate of the right anchor
       o     },
       o     start: {
       o         x: (number) x coordinate of the start of the curve,
       o         y: (number) y coordinate of the start of the curve
       o     },
       o     end: {
       o         x: (number) x coordinate of the end of the curve,
       o         y: (number) y coordinate of the end of the curve
       o     },
       o     alpha: (number) angle of the curve derivative at the point
       o }
      \*/
    Snap.path.findDotsAtSegment = findDotsAtSegment;
    /*\
       * Snap.path.bezierBBox
       [ method ]
       **
       * Utility method
       **
       * Returns the bounding box of a given cubic beziér curve
       - p1x (number) x of the first point of the curve
       - p1y (number) y of the first point of the curve
       - c1x (number) x of the first anchor of the curve
       - c1y (number) y of the first anchor of the curve
       - c2x (number) x of the second anchor of the curve
       - c2y (number) y of the second anchor of the curve
       - p2x (number) x of the second point of the curve
       - p2y (number) y of the second point of the curve
       * or
       - bez (array) array of six points for beziér curve
       = (object) bounding box
       o {
       o     x: (number) x coordinate of the left top point of the box,
       o     y: (number) y coordinate of the left top point of the box,
       o     x2: (number) x coordinate of the right bottom point of the box,
       o     y2: (number) y coordinate of the right bottom point of the box,
       o     width: (number) width of the box,
       o     height: (number) height of the box
       o }
      \*/
    Snap.path.bezierBBox = bezierBBox;
    /*\
       * Snap.path.isPointInsideBBox
       [ method ]
       **
       * Utility method
       **
       * Returns `true` if given point is inside bounding box
       - bbox (string) bounding box
       - x (string) x coordinate of the point
       - y (string) y coordinate of the point
       = (boolean) `true` if point is inside
      \*/
    Snap.path.isPointInsideBBox = isPointInsideBBox;
    Snap.closest = (x, y, X, Y) => {
      let r = 100;
      let b = box(x - r / 2, y - r / 2, r, r);
      const inside = [];
      const getter =
        "x" in X[0]
          ? (i) => ({
              x: X[i].x,
              y: X[i].y,
            })
          : (i) => ({
              x: X[i],
              y: Y[i],
            });
      let found = 0;
      while (r <= 1e6 && !found) {
        for (let i = 0, ii = X.length; i < ii; i++) {
          const xy = getter(i);
          if (isPointInsideBBox(b, xy.x, xy.y)) {
            found++;
            inside.push(xy);
            break;
          }
        }
        if (!found) {
          r *= 2;
          b = box(x - r / 2, y - r / 2, r, r);
        }
      }
      if (r == 1e6) {
        return;
      }
      let len = Number.POSITIVE_INFINITY;
      let res;
      for (let i = 0, ii = inside.length; i < ii; i++) {
        const l = Snap.len(x, y, inside[i].x, inside[i].y);
        if (len > l) {
          len = l;
          inside[i].len = l;
          res = inside[i];
        }
      }
      return res;
    };
    /*\
       * Snap.path.isBBoxIntersect
       [ method ]
       **
       * Utility method
       **
       * Returns `true` if two bounding boxes intersect
       - bbox1 (string) first bounding box
       - bbox2 (string) second bounding box
       = (boolean) `true` if bounding boxes intersect
      \*/
    Snap.path.isBBoxIntersect = isBBoxIntersect;
    /*\
       * Snap.path.intersection
       [ method ]
       **
       * Utility method
       **
       * Finds intersections of two paths
       - path1 (string) path string
       - path2 (string) path string
       = (array) dots of intersection
       o [
       o     {
       o         x: (number) x coordinate of the point,
       o         y: (number) y coordinate of the point,
       o         t1: (number) t value for segment of path1,
       o         t2: (number) t value for segment of path2,
       o         segment1: (number) order number for segment of path1,
       o         segment2: (number) order number for segment of path2,
       o         bez1: (array) eight coordinates representing beziér curve for the segment of path1,
       o         bez2: (array) eight coordinates representing beziér curve for the segment of path2
       o     }
       o ]
      \*/
    Snap.path.intersection = pathIntersection;
    Snap.path.intersectionNumber = pathIntersectionNumber;
    /*\
       * Snap.path.isPointInside
       [ method ]
       **
       * Utility method
       **
       * Returns `true` if given point is inside a given closed path.
       *
       * Note: fill mode doesn’t affect the result of this method.
       - path (string) path string
       - x (number) x of the point
       - y (number) y of the point
       = (boolean) `true` if point is inside the path
      \*/
    Snap.path.isPointInside = isPointInsidePath;
    /*\
       * Snap.path.getBBox
       [ method ]
       **
       * Utility method
       **
       * Returns the bounding box of a given path
       - path (string) path string
       = (object) bounding box
       o {
       o     x: (number) x coordinate of the left top point of the box,
       o     y: (number) y coordinate of the left top point of the box,
       o     x2: (number) x coordinate of the right bottom point of the box,
       o     y2: (number) y coordinate of the right bottom point of the box,
       o     width: (number) width of the box,
       o     height: (number) height of the box
       o }
      \*/
    Snap.path.getBBox = pathBBox;
    Snap.path.get = getPath;
    /*\
       * Snap.path.toRelative
       [ method ]
       **
       * Utility method
       **
       * Converts path coordinates into relative values
       - path (string) path string
       = (array) path string
      \*/
    Snap.path.toRelative = pathToRelative;
    /*\
       * Snap.path.toAbsolute
       [ method ]
       **
       * Utility method
       **
       * Converts path coordinates into absolute values
       - path (string) path string
       = (array) path string
      \*/
    Snap.path.toAbsolute = pathToAbsolute;
    /*\
       * Snap.path.toCubic
       [ method ]
       **
       * Utility method
       **
       * Converts path to a new path where all segments are cubic beziér curves
       - pathString (string|array) path string or array of segments
       = (array) array of segments
      \*/
    Snap.path.toCubic = path2curve;
    /*\
       * Snap.path.map
       [ method ]
       **
       * Transform the path string with the given matrix
       - path (string) path string
       - matrix (object) see @Matrix
       = (string) transformed path string
      \*/
    Snap.path.map = mapPath;
    Snap.path.toString = toString;
    Snap.path.clone = pathClone;
  });

  // Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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

  Snap.plugin((Snap) => {
    const math = Math;
    const PI = math.PI;

    // ---- internal cubic-beziér helpers -------------------------------------
    // Coordinate order matches Snap.path.findDotsAtSegment:
    // (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y) i.e. start, anchor1, anchor2, end.

    // Evaluates a cubic beziér at parameter t.
    const bezpoint = (x1, y1, x2, y2, x3, y3, x4, y4, t) => {
      const t1 = 1 - t;
      const a = t1 * t1 * t1;
      const b = 3 * t1 * t1 * t;
      const c = 3 * t1 * t * t;
      const d = t * t * t;
      return {
        x: a * x1 + b * x2 + c * x3 + d * x4,
        y: a * y1 + b * y2 + c * y3 + d * y4,
      };
    };

    // Removes out-of-range roots and merges duplicates within `eps`.
    const cleanRoots = (roots, eps) => {
      const res = [];
      for (const t of roots) {
        if (t >= 0 && t <= 1) {
          res.push(t);
        }
      }
      for (let i = 0; i < res.length; i++) {
        for (let j = i + 1; j < res.length; j++) {
          if (math.abs(res[i] - res[j]) < eps) {
            res[i] = (res[i] + res[j]) / 2;
            res.splice(j, 1);
            j--;
          }
        }
      }
      return res;
    };

    // Newton-Raphson root finder shared by the line / circle intersection
    // solvers. `s3` is the polynomial, `s4` its derivative.
    const newtonRoots = (s3, s4) => {
      const seq = [0, 0.25, 0.5, 0.75, 1];
      const res = [];
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < seq.length; j++) {
          const p = seq[j];
          seq[j] -= s3(p) / s4(p);
          if (math.abs(p - seq[j]) < 0.001) {
            res.push(seq[j]);
            seq.splice(j, 1);
            j--;
          }
        }
      }
      return cleanRoots(res, 0.001);
    };

    /*\
       * Snap.path.bezierTangent
       [ method ]
       **
       * Utility method
       **
       * Finds the tangent angle of a cubic beziér curve at the given t
       - p1x (number) x of the first point of the curve
       - p1y (number) y of the first point of the curve
       - c1x (number) x of the first anchor of the curve
       - c1y (number) y of the first anchor of the curve
       - c2x (number) x of the second anchor of the curve
       - c2y (number) y of the second anchor of the curve
       - p2x (number) x of the second point of the curve
       - p2y (number) y of the second point of the curve
       - t (number) position on the curve (0..1)
       = (number) tangent angle in degrees (-180..180)
      \*/
    const bezierTangent = (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) => {
      const num =
        3 * t * t * (3 * c1y + p2y - 3 * c2y - p1y) +
        6 * t * (p1y - 2 * c1y + c2y) +
        3 * (c1y - p1y);
      const den =
        3 * t * t * (3 * c1x + p2x - 3 * c2x - p1x) +
        6 * t * (p1x - 2 * c1x + c2x) +
        3 * (c1x - p1x);
      return (math.atan2(num, den) * 180) / PI;
    };

    /*\
       * Snap.path.bezierCurvature
       [ method ]
       **
       * Utility method
       **
       * Finds the curvature and radius of curvature of a cubic beziér at the given t
       - p1x (number) x of the first point of the curve
       - p1y (number) y of the first point of the curve
       - c1x (number) x of the first anchor of the curve
       - c1y (number) y of the first anchor of the curve
       - c2x (number) x of the second anchor of the curve
       - c2y (number) y of the second anchor of the curve
       - p2x (number) x of the second point of the curve
       - p2y (number) y of the second point of the curve
       - t (number) position on the curve (0..1)
       = (object) `{ k: signed curvature, r: radius of curvature }` (both 0 on straight segments / cusps)
      \*/
    const bezierCurvature = (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) => {
      const a1 = 3 * (3 * c1x - p1x - 3 * c2x + p2x);
      const a2 = 3 * (3 * c1y - p1y - 3 * c2y + p2y);
      const b1 = 6 * (p1x - 2 * c1x + c2x);
      const b2 = 6 * (p1y - 2 * c1y + c2y);
      const g1 = 3 * (c1x - p1x);
      const g2 = 3 * (c1y - p1y);
      const dx = (a1 * t + b1) * t + g1;
      const dy = (a2 * t + b2) * t + g2;
      const ddx = 2 * a1 * t + b1;
      const ddy = 2 * a2 * t + b2;
      const num = dx * ddy - dy * ddx;
      const den = (dx * dx + dy * dy) ** 1.5;
      if (num == 0 || den == 0) {
        return { k: 0, r: 0 };
      }
      return { k: num / den, r: den / num };
    };

    /*\
       * Snap.path.bezierClosest
       [ method ]
       **
       * Utility method
       **
       * Finds the closest point on a cubic beziér curve to the given coordinate.
       * Solves the quintic (B(t) - P)·B'(t) = 0 exactly via bracketed Newton-Raphson.
       - p1x (number) x of the first point of the curve
       - p1y (number) y of the first point of the curve
       - c1x (number) x of the first anchor of the curve
       - c1y (number) y of the first anchor of the curve
       - c2x (number) x of the second anchor of the curve
       - c2y (number) y of the second anchor of the curve
       - p2x (number) x of the second point of the curve
       - p2y (number) y of the second point of the curve
       - x (number) x of the query point
       - y (number) y of the query point
       = (object) `{ x, y, t, d }` closest point, its curve parameter and distance
      \*/
    const bezierClosest = (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, x, y) => {
      const a1 = 3 * (3 * c1x - p1x - 3 * c2x + p2x);
      const a2 = 3 * (3 * c1y - p1y - 3 * c2y + p2y);
      const b1 = 6 * (p1x - 2 * c1x + c2x);
      const b2 = 6 * (p1y - 2 * c1y + c2y);
      const g1 = 3 * (c1x - p1x);
      const g2 = 3 * (c1y - p1y);
      const d1 = p1x;
      const d2 = p1y;
      // s3(v) = (B(v) - P)·B'(v) expanded to a quintic; s4 = s3'.
      const z1 = (a1 * a1 + a2 * a2) / 3;
      const z2 = (5 / 6) * (a1 * b1 + a2 * b2);
      const z3 = (4 / 3) * (a1 * g1 + a2 * g2) + (b1 * b1 + b2 * b2) / 2;
      const z4 =
        a1 * d1 + a2 * d2 + (3 / 2) * (b1 * g1 + b2 * g2) - a1 * x - a2 * y;
      const z5 = g1 * g1 + g2 * g2 + b1 * d1 + b2 * d2 - b1 * x - b2 * y;
      const z6 = g1 * d1 + g2 * d2 - g1 * x - g2 * y;
      const s3 = (v) => ((((z1 * v + z2) * v + z3) * v + z4) * v + z5) * v + z6;
      const s4 = (v) =>
        (((5 * z1 * v + 4 * z2) * v + 3 * z3) * v + 2 * z4) * v + z5;
      const X = (t) => (((a1 / 3) * t + b1 / 2) * t + g1) * t + d1;
      const Y = (t) => (((a2 / 3) * t + b2 / 2) * t + g2) * t + d2;

      // Phase 1: bracket every real root of s3 on [0, 1] via a 20-sample scan.
      const N = 20;
      const roots = [0, 1];
      let prevT = 0;
      let prev = s3(0);
      for (let i = 1; i <= N; i++) {
        const t = i / N;
        const cur = s3(t);
        if (math.sign(cur) != math.sign(prev)) {
          // Phase 2: safeguarded Newton on [lo, hi] with fLo*fHi <= 0.
          let lo = prevT;
          let hi = t;
          let fLo = prev;
          let tt;
          if (fLo == 0) {
            tt = lo;
          } else if (cur == 0) {
            tt = hi;
          } else {
            tt = (lo + hi) / 2;
            for (let k = 0; k < 30; k++) {
              const f = s3(tt);
              if (f == 0) {
                break;
              }
              if (math.sign(f) == math.sign(fLo)) {
                lo = tt;
                fLo = f;
              } else {
                hi = tt;
              }
              const df = s4(tt);
              const ttNewton = df == 0 ? tt : tt - f / df;
              const ttNew =
                ttNewton >= lo && ttNewton <= hi ? ttNewton : (lo + hi) / 2;
              if (math.abs(ttNew - tt) < 1e-10) {
                tt = ttNew;
                break;
              }
              tt = ttNew;
            }
          }
          roots.push(tt);
        }
        prev = cur;
        prevT = t;
      }

      // Phase 3: pick the candidate with the minimum squared distance.
      const result = { x: 0, y: 0, t: -1, d: Infinity };
      for (const t of roots) {
        if (t < 0 || t > 1) {
          continue;
        }
        const dx = X(t) - x;
        const dy = Y(t) - y;
        const d = dx * dx + dy * dy;
        if (d < result.d) {
          result.d = d;
          result.t = t;
          result.x = dx + x;
          result.y = dy + y;
        }
      }
      result.d = math.sqrt(result.d);
      return result;
    };

    /*\
       * Snap.path.bezierLineIntersection
       [ method ]
       **
       * Utility method
       **
       * Finds the parameter values t where a cubic beziér meets the line `y = a * x + b`
       - p1x (number) x of the first point of the curve
       - p1y (number) y of the first point of the curve
       - c1x (number) x of the first anchor of the curve
       - c1y (number) y of the first anchor of the curve
       - c2x (number) x of the second anchor of the curve
       - c2y (number) y of the second anchor of the curve
       - p2x (number) x of the second point of the curve
       - p2y (number) y of the second point of the curve
       - a (number) line slope
       - b (number) line y-intercept
       = (array) curve parameters (0..1) of the intersection points
      \*/
    const bezierLineIntersection = (
      p1x,
      p1y,
      c1x,
      c1y,
      c2x,
      c2y,
      p2x,
      p2y,
      a,
      b,
    ) => {
      const a1 = 3 * c1x - p1x - 3 * c2x + p2x;
      const a2 = 3 * c1y - p1y - 3 * c2y + p2y;
      const b1 = 3 * (p1x - 2 * c1x + c2x);
      const b2 = 3 * (p1y - 2 * c1y + c2y);
      const g1 = 3 * (c1x - p1x);
      const g2 = 3 * (c1y - p1y);
      const z1 = a * a1 - a2;
      const z2 = a * b1 - b2;
      const z3 = a * g1 - g2;
      const z4 = a * p1x - p1y + b;
      const s3 = (v) => ((z1 * v + z2) * v + z3) * v + z4;
      const s4 = (v) => (3 * z1 * v + 2 * z2) * v + z3;
      return newtonRoots(s3, s4);
    };

    /*\
       * Snap.path.bezierCircleIntersection
       [ method ]
       **
       * Utility method
       **
       * Finds the parameter values t where a cubic beziér meets a circle
       - p1x (number) x of the first point of the curve
       - p1y (number) y of the first point of the curve
       - c1x (number) x of the first anchor of the curve
       - c1y (number) y of the first anchor of the curve
       - c2x (number) x of the second anchor of the curve
       - c2y (number) y of the second anchor of the curve
       - p2x (number) x of the second point of the curve
       - p2y (number) y of the second point of the curve
       - cx (number) x of the circle center
       - cy (number) y of the circle center
       - r (number) circle radius
       = (array) curve parameters (0..1) of the intersection points
      \*/
    const bezierCircleIntersection = (
      p1x,
      p1y,
      c1x,
      c1y,
      c2x,
      c2y,
      p2x,
      p2y,
      cx,
      cy,
      r,
    ) => {
      const a1 = 3 * c1x - p1x - 3 * c2x + p2x;
      const a2 = 3 * c1y - p1y - 3 * c2y + p2y;
      const b1 = 3 * (p1x - 2 * c1x + c2x);
      const b2 = 3 * (p1y - 2 * c1y + c2y);
      const g1 = 3 * (c1x - p1x);
      const g2 = 3 * (c1y - p1y);
      const d1 = p1x;
      const d2 = p1y;
      const z1 = a1 * a1 + a2 * a2;
      const z2 = 2 * a1 * b1 + 2 * a2 * b2;
      const z3 = 2 * a1 * g1 + b1 * b1 + 2 * a2 * g2 + b2 * b2;
      const z4 = 2 * (a1 * d1 + a2 * d2 + b1 * g1 + b2 * g2 - a1 * cx - a2 * cy);
      const z5 =
        g1 * g1 + g2 * g2 + 2 * b1 * d1 + 2 * b2 * d2 - 2 * b1 * cx - 2 * b2 * cy;
      const z6 = 2 * (g1 * d1 + g2 * d2 - g1 * cx - g2 * cy);
      const z7 =
        d1 * d1 + d2 * d2 - 2 * d1 * cx - 2 * d2 * cy + cx * cx + cy * cy - r * r;
      const s3 = (v) =>
        (((((z1 * v + z2) * v + z3) * v + z4) * v + z5) * v + z6) * v + z7;
      const s4 = (v) =>
        ((((6 * z1 * v + 5 * z2) * v + 4 * z3) * v + 3 * z4) * v + 2 * z5) * v +
        z6;
      return newtonRoots(s3, s4);
    };

    /*\
       * Snap.path.bezierDistance
       [ method ]
       **
       * Utility method
       **
       * Finds the minimum distance between two cubic beziér curves.
       * Each curve is given as a flat array of 8 numbers
       * `[p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y]`.
       - curve1 (array) first curve as 8 coordinates
       - curve2 (array) second curve as 8 coordinates
       = (object) `{ p1, p2, t1, t2, d }` closest points, their curve parameters and the distance
      \*/
    const bezierDistance = (curve1, curve2) => {
      const [x1, y1, x2, y2, x3, y3, x4, y4] = curve1;
      const [x5, y5, x6, y6, x7, y7, x8, y8] = curve2;
      let d = Infinity;
      let p1;
      let p2;
      let t1;
      let t2;
      // Phase 1: coarse scan of curve 1, closest point on curve 2 at each sample.
      for (let t = 0; t <= 1; t += 0.1) {
        const p = bezpoint(x1, y1, x2, y2, x3, y3, x4, y4, t);
        const c = bezierClosest(x5, y5, x6, y6, x7, y7, x8, y8, p.x, p.y);
        if (c.d < d) {
          d = c.d;
          t1 = t;
          t2 = c.t;
          p1 = p;
          p2 = { x: c.x, y: c.y };
        }
      }
      // Phase 2: hill-climb refinement on t1 with shrinking step size.
      let prec = 0.05;
      while (prec > 0.001) {
        const pb = bezpoint(x1, y1, x2, y2, x3, y3, x4, y4, t1 + prec);
        const cb =
          t1 + prec > 1
            ? { d }
            : bezierClosest(x5, y5, x6, y6, x7, y7, x8, y8, pb.x, pb.y);
        if (cb.d < d) {
          d = cb.d;
          t1 += prec;
          t2 = cb.t;
          p1 = pb;
          p2 = { x: cb.x, y: cb.y };
        } else {
          const pa = bezpoint(x1, y1, x2, y2, x3, y3, x4, y4, t1 - prec);
          const ca =
            t1 - prec < 0
              ? { d }
              : bezierClosest(x5, y5, x6, y6, x7, y7, x8, y8, pa.x, pa.y);
          if (ca.d < d) {
            d = ca.d;
            t1 -= prec;
            t2 = ca.t;
            p1 = pa;
            p2 = { x: ca.x, y: ca.y };
          } else {
            prec /= 2;
          }
        }
      }
      return { p1, p2, t1, t2, d };
    };

    // Normalizes a point given as {x, y} or [x, y] to {x, y}.
    const toXY = (p) =>
      Snap.is(p, "array") ? { x: p[0], y: p[1] } : { x: p.x, y: p.y };

    /*\
       * Snap.path.smooth
       [ method ]
       **
       * Utility method
       **
       * Builds a smooth cubic beziér path that passes through the given points
       * using a cardinal spline.
       - points (array) array of points, each `{x, y}` or `[x, y]`
       - close (boolean) #optional whether to close the path (default `false`)
       - tension (number) #optional spline tension, higher is tighter (default `1`)
       = (string) path string
      \*/
    const smooth = (points, close = false, tension = 1) => {
      const pts = (points || []).map(toXY);
      const n = pts.length;
      if (!n) {
        return "";
      }
      if (n == 1) {
        return `M${pts[0].x},${pts[0].y}`;
      }
      const at = (i) => pts[((i % n) + n) % n];
      let path = `M${pts[0].x},${pts[0].y}`;
      const segments = close ? n : n - 1;
      for (let i = 0; i < segments; i++) {
        const p0 = close ? at(i - 1) : pts[math.max(i - 1, 0)];
        const p1 = at(i);
        const p2 = close ? at(i + 1) : pts[i + 1];
        const p3 = close ? at(i + 2) : pts[math.min(i + 2, n - 1)];
        const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
        const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;
        const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
        const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;
        path += `C${cp1x},${cp1y},${cp2x},${cp2y},${p2.x},${p2.y}`;
      }
      if (close) {
        path += "z";
      }
      return path;
    };

    // Perpendicular distance from point p to the line through s and e.
    const perpendicularDistance = (s, e, p) => {
      const x1 = e.x - s.x;
      const y1 = e.y - s.y;
      const x2 = p.x - s.x;
      const y2 = p.y - s.y;
      const k = (x1 * x2 + y1 * y2) / (x1 * x1 + y1 * y1);
      return math.hypot(x2 - k * x1, y2 - k * y1);
    };

    const rdp = (pts, eps) => {
      if (pts.length < 3) {
        return pts.slice();
      }
      const end = pts.length - 1;
      let dmax = 0;
      let index = 0;
      for (let i = 1; i < end; i++) {
        const d = perpendicularDistance(pts[0], pts[end], pts[i]);
        if (d > dmax) {
          index = i;
          dmax = d;
        }
      }
      if (dmax > eps) {
        const left = rdp(pts.slice(0, index + 1), eps);
        const right = rdp(pts.slice(index), eps);
        return left.slice(0, -1).concat(right);
      }
      return [pts[0], pts[end]];
    };

    /*\
       * Snap.path.simplify
       [ method ]
       **
       * Utility method
       **
       * Simplifies a polyline using the Ramer-Douglas-Peucker algorithm
       - points (array) array of points, each `{x, y}` or `[x, y]`
       - tolerance (number) #optional maximum allowed deviation (default `1`)
       = (array) simplified array of `{x, y}` points
      \*/
    const simplify = (points, tolerance = 1) => {
      const pts = (points || []).map(toXY);
      if (pts.length < 3) {
        return pts;
      }
      return rdp(pts, tolerance);
    };

    // ---- grid ---------------------------------------------------------------

    const getLens = (width, height, angle, padding, ox, oy) => {
      const sin = math.sin(((180 - angle) * PI) / 180);
      const cos = math.cos(((180 - angle) * PI) / 180);
      const turn = (x, y) => [
        cos * (x - ox) - sin * (y - oy) + ox,
        sin * (x - ox) + cos * (y - oy) + oy,
      ];
      const box = [
        turn(-padding, -padding),
        turn(-padding, height + padding * 2),
        turn(width + padding * 2, -padding),
        turn(width + padding * 2, height + padding * 2),
      ];
      const boxx = [];
      const boxy = [];
      for (const corner of box) {
        boxx.push(corner[0]);
        boxy.push(corner[1]);
      }
      const lenxf = math.max(...boxx) - ox;
      const lenxb = ox - math.min(...boxx);
      const lenyf = math.max(...boxy) - oy;
      const lenyb = oy - math.min(...boxy);
      return [lenxf, lenxb, lenyf, lenyb];
    };

    /*\
       * Snap.grid
       [ method ]
       **
       * Generates the points of a square or hexagonal grid covering the given
       * area, optionally rotated and padded. Points falling outside the area
       * (allowing for `padding`) are clipped out.
       - width (number) width of the area to cover
       - height (number) height of the area to cover
       - step (number) spacing between grid points
       - angle (number) #optional rotation of the grid in degrees (default `0`)
       - padding (number) #optional extra margin around the area (default `0`)
       - type (string) #optional `"square"` or `"hex"` (default `"square"`)
       - startx (number) #optional x of the grid origin (default `step / 2`)
       - starty (number) #optional y of the grid origin (default `step / 2`)
       = (array) array of rows, each an array of `[x, y]` points
      \*/
    const makeGrid = (
      width,
      height,
      step,
      angle = 0,
      padding = 0,
      type = "square",
      startx = step / 2,
      starty = step / 2,
    ) => {
      const ox = startx;
      const oy = starty;
      const dx = step;
      const dy = type == "square" ? step : (step * math.sqrt(3)) / 2;
      const lens = getLens(width, height, angle, padding, ox, oy);
      let x = ox;
      let y = oy;
      let X = 0;
      let Y = 0;
      let row = -1;
      const res = [[]];
      let rrow = res[0];
      const sin = math.sin((angle * PI) / 180);
      const cos = math.cos((angle * PI) / 180);
      const out = (px, py) =>
        px + padding < 0 ||
        py + padding < 0 ||
        px - padding > width ||
        py - padding > height;
      const turn = (tx, ty) => [
        cos * (tx - ox) - sin * (ty - oy) + ox,
        sin * (tx - ox) + cos * (ty - oy) + oy,
      ];
      const minus = [];
      let back = true;
      y -= dy;
      x = ox + (type == "square" ? 0 : (math.abs(row % 2) * dx) / 2);
      while (y > oy - lens[2]) {
        if (back) {
          x -= dx;
          if (x < ox - lens[0]) {
            back = false;
            rrow.push(...minus);
            minus.length = 0;
          }
        } else {
          x += dx;
          [X, Y] = turn(x, y);
          if (!out(X, Y)) {
            rrow.push([X, Y]);
          }
          if (x > ox + lens[1]) {
            row--;
            x = ox + (type == "square" ? 0 : (math.abs(row % 2) * dx) / 2);
            y -= dy;
            back = true;
            rrow = [];
            res.unshift(rrow);
          }
        }
      }
      minus.length = 0;
      back = true;
      row = 0;
      x = ox;
      y = oy;
      while (y < oy + lens[3]) {
        if (back) {
          x -= dx;
          if (x < ox - lens[0]) {
            back = false;
            rrow.push(...minus);
            minus.length = 0;
          }
        } else {
          x += dx;
          [X, Y] = turn(x, y);
          if (!out(X, Y)) {
            rrow.push([X, Y]);
          }
          if (x > ox + lens[1]) {
            row++;
            x = ox + (type == "square" ? 0 : ((row % 2) * dx) / 2);
            y += dy;
            back = true;
            rrow = [];
            res.push(rrow);
          }
        }
      }
      return res;
    };

    // ---- exports ------------------------------------------------------------
    Snap.path.bezierTangent = bezierTangent;
    Snap.path.bezierCurvature = bezierCurvature;
    Snap.path.bezierClosest = bezierClosest;
    Snap.path.bezierLineIntersection = bezierLineIntersection;
    Snap.path.bezierCircleIntersection = bezierCircleIntersection;
    Snap.path.bezierDistance = bezierDistance;
    Snap.path.smooth = smooth;
    Snap.path.simplify = simplify;
    Snap.grid = makeGrid;
  });

  // Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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


  Snap.plugin((Snap, _Element, _Paper, _glob) => {
    const mmax = Math.max;
    const mmin = Math.min;

    // Set
    class Set {
      constructor(items) {
        this.items = [];
        this.bindings = {};
        this.length = 0;
        this.type = "set";
        if (items) {
          for (let i = 0, ii = items.length; i < ii; i++) {
            if (items[i]) {
              this[this.items.length] = this.items[this.items.length] = items[i];
              this.length++;
            }
          }
        }
      }
      /*\
               * Set.push
               [ method ]
               **
               * Adds each argument to the current set
               = (object) original element
              \*/
      push(...list) {
        let item;
        let len;
        for (let i = 0, ii = list.length; i < ii; i++) {
          item = list[i];
          if (item) {
            len = this.items.length;
            this[len] = this.items[len] = item;
            this.length++;
          }
        }
        return this;
      }
      /*\
               * Set.pop
               [ method ]
               **
               * Removes last element and returns it
               = (object) element
              \*/
      pop() {
        this.length && delete this[this.length--];
        return this.items.pop();
      }
      /*\
               * Set.forEach
               [ method ]
               **
               * Executes given function for each element in the set
               *
               * If the function returns `false`, the loop stops running.
               **
               - callback (function) function to run
               - thisArg (object) context object for the callback
               = (object) Set object
              \*/
      forEach(callback, thisArg) {
        for (let i = 0, ii = this.items.length; i < ii; i++) {
          if (callback.call(thisArg, this.items[i], i) == false) {
            return this;
          }
        }
        return this;
      }
      /*\
               * Set.animate
               [ method ]
               **
               * Animates each element in set in sync.
               *
               **
               - attrs (object) key-value pairs of destination attributes
               - duration (number) duration of the animation in milliseconds
               - easing (function) #optional easing function from @mina or custom
               - callback (function) #optional callback function that executes when the animation ends
               * or
               - animation (array) array of animation parameter for each element in set in format `[attrs, duration, easing, callback]`
               > Usage
               | // animate all elements in set to radius 10
               | set.animate({r: 10}, 500, mina.easein);
               | // or
               | // animate first element to radius 10, but second to radius 20 and in different time
               | set.animate([{r: 10}, 500, mina.easein], [{r: 20}, 1500, mina.easein]);
               = (Element) the current element
              \*/
      animate(attr, time, ease, call) {
        let attrs = attr;
        let ms = time;
        let easing = ease;
        let callback = call;
        if (typeof easing == "function" && !easing.length) {
          callback = easing;
          easing = mina.linear;
        }
        if (attrs instanceof Snap._.Animation) {
          callback = attrs.callback;
          easing = attrs.easing;
          ms = easing.dur;
          attrs = attrs.attr;
        }
        const args = [attr, time, ease, call];
        let each;
        if (Snap.is(attrs, "array") && Snap.is(args[args.length - 1], "array")) {
          each = true;
        }
        let begin;
        const handler = function () {
          if (begin) {
            this.b = begin;
          } else {
            begin = this.b;
          }
        };
        let cb = 0;
        const set = this;
        const callbacker =
          callback &&
          function () {
            if (++cb == set.length) {
              callback.call(this);
            }
          };
        return this.forEach((el, i) => {
          eve.once(`snap.animcreated.${el.id}`, handler);
          if (each) {
            args[i] && el.animate.apply(el, args[i]);
          } else {
            el.animate(attrs, ms, easing, callbacker);
          }
        });
      }
      /*\
               * Set.remove
               [ method ]
               **
               * Removes all children of the set.
               *
               = (object) Set object
              \*/
      remove() {
        while (this.length) {
          this.pop().remove();
        }
        return this;
      }
      /*\
               * Set.bind
               [ method ]
               **
               * Specifies how to handle a specific attribute when applied
               * to a set.
               *
               **
               - attr (string) attribute name
               - callback (function) function to run
               * or
               - attr (string) attribute name
               - element (Element) specific element in the set to apply the attribute to
               * or
               - attr (string) attribute name
               - element (Element) specific element in the set to apply the attribute to
               - eattr (string) attribute on the element to bind the attribute to
               = (object) Set object
              \*/
      bind(attr, a, b) {
        const data = {};
        if (typeof a == "function") {
          this.bindings[attr] = a;
        } else {
          const aname = b || attr;
          this.bindings[attr] = (v) => {
            data[aname] = v;
            a.attr(data);
          };
        }
        return this;
      }
      /*\
               * Set.attr
               [ method ]
               **
               * Equivalent of @Element.attr.
               = (object) Set object
              \*/
      attr(value) {
        const unbound = {};
        for (const k in value) {
          if (this.bindings[k]) {
            this.bindings[k](value[k]);
          } else {
            unbound[k] = value[k];
          }
        }
        for (let i = 0, ii = this.items.length; i < ii; i++) {
          this.items[i].attr(unbound);
        }
        return this;
      }
      /*\
               * Set.clear
               [ method ]
               **
               * Removes all elements from the set
              \*/
      clear() {
        while (this.length) {
          this.pop();
        }
      }
      /*\
               * Set.splice
               [ method ]
               **
               * Removes range of elements from the set
               **
               - index (number) position of the deletion
               - count (number) number of element to remove
               - insertion… (object) #optional elements to insert
               = (object) set elements that were deleted
              \*/
      splice(index, count, ...args) {
        const ind = index < 0 ? mmax(this.length + index, 0) : index;
        const c = mmax(0, mmin(this.length - ind, count));
        const tail = [];
        const todel = [];
        let i;
        for (i = 0; i < c; i++) {
          todel.push(this[ind + i]);
        }
        for (; i < this.length - ind; i++) {
          tail.push(this[ind + i]);
        }
        const arglen = args.length;
        for (i = 0; i < arglen + tail.length; i++) {
          this.items[ind + i] = this[ind + i] =
            i < arglen ? args[i] : tail[i - arglen];
        }
        i = this.items.length = this.length -= c - arglen;
        while (this[i]) {
          delete this[i++];
        }
        return new Set(todel);
      }
      /*\
               * Set.exclude
               [ method ]
               **
               * Removes given element from the set
               **
               - element (object) element to remove
               = (boolean) `true` if object was found and removed from the set
              \*/
      exclude(el) {
        for (let i = 0, ii = this.length; i < ii; i++)
          if (this[i] == el) {
            this.splice(i, 1);
            return true;
          }
        return false;
      }
      /*\
               * Set.insertAfter
               [ method ]
               **
               * Inserts set elements after given element.
               **
               - element (object) set will be inserted after this element
               = (object) Set object
              \*/
      insertAfter(el) {
        let i = this.items.length;
        while (i--) {
          this.items[i].insertAfter(el);
        }
        return this;
      }
      /*\
               * Set.getBBox
               [ method ]
               **
               * Union of all bboxes of the set. See @Element.getBBox.
               = (object) bounding box descriptor. See @Element.getBBox.
              \*/
      getBBox() {
        let x = [];
        let y = [];
        let x2 = [];
        let y2 = [];
        for (let i = this.items.length; i--; )
          if (!this.items[i].removed) {
            const box = this.items[i].getBBox();
            x.push(box.x);
            y.push(box.y);
            x2.push(box.x + box.width);
            y2.push(box.y + box.height);
          }
        x = mmin.apply(0, x);
        y = mmin.apply(0, y);
        x2 = mmax.apply(0, x2);
        y2 = mmax.apply(0, y2);
        return {
          x,
          y,
          x2,
          y2,
          width: x2 - x,
          height: y2 - y,
          cx: x + (x2 - x) / 2,
          cy: y + (y2 - y) / 2,
        };
      }
      /*\
               * Set.clone
               [ method ]
               **
               * Creates a clone of the set.
               **
               = (object) New Set object
              \*/
      clone() {
        const s = new Set();
        for (let i = 0, ii = this.items.length; i < ii; i++) {
          s.push(this.items[i].clone());
        }
        return s;
      }
      toString() {
        return "Snap\u2018s set";
      }
    }
    Set.prototype.type = "set";
    // export
    /*\
       * Snap.Set
       [ property ]
       **
       * Set constructor.
      \*/
    Snap.Set = Set;
    /*\
       * Snap.set
       [ method ]
       **
       * Creates a set and fills it with list of arguments.
       **
       = (object) New Set object
       | var r = paper.rect(0, 0, 10, 10),
       |     s1 = Snap.set(), // empty set
       |     s2 = Snap.set(r, paper.circle(100, 100, 20)); // prefilled set
      \*/
    Snap.set = (...list) => {
      const set = new Set();
      if (list.length) {
        set.push(...list);
      }
      return set;
    };
  });

  // Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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


  Snap.plugin((Snap, Element, _Paper, _glob) => {
    const names = {};
    const reUnit = /[%a-z]+$/i;
    const Str = String;
    names.stroke = names.fill = "colour";
    const getEmpty = (item) => {
      const l = item[0];
      switch (l.toLowerCase()) {
        case "t":
          return [l, 0, 0];
        case "m":
          return [l, 1, 0, 0, 1, 0, 0];
        case "r":
          if (item.length == 4) {
            return [l, 0, item[2], item[3]];
          }
          return [l, 0];
        case "s":
          if (item.length == 5) {
            return [l, 1, 1, item[3], item[4]];
          }
          if (item.length == 3) {
            return [l, 1, 1];
          }
          return [l, 1];
      }
    };
    const equaliseTransformString = (ts1, ts2, getBBox) => {
      let t1 = ts1;
      let t2 = ts2;
      t1 = (typeof t1 == "string" && Snap.parseTransformString(t1)) || [];
      t2 = (typeof t2 == "string" && Snap.parseTransformString(t2)) || [];
      const maxlength = Math.max(t1.length, t2.length);
      let from = [];
      let to = [];
      let i = 0;
      let j;
      let jj;
      let tt1;
      let tt2;
      for (; i < maxlength; i++) {
        tt1 = t1[i] || getEmpty(t2[i]);
        tt2 = t2[i] || getEmpty(tt1);
        if (
          tt1[0] != tt2[0] ||
          (tt1[0].toLowerCase() == "r" &&
            (tt1[2] != tt2[2] || tt1[3] != tt2[3])) ||
          (tt1[0].toLowerCase() == "s" && (tt1[3] != tt2[3] || tt1[4] != tt2[4]))
        ) {
          t1 = Snap._.transform2matrix(t1, getBBox(1));
          t2 = Snap._.transform2matrix(t2, getBBox(1));
          from = [["m", t1.a, t1.b, t1.c, t1.d, t1.e, t1.f]];
          to = [["m", t2.a, t2.b, t2.c, t2.d, t2.e, t2.f]];
          break;
        }
        from[i] = [];
        to[i] = [];
        for (j = 0, jj = Math.max(tt1.length, tt2.length); j < jj; j++) {
          if (j in tt1) {
            from[i][j] = tt1[j];
          }
          if (j in tt2) {
            to[i][j] = tt2[j];
          }
        }
      }
      return {
        from: path2array(from),
        to: path2array(to),
        f: getPath(from),
      };
    };
    const equaliseTransform = (ts1, ts2, t1Matrix, t2Matrix, getBBox) => {
      let t1 = ts1;
      let t2 = ts2;
      t1 = t1 || new Snap.Matrix();
      t2 = t2 || new Snap.Matrix();
      const stringRes = equaliseTransformString(t1, t2, getBBox);
      let matrixRes;
      if (stringRes.f([]).charAt() == "m") {
        matrixRes = equaliseTransformString(
          t1Matrix.toTransformString(),
          t2Matrix.toTransformString(),
          getBBox,
        );
      }
      return matrixRes || stringRes;
    };
    const getNumber = (val) => val;
    const getUnit = (unit) => (val) => +val.toFixed(3) + unit;
    const getViewBox = (val) => val.join(" ");
    const getColour = (clr) => Snap.rgb(clr[0], clr[1], clr[2], clr[3]);
    const getPath = (path) => {
      let k = 0;
      let i;
      let ii;
      let j;
      let jj;
      let out;
      let a;
      const b = [];
      for (i = 0, ii = path.length; i < ii; i++) {
        out = "[";
        a = [`"${path[i][0]}"`];
        for (j = 1, jj = path[i].length; j < jj; j++) {
          a[j] = `val[${k++}]`;
        }
        out += `${a}]`;
        b[i] = out;
      }
      return Function("val", `return Snap.path.toString.call([${b}])`);
    };
    const path2array = (path) => {
      const out = [];
      for (let i = 0, ii = path.length; i < ii; i++) {
        for (let j = 1, jj = path[i].length; j < jj; j++) {
          out.push(path[i][j]);
        }
      }
      return out;
    };
    const isNumeric = (obj) => Number.isFinite(obj);
    const arrayEqual = (arr1, arr2) => {
      if (!Snap.is(arr1, "array") || !Snap.is(arr2, "array")) {
        return false;
      }
      return arr1.toString() == arr2.toString();
    };
    Element.prototype.equal = function (name, b) {
      return eve("snap.util.equal", this, name, b).firstDefined();
    };
    eve.on("snap.util.equal", function (name, b) {
      let A;
      let B;
      const a = Str(this.attr(name) || "");
      if (names[name] == "colour") {
        A = Snap.color(a);
        B = Snap.color(b);
        return {
          from: [A.r, A.g, A.b, A.opacity],
          to: [B.r, B.g, B.b, B.opacity],
          f: getColour,
        };
      }
      if (name == "viewBox") {
        A = this.attr(name).vb.split(" ").map(Number);
        B = b.split(" ").map(Number);
        return {
          from: A,
          to: B,
          f: getViewBox,
        };
      }
      if (
        name == "transform" ||
        name == "gradientTransform" ||
        name == "patternTransform"
      ) {
        let B = b;
        if (typeof b == "string") {
          B = Str(b).replace(/\.{3}|\u2026/g, a);
        }
        let bMatrix;
        if (!Snap._.rgTransform.test(B)) {
          bMatrix = Snap._.transform2matrix(
            Snap._.svgTransform2string(B),
            this.getBBox(),
          );
        } else {
          bMatrix = Snap._.transform2matrix(B, this.getBBox());
        }
        return equaliseTransform(a, B, this.matrix, bMatrix, () =>
          this.getBBox(1),
        );
      }
      if (name == "d" || name == "path") {
        A = Snap.path.toCubic(a, b);
        return {
          from: path2array(A[0]),
          to: path2array(A[1]),
          f: getPath(A[0]),
        };
      }
      if (name == "points") {
        A = Str(a).split(Snap._.separator);
        B = Str(b).split(Snap._.separator);
        return {
          from: A,
          to: B,
          f: (val) => val,
        };
      }
      if (isNumeric(a) && isNumeric(b)) {
        return {
          from: Number.parseFloat(a),
          to: Number.parseFloat(b),
          f: getNumber,
        };
      }
      const aUnit = a.match(reUnit);
      const bUnit = Str(b).match(reUnit);
      if (aUnit && arrayEqual(aUnit, bUnit)) {
        return {
          from: Number.parseFloat(a),
          to: Number.parseFloat(b),
          f: getUnit(aUnit),
        };
      }
      return {
        from: this.asPX(name),
        to: this.asPX(name, b),
        f: getNumber,
      };
    });
  });

  // Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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


  Snap.plugin((Snap, Element, _Paper, glob) => {
    const elproto = Element.prototype;
    const has = "hasOwnProperty";
    const win = Snap._.glob.win;
    const supportsPointer =
      "onmspointerdown" in win.document || "onpointerdown" in win.document;
    const supportsTouch =
      "ontouchstart" in win ||
      (win.DocumentTouch && win.document instanceof DocumentTouch);
    const events = [
      "click",
      "dblclick",
      "mousedown",
      "mousemove",
      "mouseout",
      "mouseover",
      "mouseup",
      "touchstart",
      "touchmove",
      "touchend",
      "touchcancel",
      "pointerup",
      "pointerdown",
      "pointermove",
      "pointerout",
      "pointerover",
    ];
    const touchMap = {
      mousedown: "touchstart",
      mousemove: "touchmove",
      mouseup: "touchend",
    };
    const pointerMap = {
      mouseup: "pointerup",
      mousedown: "pointerdown",
      mousemove: "pointermove",
      mouseout: "pointerout",
      mouseover: "pointerover",
    };
    const getScroll = (xy, el) => {
      const name = xy == "y" ? "scrollTop" : "scrollLeft";
      const doc = el?.node ? el.node.ownerDocument : glob.doc;
      return doc[name in doc.documentElement ? "documentElement" : "body"][name];
    };
    const preventTouch = function () {
      return this.originalEvent.preventDefault();
    };
    const stopTouch = function () {
      return this.originalEvent.stopPropagation();
    };
    const addEvent = (obj, type, fn, element) => {
      const realName =
        supportsTouch && touchMap[type]
          ? touchMap[type]
          : supportsPointer && pointerMap[type]
            ? pointerMap[type]
            : type;
      const f = (ev) => {
        let e = ev;
        const scrollY = getScroll("y", element);
        const scrollX = getScroll("x", element);
        if (supportsTouch && touchMap[has](type)) {
          for (let i = 0, ii = e.targetTouches?.length; i < ii; i++) {
            if (
              e.targetTouches[i].target == obj ||
              obj.contains(e.targetTouches[i].target)
            ) {
              const olde = e;
              e = e.targetTouches[i];
              e.originalEvent = olde;
              e.preventDefault = preventTouch;
              e.stopPropagation = stopTouch;
              break;
            }
          }
        }
        const x = e.clientX + scrollX;
        const y = e.clientY + scrollY;
        return fn.call(element, e, x, y);
      };
      const pointerName = pointerMap[type];

      if (type != realName) {
        obj.addEventListener(type, f, false);
      }

      if (pointerName) {
        obj.addEventListener(pointerName, f, false);
      }

      obj.addEventListener(realName, f, false);

      return () => {
        if (type != realName) {
          obj.removeEventListener(type, f, false);
        }

        if (pointerName) {
          obj.removeEventListener(pointerName, f, false);
        }

        obj.removeEventListener(realName, f, false);
        return true;
      };
    };
    let drag = [];
    const dragMove = (e) => {
      let x = e.clientX;
      let y = e.clientY;
      const scrollY = getScroll("y");
      const scrollX = getScroll("x");
      let dragi;
      let j = drag.length;
      while (j--) {
        dragi = drag[j];
        if (supportsTouch) {
          let i = e.touches?.length;
          let touch;
          while (i--) {
            touch = e.touches[i];
            if (
              touch.identifier == dragi.el._drag.id ||
              dragi.el.node.contains(touch.target)
            ) {
              x = touch.clientX;
              y = touch.clientY;
              (e.originalEvent ? e.originalEvent : e).preventDefault();
              break;
            }
          }
        } else {
          e.preventDefault();
        }
        // var node = dragi.el.node,
        //     o,
        //     next = node.nextSibling,
        //     parent = node.parentNode,
        //     display = node.style.display;
        // glob.win.opera && parent.removeChild(node);
        // node.style.display = "none";
        // o = dragi.el.paper.getElementByPoint(x, y);
        // node.style.display = display;
        // glob.win.opera && (next ? parent.insertBefore(node, next) : parent.appendChild(node));
        // o && eve("snap.drag.over." + dragi.el.id, dragi.el, o);
        x += scrollX;
        y += scrollY;
        eve(
          `snap.drag.move.${dragi.el.id}`,
          dragi.move_scope || dragi.el,
          x - dragi.el._drag.x,
          y - dragi.el._drag.y,
          x,
          y,
          e,
        );
      }
    };
    const dragUp = (e) => {
      Snap.unmousemove(dragMove).unmouseup(dragUp);
      let i = drag.length;
      let dragi;
      while (i--) {
        dragi = drag[i];
        dragi.el._drag = {};
        eve(
          `snap.drag.end.${dragi.el.id}`,
          dragi.end_scope || dragi.start_scope || dragi.move_scope || dragi.el,
          e,
        );
        eve.off(`snap.drag.*.${dragi.el.id}`);
      }
      drag = [];
    };
    /*\
       * Element.click
       [ method ]
       **
       * Adds a click event handler to the element
       - handler (function) handler for the event
       = (object) @Element
      \*/
    /*\
       * Element.unclick
       [ method ]
       **
       * Removes a click event handler from the element
       - handler (function) handler for the event
       = (object) @Element
      \*/

    /*\
       * Element.dblclick
       [ method ]
       **
       * Adds a double click event handler to the element
       - handler (function) handler for the event
       = (object) @Element
      \*/
    /*\
       * Element.undblclick
       [ method ]
       **
       * Removes a double click event handler from the element
       - handler (function) handler for the event
       = (object) @Element
      \*/

    /*\
       * Element.mousedown
       [ method ]
       **
       * Adds a mousedown event handler to the element
       - handler (function) handler for the event
       = (object) @Element
      \*/
    /*\
       * Element.unmousedown
       [ method ]
       **
       * Removes a mousedown event handler from the element
       - handler (function) handler for the event
       = (object) @Element
      \*/

    /*\
       * Element.mousemove
       [ method ]
       **
       * Adds a mousemove event handler to the element
       - handler (function) handler for the event
       = (object) @Element
      \*/
    /*\
       * Element.unmousemove
       [ method ]
       **
       * Removes a mousemove event handler from the element
       - handler (function) handler for the event
       = (object) @Element
      \*/

    /*\
       * Element.mouseout
       [ method ]
       **
       * Adds a mouseout event handler to the element
       - handler (function) handler for the event
       = (object) @Element
      \*/
    /*\
       * Element.unmouseout
       [ method ]
       **
       * Removes a mouseout event handler from the element
       - handler (function) handler for the event
       = (object) @Element
      \*/

    /*\
       * Element.mouseover
       [ method ]
       **
       * Adds a mouseover event handler to the element
       - handler (function) handler for the event
       = (object) @Element
      \*/
    /*\
       * Element.unmouseover
       [ method ]
       **
       * Removes a mouseover event handler from the element
       - handler (function) handler for the event
       = (object) @Element
      \*/

    /*\
       * Element.mouseup
       [ method ]
       **
       * Adds a mouseup event handler to the element
       - handler (function) handler for the event
       = (object) @Element
      \*/
    /*\
       * Element.unmouseup
       [ method ]
       **
       * Removes a mouseup event handler from the element
       - handler (function) handler for the event
       = (object) @Element
      \*/

    /*\
       * Element.touchstart
       [ method ]
       **
       * Adds a touchstart event handler to the element
       - handler (function) handler for the event
       = (object) @Element
      \*/
    /*\
       * Element.untouchstart
       [ method ]
       **
       * Removes a touchstart event handler from the element
       - handler (function) handler for the event
       = (object) @Element
      \*/

    /*\
       * Element.touchmove
       [ method ]
       **
       * Adds a touchmove event handler to the element
       - handler (function) handler for the event
       = (object) @Element
      \*/
    /*\
       * Element.untouchmove
       [ method ]
       **
       * Removes a touchmove event handler from the element
       - handler (function) handler for the event
       = (object) @Element
      \*/

    /*\
       * Element.touchend
       [ method ]
       **
       * Adds a touchend event handler to the element
       - handler (function) handler for the event
       = (object) @Element
      \*/
    /*\
       * Element.untouchend
       [ method ]
       **
       * Removes a touchend event handler from the element
       - handler (function) handler for the event
       = (object) @Element
      \*/

    /*\
       * Element.touchcancel
       [ method ]
       **
       * Adds a touchcancel event handler to the element
       - handler (function) handler for the event
       = (object) @Element
      \*/
    /*\
       * Element.untouchcancel
       [ method ]
       **
       * Removes a touchcancel event handler from the element
       - handler (function) handler for the event
       = (object) @Element
      \*/
    for (let i = events.length; i--; ) {
      ((eventName) => {
        Snap[eventName] = elproto[eventName] = function (fn, scope) {
          if (Snap.is(fn, "function")) {
            this.events = this.events || [];
            this.events.push({
              name: eventName,
              f: fn,
              unbind: addEvent(
                this.node || document,
                eventName,
                fn,
                scope || this,
              ),
            });
          } else {
            for (let i = 0, ii = this.events.length; i < ii; i++)
              if (this.events[i].name == eventName) {
                try {
                  this.events[i].f.call(this);
                } catch (_e) {}
              }
          }
          return this;
        };
        Snap[`un${eventName}`] = elproto[`un${eventName}`] = function (fn) {
          const events = this.events || [];
          let l = events.length;
          while (l--)
            if (events[l].name == eventName && (events[l].f == fn || !fn)) {
              events[l].unbind();
              events.splice(l, 1);
              if (!events.length) {
                this.events = undefined;
              }
              return this;
            }
          return this;
        };
      })(events[i]);
    }
    /*\
       * Element.hover
       [ method ]
       **
       * Adds hover event handlers to the element
       - f_in (function) handler for hover in
       - f_out (function) handler for hover out
       - icontext (object) #optional context for hover in handler
       - ocontext (object) #optional context for hover out handler
       = (object) @Element
      \*/
    elproto.hover = function (f_in, f_out, scope_in, scope_out) {
      return this.mouseover(f_in, scope_in).mouseout(
        f_out,
        scope_out || scope_in,
      );
    };
    /*\
       * Element.unhover
       [ method ]
       **
       * Removes hover event handlers from the element
       - f_in (function) handler for hover in
       - f_out (function) handler for hover out
       = (object) @Element
      \*/
    elproto.unhover = function (f_in, f_out) {
      return this.unmouseover(f_in).unmouseout(f_out);
    };
    const draggable = [];
    // SIERRA unclear what _context_ refers to for starting, ending, moving the drag gesture.
    // SIERRA Element.drag(): _x position of the mouse_: Where are the x/y values offset from?
    // SIERRA Element.drag(): much of this member's doc appears to be duplicated for some reason.
    // SIERRA Unclear about this sentence: _Additionally following drag events will be triggered: drag.start.<id> on start, drag.end.<id> on end and drag.move.<id> on every move._ Is there a global _drag_ object to which you can assign handlers keyed by an element's ID?
    /*\
       * Element.drag
       [ method ]
       **
       * Adds event handlers for an element's drag gesture
       **
       - onmove (function) handler for moving
       - onstart (function) handler for drag start
       - onend (function) handler for drag end
       - mcontext (object) #optional context for moving handler
       - scontext (object) #optional context for drag start handler
       - econtext (object) #optional context for drag end handler
       * Additionaly following `drag` events are triggered: `drag.start.<id>` on start,
       * `drag.end.<id>` on end and `drag.move.<id>` on every move. When element is dragged over another element
       * `drag.over.<id>` fires as well.
       *
       * Start event and start handler are called in specified context or in context of the element with following parameters:
       o x (number) x position of the mouse
       o y (number) y position of the mouse
       o event (object) DOM event object
       * Move event and move handler are called in specified context or in context of the element with following parameters:
       o dx (number) shift by x from the start point
       o dy (number) shift by y from the start point
       o x (number) x position of the mouse
       o y (number) y position of the mouse
       o event (object) DOM event object
       * End event and end handler are called in specified context or in context of the element with following parameters:
       o event (object) DOM event object
       = (object) @Element
      \*/
    elproto.drag = function (
      onmove,
      onstart,
      onend,
      move_scope,
      start_scope,
      end_scope,
    ) {
      const el = this;
      if (!arguments.length) {
        let origTransform;
        return el.drag(
          function (dx, dy) {
            this.attr({
              transform: origTransform + (origTransform ? "T" : "t") + [dx, dy],
            });
          },
          function () {
            origTransform = this.transform().local;
          },
        );
      }
      const start = (e, x, y) => {
        (e.originalEvent || e).preventDefault();
        el._drag.x = x;
        el._drag.y = y;
        el._drag.id = e.identifier;
        !drag.length && Snap.mousemove(dragMove).mouseup(dragUp);
        drag.push({
          el,
          move_scope,
          start_scope,
          end_scope,
        });
        onstart && eve.on(`snap.drag.start.${el.id}`, onstart);
        onmove && eve.on(`snap.drag.move.${el.id}`, onmove);
        onend && eve.on(`snap.drag.end.${el.id}`, onend);
        eve(`snap.drag.start.${el.id}`, start_scope || move_scope || el, x, y, e);
      };
      const init = (e, x, y) => {
        eve(`snap.draginit.${el.id}`, el, e, x, y);
      };
      eve.on(`snap.draginit.${el.id}`, start);
      el._drag = {};
      draggable.push({ el, start, init: init });
      el.mousedown(init);
      return el;
    };
    /*
       * Element.onDragOver
       [ method ]
       **
       * Shortcut to assign event handler for `drag.over.<id>` event, where `id` is the element's `id` (see @Element.id)
       - f (function) handler for event, first argument would be the element you are dragging over
      \*/
    // elproto.onDragOver = function (f) {
    //     f ? eve.on("snap.drag.over." + this.id, f) : eve.unbind("snap.drag.over." + this.id);
    // };
    /*\
       * Element.undrag
       [ method ]
       **
       * Removes all drag event handlers from the given element
      \*/
    elproto.undrag = function () {
      let i = draggable.length;
      while (i--)
        if (draggable[i].el == this) {
          this.unmousedown(draggable[i].init);
          draggable.splice(i, 1);
          eve.unbind(`snap.drag.*.${this.id}`);
          eve.unbind(`snap.draginit.${this.id}`);
        }
      !draggable.length && Snap.unmousemove(dragMove).unmouseup(dragUp);
      return this;
    };
  });

  // Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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


  Snap.plugin((Snap, Element, Paper, _glob) => {
    const pproto = Paper.prototype;
    const rgurl = /^\s*url\((.+)\)/;
    const Str = String;
    const $ = Snap._.$;
    Snap.filter = {};
    /*\
       * Paper.filter
       [ method ]
       **
       * Creates a `<filter>` element
       **
       - filstr (string) SVG fragment of filter provided as a string
       = (object) @Element
       * Note: It is recommended to use filters embedded into the page inside an empty SVG element.
       > Usage
       | var f = paper.filter('<feGaussianBlur stdDeviation="2"/>'),
       |     c = paper.circle(10, 10, 10).attr({
       |         filter: f
       |     });
      \*/
    pproto.filter = function (filstr) {
      let paper = this;
      if (paper.type != "svg") {
        paper = paper.paper;
      }
      const f = Snap.parse(Str(filstr));
      const id = Snap._.id();
      const filter = $("filter");
      $(filter, {
        id,
        filterUnits: "userSpaceOnUse",
      });
      filter.appendChild(f.node);
      paper.defs.appendChild(filter);
      return new Element(filter);
    };

    eve.on("snap.util.getattr.filter", function () {
      eve.stop();
      const p = $(this.node, "filter");
      if (p) {
        const match = Str(p).match(rgurl);
        return match && Snap.select(match[1]);
      }
    });
    eve.on("snap.util.attr.filter", function (value) {
      if (value instanceof Element && value.type == "filter") {
        eve.stop();
        let id = value.node.id;
        if (!id) {
          $(value.node, { id: value.id });
          id = value.id;
        }
        $(this.node, {
          filter: Snap.prefixURL(Snap.url(id)),
        });
      }
      if (!value || value == "none") {
        eve.stop();
        this.node.removeAttribute("filter");
      }
    });
    /*\
       * Snap.filter.blur
       [ method ]
       **
       * Returns an SVG markup string for the blur filter
       **
       - x (number) amount of horizontal blur, in pixels
       - y (number) #optional amount of vertical blur, in pixels
       = (string) filter representation
       > Usage
       | var f = paper.filter(Snap.filter.blur(5, 10)),
       |     c = paper.circle(10, 10, 10).attr({
       |         filter: f
       |     });
      \*/
    Snap.filter.blur = (x = 2, y = null) => {
      const def = y == null ? x : [x, y];
      return `<feGaussianBlur stdDeviation="${def}"/>`;
    };
    Snap.filter.blur.toString = function () {
      return this();
    };
    /*\
       * Snap.filter.shadow
       [ method ]
       **
       * Returns an SVG markup string for the shadow filter
       **
       - dx (number) #optional horizontal shift of the shadow, in pixels
       - dy (number) #optional vertical shift of the shadow, in pixels
       - blur (number) #optional amount of blur
       - color (string) #optional color of the shadow
       - opacity (number) #optional `0..1` opacity of the shadow
       * or
       - dx (number) #optional horizontal shift of the shadow, in pixels
       - dy (number) #optional vertical shift of the shadow, in pixels
       - color (string) #optional color of the shadow
       - opacity (number) #optional `0..1` opacity of the shadow
       * which makes blur default to `4`. Or
       - dx (number) #optional horizontal shift of the shadow, in pixels
       - dy (number) #optional vertical shift of the shadow, in pixels
       - opacity (number) #optional `0..1` opacity of the shadow
       = (string) filter representation
       > Usage
       | var f = paper.filter(Snap.filter.shadow(0, 2, .3)),
       |     c = paper.circle(10, 10, 10).attr({
       |         filter: f
       |     });
      \*/
    Snap.filter.shadow = (dx2, dy2, b, c, o) => {
      let opacity = o;
      let blur = b;
      let color = c;
      let dx = dx2;
      let dy = dy2;
      if (opacity == null) {
        if (color == null) {
          opacity = blur;
          blur = 4;
          color = "#000";
        } else {
          opacity = color;
          color = blur;
          blur = 4;
        }
      }
      if (blur == null) {
        blur = 4;
      }
      if (opacity == null) {
        opacity = 1;
      }
      if (dx == null) {
        dx = 0;
        dy = 2;
      }
      if (dy == null) {
        dy = dx;
      }
      color = Snap.color(color);
      return `<feGaussianBlur in="SourceAlpha" stdDeviation="${blur}"/>
            <feOffset dx="${dx}" dy="${dy}" result="offsetblur"/>
            <feFlood flood-color="${color}"/>
            <feComposite in2="offsetblur" operator="in"/>
            <feComponentTransfer>
                <feFuncA type="linear" slope="${opacity}"/>
            </feComponentTransfer>
            <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>`;
    };
    Snap.filter.shadow.toString = function () {
      return this();
    };
    /*\
       * Snap.filter.grayscale
       [ method ]
       **
       * Returns an SVG markup string for the grayscale filter
       **
       - amount (number) amount of filter (`0..1`)
       = (string) filter representation
      \*/
    Snap.filter.grayscale = (amount = 1) => {
      return `<feColorMatrix type="matrix" values="${0.2126 + 0.7874 * (1 - amount)} ${0.7152 - 0.7152 * (1 - amount)} ${0.0722 - 0.0722 * (1 - amount)} 0 0
        ${0.2126 - 0.2126 * (1 - amount)} ${0.7152 + 0.2848 * (1 - amount)} ${0.0722 - 0.0722 * (1 - amount)} 0 0
        ${0.2126 - 0.2126 * (1 - amount)} ${0.7152 - 0.7152 * (1 - amount)} ${0.0722 + 0.9278 * (1 - amount)} 0 0 0 0 0 1 0"/>`;
    };
    Snap.filter.grayscale.toString = function () {
      return this();
    };
    /*\
       * Snap.filter.sepia
       [ method ]
       **
       * Returns an SVG markup string for the sepia filter
       **
       - amount (number) amount of filter (`0..1`)
       = (string) filter representation
      \*/
    Snap.filter.sepia = (amount = 1) => {
      const a = 0.393 + 0.607 * (1 - amount);
      const b = 0.769 - 0.769 * (1 - amount);
      const c = 0.189 - 0.189 * (1 - amount);
      const d = 0.349 - 0.349 * (1 - amount);
      const e = 0.686 + 0.314 * (1 - amount);
      const f = 0.168 - 0.168 * (1 - amount);
      const g = 0.272 - 0.272 * (1 - amount);
      const h = 0.534 - 0.534 * (1 - amount);
      const i = 0.131 + 0.869 * (1 - amount);
      return `<feColorMatrix type="matrix" values="${a} ${b} ${c} 0 0 ${d} ${e} ${f} 0 0 ${g} ${h} ${i} 0 0 0 0 0 1 0"/>`;
    };
    Snap.filter.sepia.toString = function () {
      return this();
    };
    /*\
       * Snap.filter.saturate
       [ method ]
       **
       * Returns an SVG markup string for the saturate filter
       **
       - amount (number) amount of filter (`0..1`)
       = (string) filter representation
      \*/
    Snap.filter.saturate = (amount = 1) => {
      return `<feColorMatrix type="saturate" values="${1 - amount}"/>`;
    };
    Snap.filter.saturate.toString = function () {
      return this();
    };
    /*\
       * Snap.filter.hueRotate
       [ method ]
       **
       * Returns an SVG markup string for the hue-rotate filter
       **
       - angle (number) angle of rotation
       = (string) filter representation
      \*/
    Snap.filter.hueRotate = (angle = 0) => {
      return `<feColorMatrix type="hueRotate" values="${angle}"/>`;
    };
    Snap.filter.hueRotate.toString = function () {
      return this();
    };
    /*\
       * Snap.filter.invert
       [ method ]
       **
       * Returns an SVG markup string for the invert filter
       **
       - amount (number) amount of filter (`0..1`)
       = (string) filter representation
      \*/
    Snap.filter.invert = (amount = 1) => {
      //        <feColorMatrix type="matrix" values="-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0" color-interpolation-filters="sRGB"/>
      return `<feComponentTransfer><feFuncR type="table" tableValues="${amount} ${1 - amount}"/><feFuncG type="table" tableValues="${amount} ${1 - amount}"/><feFuncB type="table" tableValues="${amount} ${1 - amount}"/></feComponentTransfer>`;
    };
    Snap.filter.invert.toString = function () {
      return this();
    };
    /*\
       * Snap.filter.brightness
       [ method ]
       **
       * Returns an SVG markup string for the brightness filter
       **
       - amount (number) amount of filter (`0..1`)
       = (string) filter representation
      \*/
    Snap.filter.brightness = (amount = 1) => {
      return `<feComponentTransfer>
            <feFuncR type="linear" slope="${amount}"/>
            <feFuncG type="linear" slope="${amount}"/>
            <feFuncB type="linear" slope="${amount}"/>
        </feComponentTransfer>`;
    };
    Snap.filter.brightness.toString = function () {
      return this();
    };
    /*\
       * Snap.filter.contrast
       [ method ]
       **
       * Returns an SVG markup string for the contrast filter
       **
       - amount (number) amount of filter (`0..1`)
       = (string) filter representation
      \*/
    Snap.filter.contrast = (amount = 1) => {
      const amount2 = 0.5 - amount / 2;
      return `<feComponentTransfer>
            <feFuncR type="linear" slope="${amount}" intercept="${amount2}"/>
            <feFuncG type="linear" slope="${amount}" intercept="${amount2}"/>
            <feFuncB type="linear" slope="${amount}" intercept="${amount2}"/>
        </feComponentTransfer>`;
    };
    Snap.filter.contrast.toString = function () {
      return this();
    };
  });

  // Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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

  Snap.plugin((Snap, Element, _Paper, _glob, _Fragment) => {
    const box = Snap._.box;
    const is = Snap.is;
    const firstLetter = /^[^a-z]*([tbmlrc])/i;
    const toString = function () {
      return `T${this.dx},${this.dy}`;
    };
    /*\
       * Element.getAlign
       [ method ]
       **
       * Returns shift needed to align the element relatively to given element.
       * If no elements specified, parent `<svg>` container will be used.
       - el (object) @optional alignment element
       - way (string) one of six values: `"top"`, `"middle"`, `"bottom"`, `"left"`, `"center"`, `"right"`
       = (object|string) Object in format `{dx: , dy: }` also has a string representation as a transformation string
       > Usage
       | el.transform(el.getAlign(el2, "top"));
       * or
       | var dy = el.getAlign(el2, "top").dy;
      \*/
    Element.prototype.getAlign = function (el2, way2) {
      let el = el2;
      let way = way2;
      if (way == null && is(el, "string")) {
        way = el;
        el = null;
      }
      el = el || this.paper;
      const bx = el.getBBox ? el.getBBox() : box(el);
      const bb = this.getBBox();
      const out = {};
      way = way?.match(firstLetter);
      way = way ? way[1].toLowerCase() : "c";
      switch (way) {
        case "t":
          out.dx = 0;
          out.dy = bx.y - bb.y;
          break;
        case "b":
          out.dx = 0;
          out.dy = bx.y2 - bb.y2;
          break;
        case "m":
          out.dx = 0;
          out.dy = bx.cy - bb.cy;
          break;
        case "l":
          out.dx = bx.x - bb.x;
          out.dy = 0;
          break;
        case "r":
          out.dx = bx.x2 - bb.x2;
          out.dy = 0;
          break;
        default:
          out.dx = bx.cx - bb.cx;
          out.dy = 0;
          break;
      }
      out.toString = toString;
      return out;
    };
    /*\
       * Element.align
       [ method ]
       **
       * Aligns the element relatively to given one via transformation.
       * If no elements specified, parent `<svg>` container will be used.
       - el (object) @optional alignment element
       - way (string) one of six values: `"top"`, `"middle"`, `"bottom"`, `"left"`, `"center"`, `"right"`
       = (object) this element
       > Usage
       | el.align(el2, "top");
       * or
       | el.align("middle");
      \*/
    Element.prototype.align = function (el, way) {
      return this.transform(`...${this.getAlign(el, way)}`);
    };
  });

  // Copyright (c) 2017 Adobe Systems Incorporated. All rights reserved.
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

  Snap.plugin((Snap, _Element, _Paper, _glob) => {
    // Colours are from https://www.materialui.co
    const red =
      "#ffebee#ffcdd2#ef9a9a#e57373#ef5350#f44336#e53935#d32f2f#c62828#b71c1c#ff8a80#ff5252#ff1744#d50000";
    const pink =
      "#FCE4EC#F8BBD0#F48FB1#F06292#EC407A#E91E63#D81B60#C2185B#AD1457#880E4F#FF80AB#FF4081#F50057#C51162";
    const purple =
      "#F3E5F5#E1BEE7#CE93D8#BA68C8#AB47BC#9C27B0#8E24AA#7B1FA2#6A1B9A#4A148C#EA80FC#E040FB#D500F9#AA00FF";
    const deeppurple =
      "#EDE7F6#D1C4E9#B39DDB#9575CD#7E57C2#673AB7#5E35B1#512DA8#4527A0#311B92#B388FF#7C4DFF#651FFF#6200EA";
    const indigo =
      "#E8EAF6#C5CAE9#9FA8DA#7986CB#5C6BC0#3F51B5#3949AB#303F9F#283593#1A237E#8C9EFF#536DFE#3D5AFE#304FFE";
    const blue =
      "#E3F2FD#BBDEFB#90CAF9#64B5F6#64B5F6#2196F3#1E88E5#1976D2#1565C0#0D47A1#82B1FF#448AFF#2979FF#2962FF";
    const lightblue =
      "#E1F5FE#B3E5FC#81D4FA#4FC3F7#29B6F6#03A9F4#039BE5#0288D1#0277BD#01579B#80D8FF#40C4FF#00B0FF#0091EA";
    const cyan =
      "#E0F7FA#B2EBF2#80DEEA#4DD0E1#26C6DA#00BCD4#00ACC1#0097A7#00838F#006064#84FFFF#18FFFF#00E5FF#00B8D4";
    const teal =
      "#E0F2F1#B2DFDB#80CBC4#4DB6AC#26A69A#009688#00897B#00796B#00695C#004D40#A7FFEB#64FFDA#1DE9B6#00BFA5";
    const green =
      "#E8F5E9#C8E6C9#A5D6A7#81C784#66BB6A#4CAF50#43A047#388E3C#2E7D32#1B5E20#B9F6CA#69F0AE#00E676#00C853";
    const lightgreen =
      "#F1F8E9#DCEDC8#C5E1A5#AED581#9CCC65#8BC34A#7CB342#689F38#558B2F#33691E#CCFF90#B2FF59#76FF03#64DD17";
    const lime =
      "#F9FBE7#F0F4C3#E6EE9C#DCE775#D4E157#CDDC39#C0CA33#AFB42B#9E9D24#827717#F4FF81#EEFF41#C6FF00#AEEA00";
    const yellow =
      "#FFFDE7#FFF9C4#FFF59D#FFF176#FFEE58#FFEB3B#FDD835#FBC02D#F9A825#F57F17#FFFF8D#FFFF00#FFEA00#FFD600";
    const amber =
      "#FFF8E1#FFECB3#FFE082#FFD54F#FFCA28#FFC107#FFB300#FFA000#FF8F00#FF6F00#FFE57F#FFD740#FFC400#FFAB00";
    const orange =
      "#FFF3E0#FFE0B2#FFCC80#FFB74D#FFA726#FF9800#FB8C00#F57C00#EF6C00#E65100#FFD180#FFAB40#FF9100#FF6D00";
    const deeporange =
      "#FBE9E7#FFCCBC#FFAB91#FF8A65#FF7043#FF5722#F4511E#E64A19#D84315#BF360C#FF9E80#FF6E40#FF3D00#DD2C00";
    const brown =
      "#EFEBE9#D7CCC8#BCAAA4#A1887F#8D6E63#795548#6D4C41#5D4037#4E342E#3E2723";
    const grey =
      "#FAFAFA#F5F5F5#EEEEEE#E0E0E0#BDBDBD#9E9E9E#757575#616161#424242#212121";
    const bluegrey =
      "#ECEFF1#CFD8DC#B0BEC5#90A4AE#78909C#607D8B#546E7A#455A64#37474F#263238";
    /*\
       * Snap.mui
       [ property ]
       **
       * Contain Material UI colours.
       | Snap().rect(0, 0, 10, 10).attr({fill: Snap.mui.deeppurple, stroke: Snap.mui.amber[600]});
       # For colour reference: <a href="https://www.materialui.co">https://www.materialui.co</a>.
      \*/
    Snap.mui = {};
    /*\
       * Snap.flat
       [ property ]
       **
       * Contain Flat UI colours.
       | Snap().rect(0, 0, 10, 10).attr({fill: Snap.flat.carrot, stroke: Snap.flat.wetasphalt});
       # For colour reference: <a href="https://www.materialui.co">https://www.materialui.co</a>.
      \*/
    Snap.flat = {};
    const saveColor = (colours) => {
      let colors = colours;
      colors = colors.split(/(?=#)/);
      const color = new String(colors[5]);
      color[50] = colors[0];
      color[100] = colors[1];
      color[200] = colors[2];
      color[300] = colors[3];
      color[400] = colors[4];
      color[500] = colors[5];
      color[600] = colors[6];
      color[700] = colors[7];
      color[800] = colors[8];
      color[900] = colors[9];
      if (colors[10]) {
        color.A100 = colors[10];
        color.A200 = colors[11];
        color.A400 = colors[12];
        color.A700 = colors[13];
      }
      return color;
    };
    Snap.mui.red = saveColor(red);
    Snap.mui.pink = saveColor(pink);
    Snap.mui.purple = saveColor(purple);
    Snap.mui.deeppurple = saveColor(deeppurple);
    Snap.mui.indigo = saveColor(indigo);
    Snap.mui.blue = saveColor(blue);
    Snap.mui.lightblue = saveColor(lightblue);
    Snap.mui.cyan = saveColor(cyan);
    Snap.mui.teal = saveColor(teal);
    Snap.mui.green = saveColor(green);
    Snap.mui.lightgreen = saveColor(lightgreen);
    Snap.mui.lime = saveColor(lime);
    Snap.mui.yellow = saveColor(yellow);
    Snap.mui.amber = saveColor(amber);
    Snap.mui.orange = saveColor(orange);
    Snap.mui.deeporange = saveColor(deeporange);
    Snap.mui.brown = saveColor(brown);
    Snap.mui.grey = saveColor(grey);
    Snap.mui.bluegrey = saveColor(bluegrey);
    Snap.flat.turquoise = "#1abc9c";
    Snap.flat.greensea = "#16a085";
    Snap.flat.sunflower = "#f1c40f";
    Snap.flat.orange = "#f39c12";
    Snap.flat.emerland = "#2ecc71";
    Snap.flat.nephritis = "#27ae60";
    Snap.flat.carrot = "#e67e22";
    Snap.flat.pumpkin = "#d35400";
    Snap.flat.peterriver = "#3498db";
    Snap.flat.belizehole = "#2980b9";
    Snap.flat.alizarin = "#e74c3c";
    Snap.flat.pomegranate = "#c0392b";
    Snap.flat.amethyst = "#9b59b6";
    Snap.flat.wisteria = "#8e44ad";
    Snap.flat.clouds = "#ecf0f1";
    Snap.flat.silver = "#bdc3c7";
    Snap.flat.wetasphalt = "#34495e";
    Snap.flat.midnightblue = "#2c3e50";
    Snap.flat.concrete = "#95a5a6";
    Snap.flat.asbestos = "#7f8c8d";
    /*\
       * Snap.importMUIColors
       [ method ]
       **
       * Imports Material UI colours into global object.
       | Snap.importMUIColors();
       | Snap().rect(0, 0, 10, 10).attr({fill: deeppurple, stroke: amber[600]});
       # For colour reference: <a href="https://www.materialui.co">https://www.materialui.co</a>.
      \*/
    Snap.importMUIColors = () => {
      for (const color in Snap.mui) {
        if (color in Snap.mui) {
          window[color] = Snap.mui[color];
        }
      }
    };
  });

  return Snap;

})();
