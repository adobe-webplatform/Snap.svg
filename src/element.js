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
