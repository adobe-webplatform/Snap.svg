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
