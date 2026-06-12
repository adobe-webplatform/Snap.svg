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

import eve from "./eve.js";
import { Snap } from "./svg.js";

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
