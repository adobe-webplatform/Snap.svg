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
Savage.plugin(function (Savage, Element, Paper, glob) {
    var elproto = Element.prototype,
        pproto = Paper.prototype,
        rgurl = /^\s*url\((.+)\)/,
        Str = String,
        $ = Savage._.$;
    Savage.filter = {};
    /*\
     * Paper.filter
     [ method ]
     **
     * Creates filter element
     **
     - filstr (string) SVG fragment of filter provided as a string.
     = (object) @Element
     * Note: It is recommended to use filters embedded into page inside empty SVG element.
     > Usage
     | var f = paper.filter('<feGaussianBlur stdDeviation="2"/>'),
     |     c = paper.circle(10, 10, 10).attr({
     |         filter: f
     |     });
    \*/
    pproto.filter = function (filstr) {
        var f = Savage.parse(Str(filstr)),
            id = Savage._.id(),
            width = this.node.offsetWidth,
            height = this.node.offsetHeight,
            filter = $("filter");
        $(filter, {
            id: id,
            filterUnits: "userSpaceOnUse",
            x: 0,
            y: 0,
            width: width,
            height: height
        });
        filter.appendChild(f.node);
        this.defs.appendChild(filter);
        return new Element(filter);
    };
    
    eve.on("savage.util.getattr.filter", function () {
        eve.stop();
        var p = $(this.node, "filter");
        if (p) {
            var match = Str(p).match(rgurl);
            return match && Savage.select(match[1]);
        }
    });
    eve.on("savage.util.attr.filter", function (value) {
        if (value instanceof Element && value.type == "filter") {
            eve.stop();
            var id = value.node.id;
            if (!id) {
                $(value.node, {id: value.id});
                id = value.id;
            }
            $(this.node, {
                filter: "url(#" + id + ")"
            });
        }
        if (!value || value == "none") {
            eve.stop();
            this.node.removeAttribute("filter");
        }
    });
    
    /*\
     * Savage.filter.blur
     [ method ]
     **
     * Returns string of the blur filter.
     **
     - x (number) amount of horisontal blur in px.
     - y (number) #optional amount of vertical blur in px.
     = (string) filter representation
     > Usage
     | var f = paper.filter(Savage.filter.blur(5, 10)),
     |     c = paper.circle(10, 10, 10).attr({
     |         filter: f
     |     });
    \*/
    Savage.filter.blur = function (x, y) {
        if (x == null) {
            x = 2;
        }
        var def = y == null ? x : [x, y];
        return Savage.format('\<feGaussianBlur stdDeviation="{def}"/>', {
            def: def
        });
    };
    Savage.filter.blur.toString = function () {
        return this();
    };
    /*\
     * Savage.filter.shadow
     [ method ]
     **
     * Returns string of the shadow filter.
     **
     - dx (number) horisontal shift of the shadow in px.
     - dy (number) vertical shift of the shadow in px.
     - blur (number) #optional amount of blur.
     - color (string) #optional color of the shadow.
     = (string) filter representation
     > Usage
     | var f = paper.filter(Savage.filter.shadow(0, 2, 3)),
     |     c = paper.circle(10, 10, 10).attr({
     |         filter: f
     |     });
    \*/
    Savage.filter.shadow = function (dx, dy, blur, color) {
        color = color || "#000";
        if (blur == null) {
            blur = 4;
        }
        if (dx == null) {
            dx = 0;
            dy = 2;
        }
        if (dy == null) {
            dy = dx;
        }
        return Savage.format('<feGaussianBlur in="SourceAlpha" stdDeviation="{blur}"/><feOffset dx="{dx}" dy="{dy}" result="offsetblur"/><feFlood flood-color="{color}"/><feComposite in2="offsetblur" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>', {
            color: color,
            dx: dx,
            dy: dy,
            blur: blur
        });
    };
    Savage.filter.shadow.toString = function () {
        return this();
    };
    /*\
     * Savage.filter.grayscale
     [ method ]
     **
     * Returns string of the grayscale filter.
     **
     - amount (number) amount of filter (`0..1`).
     = (string) filter representation
    \*/
    Savage.filter.grayscale = function (amount) {
        if (amount == null) {
            amount = 1;
        }
        return Savage.format('<feColorMatrix type="matrix" values="{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {b} {h} 0 0 0 0 0 1 0"/>', {
            a: 0.2126 + 0.7874 * (1 - amount),
            b: 0.7152 - 0.7152 * (1 - amount),
            c: 0.0722 - 0.0722 * (1 - amount),
            d: 0.2126 - 0.2126 * (1 - amount),
            e: 0.7152 + 0.2848 * (1 - amount),
            f: 0.0722 - 0.0722 * (1 - amount),
            g: 0.2126 - 0.2126 * (1 - amount),
            h: 0.0722 + 0.9278 * (1 - amount)
        });
    };
    Savage.filter.grayscale.toString = function () {
        return this();
    };
    /*\
     * Savage.filter.sepia
     [ method ]
     **
     * Returns string of the sepia filter.
     **
     - amount (number) amount of filter (`0..1`).
     = (string) filter representation
    \*/
    Savage.filter.sepia = function (amount) {
        if (amount == null) {
            amount = 1;
        }
        return Savage.format('<feColorMatrix type="matrix" values="{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {h} {i} 0 0 0 0 0 1 0"/>', {
            a: 0.393 + 0.607 * (1 - amount),
            b: 0.769 - 0.769 * (1 - amount),
            c: 0.189 - 0.189 * (1 - amount),
            d: 0.349 - 0.349 * (1 - amount),
            e: 0.686 + 0.314 * (1 - amount),
            f: 0.168 - 0.168 * (1 - amount),
            g: 0.272 - 0.272 * (1 - amount),
            h: 0.534 - 0.534 * (1 - amount),
            i: 0.131 + 0.869 * (1 - amount)
        });
    };
    Savage.filter.sepia.toString = function () {
        return this();
    };
    /*\
     * Savage.filter.saturate
     [ method ]
     **
     * Returns string of the saturate filter.
     **
     - amount (number) amount of filter (`0..1`).
     = (string) filter representation
    \*/
    Savage.filter.saturate = function (amount) {
        if (amount == null) {
            amount = 1;
        }
        return Savage.format('<feColorMatrix type="saturate" values="{amount}"/>', {
            amount: 1 - amount
        });
    };
    Savage.filter.saturate.toString = function () {
        return this();
    };
    /*\
     * Savage.filter.hueRotate
     [ method ]
     **
     * Returns string of the hue-rotate filter.
     **
     - angle (number) angle of rotation.
     = (string) filter representation
    \*/
    Savage.filter.hueRotate = function (angle) {
        angle = angle || 0;
        return Savage.format('<feColorMatrix type="hueRotate" values="{angle}"/>', {
            angle: angle
        });
    };
    Savage.filter.hueRotate.toString = function () {
        return this();
    };
    /*\
     * Savage.filter.invert
     [ method ]
     **
     * Returns string of the invert filter.
     **
     - amount (number) amount of filter (`0..1`).
     = (string) filter representation
    \*/
    Savage.filter.invert = function (amount) {
        if (amount == null) {
            amount = 1;
        }
        return Savage.format('<feComponentTransfer><feFuncR type="table" tableValues="{amount} {amount2}"/><feFuncG type="table" tableValues="{amount} {amount2}"/><feFuncB type="table" tableValues="{amount} {amount2}"/></feComponentTransfer>', {
            amount: amount,
            amount2: 1 - amount
        });
    };
    Savage.filter.invert.toString = function () {
        return this();
    };
    /*\
     * Savage.filter.brightness
     [ method ]
     **
     * Returns string of the brightness filter.
     **
     - amount (number) amount of filter (`0..1`).
     = (string) filter representation
    \*/
    Savage.filter.brightness = function (amount) {
        if (amount == null) {
            amount = 1;
        }
        return Savage.format('<feComponentTransfer><feFuncR type="linear" slope="{amount}"/><feFuncG type="linear" slope="{amount}"/><feFuncB type="linear" slope="{amount}"/></feComponentTransfer>', {
            amount: amount
        });
    };
    Savage.filter.brightness.toString = function () {
        return this();
    };
    /*\
     * Savage.filter.contrast
     [ method ]
     **
     * Returns string of the contrast filter.
     **
     - amount (number) amount of filter (`0..1`).
     = (string) filter representation
    \*/
    Savage.filter.contrast = function (amount) {
        if (amount == null) {
            amount = 1;
        }
        return Savage.format('<feComponentTransfer><feFuncR type="linear" slope="{amount}" intercept="{amount2}"/><feFuncG type="linear" slope="{amount}" intercept="{amount2}"/><feFuncB type="linear" slope="{amount}" intercept="{amount2}"/></feComponentTransfer>', {
            amount: amount,
            amount2: .5 - amount / 2
        });
    };
    Savage.filter.contrast.toString = function () {
        return this();
    };
});