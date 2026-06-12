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
