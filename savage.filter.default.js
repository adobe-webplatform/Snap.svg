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
     > Parameters
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
        if (!value) {
            eve.stop();
            this.node.removeAttribute("filter");
        }
    });
    
    /*\
     * Paper.filter.blur
     [ method ]
     **
     * Returns string of the blur filter.
     **
     > Parameters
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
     * Paper.filter.blur
     [ method ]
     **
     * Returns string of the blur filter.
     **
     > Parameters
     **
     - dx (number) horisontal shift of the shadow in px.
     - dy (number) vertical shift of the shadow in px.
     - blur (number) #optional amount of blur.
     - color (string) #optional color of the shadow.
     = (string) filter representation
     > Usage
     | var f = paper.filter(Savage.filter.shadow(5, 10)),
     |     c = paper.circle(10, 10, 10).attr({
     |         filter: f
     |     });
    \*/
    Savage.filter.shadow = function (dx, dy, blur, color) {
        color = Savage.color(color || "#000");
        if (blur == null) {
            blur = 2;
        }
        if (dx == null) {
            dx = 0;
            dy = 4;
        }
        if (dy == null) {
            dy = dx;
        }
        return Savage.format('<feColorMatrix type="matrix" in="SourceAlpha" result="colored" values="0 0 0 0 {r} 0 0 0 0 {g} 0 0 0 0 {b} 0 0 0 {o} 0"/><feGaussianBlur in="colored" stdDeviation="{blur}" result="blur"/><feOffset in="blur" dx="{dx}" dy="{dy}" result="offsetBlur"/><feMerge><feMergeNode in="offsetBlur"/><feMergeNode in="SourceGraphic"/></feMerge>', {
            r: color.r,
            g: color.g,
            b: color.b,
            o: color.opacity,
            dx: dx,
            dy: dy,
            blur: blur
        });
    };
    Savage.filter.shadow.toString = function () {
        return this();
    };
});