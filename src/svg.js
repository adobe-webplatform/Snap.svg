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

var Snap = (function() {
Snap.version = "0.1.0";
// SIERRA: this method appears to be missing from HTML output
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
 - query (string) CSS query selector
 = (object) @Element
\*/
function Snap(w, h) {
    if (w) {
        if (w.tagName) {
            return wrap(w);
        }
        if (w instanceof Element) {
            return w;
        }
        if (h == null) {
            w = glob.doc.querySelector(w);
            return wrap(w);
        }
    }
    w = w == null ? "100%" : w;
    h = h == null ? "100%" : h;
    return new Paper(w, h);
}
Snap.toString = function () {
    return "Snap v" + this.version;
};
Snap._ = {};
var glob = {
    win: window,
    doc: window.document
};
Snap._.glob = glob;
var has = "hasOwnProperty",
    Str = String,
    toFloat = parseFloat,
    toInt = parseInt,
    math = Math,
    mmax = math.max,
    mmin = math.min,
    abs = math.abs,
    pow = math.pow,
    PI = math.PI,
    round = math.round,
    E = "",
    S = " ",
    objectToString = Object.prototype.toString,
    ISURL = /^url\(['"]?([^\)]+?)['"]?\)$/i,
    colourRegExp = /^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgba?\(\s*([\d\.]+%?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+%?)?)\s*\)|hsba?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?%?)\s*\)|hsla?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?%?)\s*\))\s*$/i,
    isnan = {"NaN": 1, "Infinity": 1, "-Infinity": 1},
    bezierrg = /^(?:cubic-)?bezier\(([^,]+),([^,]+),([^,]+),([^\)]+)\)/,
    reURLValue = /^url\(#?([^)]+)\)$/,
    spaces = "\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029",
    separator = new RegExp("[," + spaces + "]+"),
    whitespace = new RegExp("[" + spaces + "]", "g"),
    commaSpaces = new RegExp("[" + spaces + "]*,[" + spaces + "]*"),
    hsrg = {hs: 1, rg: 1},
    pathCommand = new RegExp("([a-z])[" + spaces + ",]*((-?\\d*\\.?\\d*(?:e[\\-+]?\\d+)?[" + spaces + "]*,?[" + spaces + "]*)+)", "ig"),
    tCommand = new RegExp("([rstm])[" + spaces + ",]*((-?\\d*\\.?\\d*(?:e[\\-+]?\\d+)?[" + spaces + "]*,?[" + spaces + "]*)+)", "ig"),
    pathValues = new RegExp("(-?\\d*\\.?\\d*(?:e[\\-+]?\\d+)?)[" + spaces + "]*,?[" + spaces + "]*", "ig"),
    idgen = 0,
    idprefix = "S" + (+new Date).toString(36),
    ID = function () {
        return idprefix + (idgen++).toString(36);
    },
    xlink = "http://www.w3.org/1999/xlink",
    hub = {};

function $(el, attr) {
    if (attr) {
        if (typeof el == "string") {
            el = $(el);
        }
        if (typeof attr == "string") {
            if (attr.substring(0, 6) == "xlink:") {
                return el.getAttributeNS(xlink, attr.substring(6));
            }
            return el.getAttribute(attr);
        }
        for (var key in attr) if (attr[has](key)) {
            var val = Str(attr[key]);
            if (val) {
                if (key.substring(0, 6) == "xlink:") {
                    el.setAttributeNS(xlink, key.substring(6), val);
                } else {
                    el.setAttribute(key, val);
                }
            } else {
                el.removeAttribute(key);
            }
        }
    } else {
        el = glob.doc.createElementNS("http://www.w3.org/2000/svg", el);
        // el.style && (el.style.webkitTapHighlightColor = "rgba(0,0,0,0)");
    }
    return el;
}
Snap._.$ = $;
Snap._.id = ID;
function getAttrs(el) {
    var attrs = el.attributes,
        name,
        out = {};
    for (var i = 0; i < attrs.length; i++) {
        if (attrs[i].namespaceURI == xlink) {
            name = "xlink:";
        } else {
            name = "";
        }
        name += attrs[i].name;
        out[name] = attrs[i].textContent;
    }
    return out;
}
function is(o, type) {
    type = Str.prototype.toLowerCase.call(type);
    if (type == "finite") {
        return !isnan[has](+o);
    }
    if (type == "array" &&
        (o instanceof Array || Array.isArray && Array.isArray(o))) {
        return true;
    }
    return  (type == "null" && o === null) ||
            (type == typeof o && o !== null) ||
            (type == "object" && o === Object(o)) ||
            objectToString.call(o).slice(8, -1).toLowerCase() == type;
}
/*\
 * Snap.format
 [ method ]
 **
 * Replaces construction of type `{<name>}` to the corresponding argument
 **
 - token (string) string to format
 - json (object) object which properties are used as a replacement
 = (string) formatted string
 > Usage
 | // this draws a rectangular shape equivalent to "M10,20h40v50h-40z"
 | paper.path(Snap.format("M{x},{y}h{dim.width}v{dim.height}h{dim['negative width']}z", {
 |     x: 10,
 |     y: 20,
 |     dim: {
 |         width: 40,
 |         height: 50,
 |         "negative width": -40
 |     }
 | }));
\*/
Snap.format = (function () {
    var tokenRegex = /\{([^\}]+)\}/g,
        objNotationRegex = /(?:(?:^|\.)(.+?)(?=\[|\.|$|\()|\[('|")(.+?)\2\])(\(\))?/g, // matches .xxxxx or ["xxxxx"] to run over object properties
        replacer = function (all, key, obj) {
            var res = obj;
            key.replace(objNotationRegex, function (all, name, quote, quotedName, isFunc) {
                name = name || quotedName;
                if (res) {
                    if (name in res) {
                        res = res[name];
                    }
                    typeof res == "function" && isFunc && (res = res());
                }
            });
            res = (res == null || res == obj ? all : res) + "";
            return res;
        };
    return function (str, obj) {
        return Str(str).replace(tokenRegex, function (all, key) {
            return replacer(all, key, obj);
        });
    };
})();
var preload = (function () {
    function onerror() {
        this.parentNode.removeChild(this);
    }
    return function (src, f) {
        var img = glob.doc.createElement("img"),
            body = glob.doc.body;
        img.style.cssText = "position:absolute;left:-9999em;top:-9999em";
        img.onload = function () {
            f.call(img);
            img.onload = img.onerror = null;
            body.removeChild(img);
        };
        img.onerror = onerror;
        body.appendChild(img);
        img.src = src;
    };
}());
function clone(obj) {
    if (typeof obj == "function" || Object(obj) !== obj) {
        return obj;
    }
    var res = new obj.constructor;
    for (var key in obj) if (obj[has](key)) {
        res[key] = clone(obj[key]);
    }
    return res;
}
Snap._.clone = clone;
function repush(array, item) {
    for (var i = 0, ii = array.length; i < ii; i++) if (array[i] === item) {
        return array.push(array.splice(i, 1)[0]);
    }
}
function cacher(f, scope, postprocessor) {
    function newf() {
        var arg = Array.prototype.slice.call(arguments, 0),
            args = arg.join("\u2400"),
            cache = newf.cache = newf.cache || {},
            count = newf.count = newf.count || [];
        if (cache[has](args)) {
            repush(count, args);
            return postprocessor ? postprocessor(cache[args]) : cache[args];
        }
        count.length >= 1e3 && delete cache[count.shift()];
        count.push(args);
        cache[args] = f.apply(scope, arg);
        return postprocessor ? postprocessor(cache[args]) : cache[args];
    }
    return newf;
}
Snap._.cacher = cacher;
function angle(x1, y1, x2, y2, x3, y3) {
    if (x3 == null) {
        var x = x1 - x2,
            y = y1 - y2;
        if (!x && !y) {
            return 0;
        }
        return (180 + math.atan2(-y, -x) * 180 / PI + 360) % 360;
    } else {
        return angle(x1, y1, x3, y3) - angle(x2, y2, x3, y3);
    }
}
function rad(deg) {
    return deg % 360 * PI / 180;
}
function deg(rad) {
    return rad * 180 / PI % 360;
}
function x_y() {
    return this.x + S + this.y;
}
function x_y_w_h() {
    return this.x + S + this.y + S + this.width + " \xd7 " + this.height;
}

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
// SIERRA for which point is the angle calculated?
/*\
 * Snap.angle
 [ method ]
 **
 * Returns an angle between two or three points
 > Parameters
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
Snap.snapTo = function (values, value, tolerance) {
    tolerance = is(tolerance, "finite") ? tolerance : 10;
    if (is(values, "array")) {
        var i = values.length;
        while (i--) if (abs(values[i] - value) <= tolerance) {
            return values[i];
        }
    } else {
        values = +values;
        var rem = value % values;
        if (rem < tolerance) {
            return value - rem;
        }
        if (rem > values - tolerance) {
            return value - rem + values;
        }
    }
    return value;
};

// MATRIX
function Matrix(a, b, c, d, e, f) {
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
(function (matrixproto) {
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
    matrixproto.add = function (a, b, c, d, e, f) {
        var out = [[], [], []],
            m = [[this.a, this.c, this.e], [this.b, this.d, this.f], [0, 0, 1]],
            matrix = [[a, c, e], [b, d, f], [0, 0, 1]],
            x, y, z, res;

        if (a && a instanceof Matrix) {
            matrix = [[a.a, a.c, a.e], [a.b, a.d, a.f], [0, 0, 1]];
        }

        for (x = 0; x < 3; x++) {
            for (y = 0; y < 3; y++) {
                res = 0;
                for (z = 0; z < 3; z++) {
                    res += m[x][z] * matrix[z][y];
                }
                out[x][y] = res;
            }
        }
        this.a = out[0][0];
        this.b = out[1][0];
        this.c = out[0][1];
        this.d = out[1][1];
        this.e = out[0][2];
        this.f = out[1][2];
        return this;
    };
    /*\
     * Matrix.invert
     [ method ]
     **
     * Returns an inverted version of the matrix
     = (object) @Matrix
    \*/
    matrixproto.invert = function () {
        var me = this,
            x = me.a * me.d - me.b * me.c;
        return new Matrix(me.d / x, -me.b / x, -me.c / x, me.a / x, (me.c * me.f - me.d * me.e) / x, (me.b * me.e - me.a * me.f) / x);
    };
    /*\
     * Matrix.clone
     [ method ]
     **
     * Returns a copy of the matrix
     = (object) @Matrix
    \*/
    matrixproto.clone = function () {
        return new Matrix(this.a, this.b, this.c, this.d, this.e, this.f);
    };
    /*\
     * Matrix.translate
     [ method ]
     **
     * Translate the matrix
     - x (number) horizontal offset distance
     - y (number) vertical offset distance
    \*/
    matrixproto.translate = function (x, y) {
        return this.add(1, 0, 0, 1, x, y);
    };
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
    matrixproto.scale = function (x, y, cx, cy) {
        y == null && (y = x);
        (cx || cy) && this.add(1, 0, 0, 1, cx, cy);
        this.add(x, 0, 0, y, 0, 0);
        (cx || cy) && this.add(1, 0, 0, 1, -cx, -cy);
        return this;
    };
    /*\
     * Matrix.rotate
     [ method ]
     **
     * Rotates the matrix
     - a (number) angle of rotation, in degrees
     - x (number) horizontal origin point from which to rotate
     - y (number) vertical origin point from which to rotate
    \*/
    matrixproto.rotate = function (a, x, y) {
        a = rad(a);
        x = x || 0;
        y = y || 0;
        var cos = +math.cos(a).toFixed(9),
            sin = +math.sin(a).toFixed(9);
        this.add(cos, sin, -sin, cos, x, y);
        return this.add(1, 0, 0, 1, -x, -y);
    };
    /*\
     * Matrix.x
     [ method ]
     **
     * Returns x coordinate for given point after transformation described by the matrix. See also @Matrix.y
     - x (number)
     - y (number)
     = (number) x
    \*/
    matrixproto.x = function (x, y) {
        return x * this.a + y * this.c + this.e;
    };
    /*\
     * Matrix.y
     [ method ]
     **
     * Returns y coordinate for given point after transformation described by the matrix. See also @Matrix.x
     - x (number)
     - y (number)
     = (number) y
    \*/
    matrixproto.y = function (x, y) {
        return x * this.b + y * this.d + this.f;
    };
    matrixproto.get = function (i) {
        return +this[Str.fromCharCode(97 + i)].toFixed(4);
    };
    matrixproto.toString = function () {
        return "matrix(" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)].join() + ")";
    };
    matrixproto.offset = function () {
        return [this.e.toFixed(4), this.f.toFixed(4)];
    };
    function norm(a) {
        return a[0] * a[0] + a[1] * a[1];
    }
    function normalize(a) {
        var mag = math.sqrt(norm(a));
        a[0] && (a[0] /= mag);
        a[1] && (a[1] /= mag);
    }
// SIERRA Matrix.split(): HTML formatting for the return value is scrambled. It should appear _Returns: {OBJECT} in format:..._
// SIERRA Matrix.split(): the _shear_ parameter needs to be detailed. Is it an angle? What does it affect?
// SIERRA Matrix.split(): The idea of _simple_ transforms needs to be detailed and contrasted with any alternatives.
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
    matrixproto.split = function () {
        var out = {};
        // translation
        out.dx = this.e;
        out.dy = this.f;

        // scale and shear
        var row = [[this.a, this.c], [this.b, this.d]];
        out.scalex = math.sqrt(norm(row[0]));
        normalize(row[0]);

        out.shear = row[0][0] * row[1][0] + row[0][1] * row[1][1];
        row[1] = [row[1][0] - row[0][0] * out.shear, row[1][1] - row[0][1] * out.shear];

        out.scaley = math.sqrt(norm(row[1]));
        normalize(row[1]);
        out.shear /= out.scaley;

        // rotation
        var sin = -row[0][1],
            cos = row[1][1];
        if (cos < 0) {
            out.rotate = deg(math.acos(cos));
            if (sin < 0) {
                out.rotate = 360 - out.rotate;
            }
        } else {
            out.rotate = deg(math.asin(sin));
        }

        out.isSimple = !+out.shear.toFixed(9) && (out.scalex.toFixed(9) == out.scaley.toFixed(9) || !out.rotate);
        out.isSuperSimple = !+out.shear.toFixed(9) && out.scalex.toFixed(9) == out.scaley.toFixed(9) && !out.rotate;
        out.noRotation = !+out.shear.toFixed(9) && !out.rotate;
        return out;
    };
// SIERRA Matrix.toTransformString(): The format of the string needs to be detailed.
    /*\
     * Matrix.toTransformString
     [ method ]
     **
     * Returns transform string that represents given matrix
     = (string) transform string
    \*/
    matrixproto.toTransformString = function (shorter) {
        var s = shorter || this.split();
        if (s.isSimple) {
            s.scalex = +s.scalex.toFixed(4);
            s.scaley = +s.scaley.toFixed(4);
            s.rotate = +s.rotate.toFixed(4);
            return  (s.dx || s.dy ? "t" + [+s.dx.toFixed(4), +s.dy.toFixed(4)] : E) + 
                    (s.scalex != 1 || s.scaley != 1 ? "s" + [s.scalex, s.scaley, 0, 0] : E) +
                    (s.rotate ? "r" + [+s.rotate.toFixed(4), 0, 0] : E);
        } else {
            return "m" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)];
        }
    };
})(Matrix.prototype);
// SIERRA Unclear the difference between the two matrix formats ("parameters" vs svgMatrix). See my comment about Element.matrix().
/*\
 * Snap.Matrix
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
Snap.Matrix = Matrix;
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
Snap.getRGB = cacher(function (colour) {
    if (!colour || !!((colour = Str(colour)).indexOf("-") + 1)) {
        return {r: -1, g: -1, b: -1, hex: "none", error: 1, toString: rgbtoString};
    }
    if (colour == "none") {
        return {r: -1, g: -1, b: -1, hex: "none", toString: rgbtoString};
    }
    !(hsrg[has](colour.toLowerCase().substring(0, 2)) || colour.charAt() == "#") && (colour = toHex(colour));
    if (!colour) {
        return {r: -1, g: -1, b: -1, hex: "none", error: 1, toString: rgbtoString};
    }
    var res,
        red,
        green,
        blue,
        opacity,
        t,
        values,
        rgb = colour.match(colourRegExp);
    if (rgb) {
        if (rgb[2]) {
            blue = toInt(rgb[2].substring(5), 16);
            green = toInt(rgb[2].substring(3, 5), 16);
            red = toInt(rgb[2].substring(1, 3), 16);
        }
        if (rgb[3]) {
            blue = toInt((t = rgb[3].charAt(3)) + t, 16);
            green = toInt((t = rgb[3].charAt(2)) + t, 16);
            red = toInt((t = rgb[3].charAt(1)) + t, 16);
        }
        if (rgb[4]) {
            values = rgb[4].split(commaSpaces);
            red = toFloat(values[0]);
            values[0].slice(-1) == "%" && (red *= 2.55);
            green = toFloat(values[1]);
            values[1].slice(-1) == "%" && (green *= 2.55);
            blue = toFloat(values[2]);
            values[2].slice(-1) == "%" && (blue *= 2.55);
            rgb[1].toLowerCase().slice(0, 4) == "rgba" && (opacity = toFloat(values[3]));
            values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
        }
        if (rgb[5]) {
            values = rgb[5].split(commaSpaces);
            red = toFloat(values[0]);
            values[0].slice(-1) == "%" && (red /= 100);
            green = toFloat(values[1]);
            values[1].slice(-1) == "%" && (green /= 100);
            blue = toFloat(values[2]);
            values[2].slice(-1) == "%" && (blue /= 100);
            (values[0].slice(-3) == "deg" || values[0].slice(-1) == "\xb0") && (red /= 360);
            rgb[1].toLowerCase().slice(0, 4) == "hsba" && (opacity = toFloat(values[3]));
            values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
            return Snap.hsb2rgb(red, green, blue, opacity);
        }
        if (rgb[6]) {
            values = rgb[6].split(commaSpaces);
            red = toFloat(values[0]);
            values[0].slice(-1) == "%" && (red /= 100);
            green = toFloat(values[1]);
            values[1].slice(-1) == "%" && (green /= 100);
            blue = toFloat(values[2]);
            values[2].slice(-1) == "%" && (blue /= 100);
            (values[0].slice(-3) == "deg" || values[0].slice(-1) == "\xb0") && (red /= 360);
            rgb[1].toLowerCase().slice(0, 4) == "hsla" && (opacity = toFloat(values[3]));
            values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
            return Snap.hsl2rgb(red, green, blue, opacity);
        }
        red = mmin(math.round(red), 255);
        green = mmin(math.round(green), 255);
        blue = mmin(math.round(blue), 255);
        opacity = mmin(mmax(opacity, 0), 1);
        rgb = {r: red, g: green, b: blue, toString: rgbtoString};
        rgb.hex = "#" + (16777216 | blue | (green << 8) | (red << 16)).toString(16).slice(1);
        rgb.opacity = is(opacity, "finite") ? opacity : 1;
        return rgb;
    }
    return {r: -1, g: -1, b: -1, hex: "none", error: 1, toString: rgbtoString};
}, Snap);
// SIERRA It seems odd that the following 3 conversion methods are not expressed as .this2that(), like the others.
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
Snap.hsb = cacher(function (h, s, b) {
    return Snap.hsb2rgb(h, s, b).hex;
});
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
Snap.hsl = cacher(function (h, s, l) {
    return Snap.hsl2rgb(h, s, l).hex;
});
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
Snap.rgb = cacher(function (r, g, b, o) {
    if (is(o, "finite")) {
        var round = math.round;
        return "rgba(" + [round(r), round(g), round(b), +o.toFixed(2)] + ")";
    }
    return "#" + (16777216 | b | (g << 8) | (r << 16)).toString(16).slice(1);
});
var toHex = function (color) {
    var i = glob.doc.getElementsByTagName("head")[0],
        red = "rgb(255, 0, 0)";
    toHex = cacher(function (color) {
        if (color.toLowerCase() == "red") {
            return red;
        }
        i.style.color = red;
        i.style.color = color;
        var out = glob.doc.defaultView.getComputedStyle(i, E).getPropertyValue("color");
        return out == red ? null : out;
    });
    return toHex(color);
},
hsbtoString = function () {
    return "hsb(" + [this.h, this.s, this.b] + ")";
},
hsltoString = function () {
    return "hsl(" + [this.h, this.s, this.l] + ")";
},
rgbtoString = function () {
    return this.opacity == 1 || this.opacity == null ?
            this.hex :
            "rgba(" + [this.r, this.g, this.b, this.opacity] + ")";
},
prepareRGB = function (r, g, b) {
    if (g == null && is(r, "object") && "r" in r && "g" in r && "b" in r) {
        b = r.b;
        g = r.g;
        r = r.r;
    }
    if (g == null && is(r, string)) {
        var clr = Snap.getRGB(r);
        r = clr.r;
        g = clr.g;
        b = clr.b;
    }
    if (r > 1 || g > 1 || b > 1) {
        r /= 255;
        g /= 255;
        b /= 255;
    }
    
    return [r, g, b];
},
packageRGB = function (r, g, b, o) {
    r = math.round(r * 255);
    g = math.round(g * 255);
    b = math.round(b * 255);
    var rgb = {
        r: r,
        g: g,
        b: b,
        opacity: is(o, "finite") ? o : 1,
        hex: Snap.rgb(r, g, b),
        toString: rgbtoString
    };
    is(o, "finite") && (rgb.opacity = o);
    return rgb;
};
// SIERRA Clarify if Snap does not support consolidated HSLA/RGBA colors. E.g., can you specify a semi-transparent value for Snap.filter.shadow()?
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
Snap.color = function (clr) {
    var rgb;
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
        if (is(clr, "object") && "r" in clr && "g" in clr && "b" in clr && !("error" in clr)) {
            rgb = Snap.rgb2hsl(clr);
            clr.h = rgb.h;
            clr.s = rgb.s;
            clr.l = rgb.l;
            rgb = Snap.rgb2hsb(clr);
            clr.v = rgb.b;
        } else {
            clr = {hex: "none"};
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
Snap.hsb2rgb = function (h, s, v, o) {
    if (is(h, "object") && "h" in h && "s" in h && "b" in h) {
        v = h.b;
        s = h.s;
        h = h.h;
        o = h.o;
    }
    h *= 360;
    var R, G, B, X, C;
    h = (h % 360) / 60;
    C = v * s;
    X = C * (1 - abs(h % 2 - 1));
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
Snap.hsl2rgb = function (h, s, l, o) {
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
    var R, G, B, X, C;
    h = (h % 360) / 60;
    C = 2 * s * (l < .5 ? l : 1 - l);
    X = C * (1 - abs(h % 2 - 1));
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
Snap.rgb2hsb = function (r, g, b) {
    b = prepareRGB(r, g, b);
    r = b[0];
    g = b[1];
    b = b[2];

    var H, S, V, C;
    V = mmax(r, g, b);
    C = V - mmin(r, g, b);
    H = (C == 0 ? null :
         V == r ? (g - b) / C :
         V == g ? (b - r) / C + 2 :
                  (r - g) / C + 4
        );
    H = ((H + 360) % 6) * 60 / 360;
    S = C == 0 ? 0 : C / V;
    return {h: H, s: S, b: V, toString: hsbtoString};
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
Snap.rgb2hsl = function (r, g, b) {
    b = prepareRGB(r, g, b);
    r = b[0];
    g = b[1];
    b = b[2];

    var H, S, L, M, m, C;
    M = mmax(r, g, b);
    m = mmin(r, g, b);
    C = M - m;
    H = (C == 0 ? null :
         M == r ? (g - b) / C :
         M == g ? (b - r) / C + 2 :
                  (r - g) / C + 4);
    H = ((H + 360) % 6) * 60 / 360;
    L = (M + m) / 2;
    S = (C == 0 ? 0 :
         L < .5 ? C / (2 * L) :
                  C / (2 - 2 * L));
    return {h: H, s: S, l: L, toString: hsltoString};
};

// Transformations
// SIERRA Snap.parsePathString(): By _array of arrays,_ I assume you mean a format like this for two separate segments? [ ["M10,10","L90,90"], ["M90,10","L10,90"] ] Otherwise how is each command structured?
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
Snap.parsePathString = function (pathString) {
    if (!pathString) {
        return null;
    }
    var pth = Snap.path(pathString);
    if (pth.arr) {
        return Snap.path.clone(pth.arr);
    }
    
    var paramCounts = {a: 7, c: 6, o: 2, h: 1, l: 2, m: 2, r: 4, q: 4, s: 4, t: 2, v: 1, u: 3, z: 0},
        data = [];
    if (is(pathString, "array") && is(pathString[0], "array")) { // rough assumption
        data = Snap.path.clone(pathString);
    }
    if (!data.length) {
        Str(pathString).replace(pathCommand, function (a, b, c) {
            var params = [],
                name = b.toLowerCase();
            c.replace(pathValues, function (a, b) {
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
            } else while (params.length >= paramCounts[name]) {
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
var parseTransformString = Snap.parseTransformString = function (TString) {
    if (!TString) {
        return null;
    }
    var paramCounts = {r: 3, s: 4, t: 2, m: 6},
        data = [];
    if (is(TString, "array") && is(TString[0], "array")) { // rough assumption
        data = Snap.path.clone(TString);
    }
    if (!data.length) {
        Str(TString).replace(tCommand, function (a, b, c) {
            var params = [],
                name = b.toLowerCase();
            c.replace(pathValues, function (a, b) {
                b && params.push(+b);
            });
            data.push([b].concat(params));
        });
    }
    data.toString = Snap.path.toString;
    return data;
};
function svgTransform2string(tstr) {
    var res = [];
    tstr = tstr.replace(/(?:^|\s)(\w+)\(([^)]+)\)/g, function (all, name, params) {
        params = params.split(/\s*,\s*/);
        if (name == "rotate" && params.length == 1) {
            params.push(0, 0);
        }
        if (name == "scale") {
            if (params.length == 2) {
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
}
var rgTransform = new RegExp("^[a-z][" + spaces + "]*-?\\.?\\d");
function transform2matrix(tstr, bbox) {
    var tdata = parseTransformString(tstr),
        m = new Matrix;
    if (tdata) {
        for (var i = 0, ii = tdata.length; i < ii; i++) {
            var t = tdata[i],
                tlen = t.length,
                command = Str(t[0]).toLowerCase(),
                absolute = t[0] != command,
                inver = absolute ? m.invert() : 0,
                x1,
                y1,
                x2,
                y2,
                bb;
            if (command == "t" && tlen == 3) {
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
                    m.scale(t[1], t[tlen - 1], bb.x + bb.width / 2, bb.y + bb.height / 2);
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
}
Snap._.transform2matrix = transform2matrix;
function extractTransform(el, tstr) {
    if (tstr == null) {
        var doReturn = true;
        if (el.type == "linearGradient" || el.type == "radialGradient") {
            tstr = el.node.getAttribute("gradientTransform");
        } else if (el.type == "pattern") {
            tstr = el.node.getAttribute("patternTransform");
        } else {
            tstr = el.node.getAttribute("transform");
        }
        if (!tstr) {
            return new Matrix;
        }
        tstr = svgTransform2string(tstr);
    } else {
        if (!rgTransform.test(tstr)) {
            tstr = svgTransform2string(tstr);
        } else {
            tstr = Str(tstr).replace(/\.{3}|\u2026/g, el._.transform || E);
        }
        if (is(tstr, "array")) {
            tstr = Snap.path ? Snap.path.toString.call(tstr) : Str(tstr);
        }
        el._.transform = tstr;
    }
    var m = transform2matrix(tstr, el.getBBox(1));
    if (doReturn) {
        return m;
    } else {
        el.matrix = m;
    }
}
Snap._unit2px = unit2px;
function getSomeDefs(el) {
    if (Snap._.someDefs) {
        return Snap._.someDefs;
    }
    var p = el.paper ||
            (el.node.parentNode && Snap(el.node.parentNode)) ||
            Snap.select("svg") ||
            Snap(0, 0),
        defs = p.select("defs").node;
    if (!defs) {
        defs = make("defs", p.node).node;
    }
    Snap._.someDefs = defs;
    return defs;
}
Snap._.getSomeDefs = getSomeDefs;
function unit2px(el, name, value) {
    var defs = getSomeDefs(el),
        out = {},
        mgr = defs.querySelector(".svg---mgr");
    if (!mgr) {
        mgr = $("rect");
        $(mgr, {width: 10, height: 10, "class": "svg---mgr"});
        defs.appendChild(mgr);
    }
    function getW(val) {
        if (val == null) {
            return E;
        }
        if (val == +val) {
            return val;
        }
        $(mgr, {width: val});
        return mgr.getBBox().width;
    }
    function getH(val) {
        if (val == null) {
            return E;
        }
        if (val == +val) {
            return val;
        }
        $(mgr, {height: val});
        return mgr.getBBox().height;
    }
    function set(nam, f) {
        if (name == null) {
            out[nam] = f(el.attr(nam));
        } else if (nam == name) {
            out = f(value == null ? el.attr(nam) : value);
        }
    }
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
Snap.select = function (query) {
    return wrap(glob.doc.querySelector(query));
};
/*\
 * Snap.selectAll
 [ method ]
 **
 * Wraps DOM elements specified by CSS selector as set or array of @Element
 - query (string) CSS selector of the element
 = (Element) the current element
\*/
Snap.selectAll = function (query) {
    var nodelist = glob.doc.querySelectorAll(query),
        set = (Snap.set || Array)();
    for (var i = 0; i < nodelist.length; i++) {
        set.push(wrap(nodelist[i]));
    }
    return set;
};

function add2group(list) {
    if (!is(list, "array")) {
        list = Array.prototype.slice.call(arguments, 0);
    }
    var i = 0,
        j = 0,
        node = this.node;
    while (this[i]) delete this[i++];
    for (i = 0; i < list.length; i++) {
        if (list[i].type == "set") {
            list[i].forEach(function (el) {
                node.appendChild(el.node);
            });
        } else {
            node.appendChild(list[i].node);
        }
    }
    var children = node.childNodes;
    for (i = 0; i < children.length; i++) if (children[i].snap) {
        this[j++] = hub[children[i].snap];
    }
}
function Element(el) {
    if (el.snap in hub) {
        return hub[el.snap];
    }
    var id = this.id = ID(),
        svg;
    try {
        svg = el.ownerSVGElement;
    } catch(e) {}
    this.node = el;
    if (svg) {
        this.paper = new Paper(svg);
    }
    this.type = el.tagName;
    this.anims = {};
    this._ = {
        transform: [],
        sx: 1,
        sy: 1,
        deg: 0,
        dx: 0,
        dy: 0,
        dirty: 1
    };
    el.snap = id;
    hub[id] = this;
    if (this.type == "g") {
        this.add = add2group;
        for (var method in Paper.prototype) if (Paper.prototype[has](method)) {
            this[method] = Paper.prototype[method];
        }
    }
}
function arrayFirstValue(arr) {
    var res;
    for (var i = 0, ii = arr.length; i < ii; i++) {
        res = res || arr[i];
        if (res) {
            return res;
        }
    }
}
(function (elproto) {
    // SIERRA Element.attr(): There appear to be two possible return values, one of which is blank. (Search the doc for _Returns:_ to identify problems.)
    /*\
     * Element.attr
     [ method ]
     **
     * Gets or sets given attributes of the element
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
     |     "fill-opacity": 0.5 // or dash-separated names
     | });
     | console.log(el.attr("fill")); // #fc0
    \*/
    elproto.attr = function (params, value) {
        var el = this,
            node = el.node;
        if (!params) {
            return el;
        }
        if (is(params, "string")) {
            if (arguments.length > 1) {
                var json = {};
                json[params] = value;
                params = json;
            } else {
                return arrayFirstValue(eve("snap.util.getattr."+params, el));
            }
        }
        for (var att in params) {
            if (params[has](att)) {
                eve("snap.util.attr." + att, el, params[att]);
            }
        }
        return el;
    };
// SIERRA Element.getBBox(): Unclear why you would want to express the dimension of the box as a path.
// SIERRA Element.getBBox(): Unclear why you would want to use r0/r1/r2. Also, basic definitions: wouldn't the _smallest circle that can be enclosed_ be a zero-radius point?
    /*\
     * Element.getBBox
     [ method ]
     **
     * Returns the bounding box descriptor for the given element
     **
     = (object) bounding box descriptor:
     o {
     o     cx: (number) x of the center,
     o     cy: (number) x of the center,
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
        var el = this;
        if (el.type == "use") {
            el = el.original;
        }
        if (el.removed) {
            return {};
        }
        var _ = el._;
        if (isWithoutTransform) {
            if (_.dirty || !_.bboxwt) {
                el.realPath = Snap.path.get[el.type](el);
                _.bboxwt = Snap.path.getBBox(el.realPath);
                _.bboxwt.toString = x_y_w_h;
                _.dirty = 0;
            }
            return Snap._.box(_.bboxwt);
        }
        if (_.dirty || _.dirtyT || !_.bbox) {
            if (_.dirty || !el.realPath) {
                _.bboxwt = 0;
                el.realPath = Snap.path.get[el.type](el);
            }
            _.bbox = Snap.path.getBBox(Snap.path.map(el.realPath, el.matrix));
            _.bbox.toString = x_y_w_h;
            _.dirty = _.dirtyT = 0;
        }
        return Snap._.box(_.bbox);
    };
    var propString = function () {
        return this.string;
    };
// SIERRA Element.transform(): seems to allow two return values, one of which (_Element_) is undefined.
// SIERRA Element.transform(): if this only accepts one argument, it's unclear how it can both _get_ and _set_ a transform.
// SIERRA Element.transform(): Unclear how Snap transform string format differs from SVG's.
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
        var _ = this._;
        if (tstr == null) {
            var global = new Matrix(this.node.getCTM()),
                local = extractTransform(this),
                localString = local.toTransformString(),
                string = Str(local) == Str(this.matrix) ?
                            _.transform : localString;
            return {
                string: string,
                globalMatrix: global,
                localMatrix: local,
                diffMatrix: global.clone().add(local.invert()),
                global: global.toTransformString(),
                local: localString,
                toString: propString
            };
        }
        if (tstr instanceof Matrix) {
            // may be need to apply it directly
            // TODO: investigate
            tstr = tstr.toTransformString();
        }
        extractTransform(this, tstr);

        if (this.node) {
            if (this.type == "linearGradient" || this.type == "radialGradient") {
                $(this.node, {gradientTransform: this.matrix});
            } else if (this.type == "pattern") {
                $(this.node, {patternTransform: this.matrix});
            } else {
                $(this.node, {transform: this.matrix});
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
        if (el.type == "set") {
            var it = this;
            el.forEach(function (el) {
                it.append(el);
            });
            return this;
        }
        el = wrap(el);
        this.node.appendChild(el.node);
        el.paper = this.paper;
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
        el = wrap(el);
        this.node.insertBefore(el.node, this.node.firstChild);
        el.paper = this.paper;
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
    // TODO make it work for sets too
    elproto.before = function (el) {
        el = wrap(el);
        this.node.parentNode.insertBefore(el.node, this.node);
        el.paper = this.paper;
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
    elproto.after = function (el) {
        el = wrap(el);
        this.node.parentNode.insertBefore(el.node, this.node.nextSibling);
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
    elproto.insertBefore = function (el) {
        el = wrap(el);
        el.node.parentNode.insertBefore(this.node, el.node);
        this.paper = el.paper;
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
    elproto.insertAfter = function (el) {
        el = wrap(el);
        el.node.parentNode.insertBefore(this.node, el.node.nextSibling);
        this.paper = el.paper;
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
        this.node.parentNode && this.node.parentNode.removeChild(this.node);
        delete this.paper;
        this.removed = true;
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
        var nodelist = this.node.querySelectorAll(query),
            set = (Snap.set || Array)();
        for (var i = 0; i < nodelist.length; i++) {
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
        if (value == null) {
            value = this.attr(attr);
        }
        return unit2px(this, attr, value);
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
        var use,
            id = this.node.id;
        if (!id) {
            id = this.id;
            $(this.node, {
                id: id
            });
        }
        if (this.type == "linearGradient" || this.type == "radialGradient" ||
            this.type == "pattern") {
            use = make(this.type, this.node.parentNode);
        } else {
            use = make("use", this.node.parentNode);
        }
        $(use.node, {
            "xlink:href": "#" + id
        });
        use.original = this;
        return use;
    };
    /*\
     * Element.clone
     [ method ]
     **
     * Creates a clone of the element and inserts it after the element
     **
     = (Element) the clone
    \*/
    function fixids(el) {
        var els = el.selectAll("*"),
            it,
            url = /^\s*url\(("|'|)(.*)\1\)\s*$/,
            ids = [],
            uses = {};
        function urltest(it, name) {
            var val = $(it.node, name);
            val = val && val.match(url);
            val = val && val[2];
            if (val && val.charAt() == "#") {
                val = val.substring(1);
            } else {
                return;
            }
            if (val) {
                uses[val] = (uses[val] || []).concat(function (id) {
                    var attr = {};
                    attr[name] = "url(#" + id + ")";
                    $(it.node, attr);
                });
            }
        }
        function linktest(it) {
            var val = $(it.node, "xlink:href");
            if (val && val.charAt() == "#") {
                val = val.substring(1);
            } else {
                return;
            }
            if (val) {
                uses[val] = (uses[val] || []).concat(function (id) {
                    it.attr("xlink:href", "#" + id);
                });
            }
        }
        for (var i = 0, ii = els.length; i < ii; i++) {
            it = els[i];
            urltest(it, "fill");
            urltest(it, "stroke");
            urltest(it, "filter");
            urltest(it, "mask");
            urltest(it, "clip-path");
            linktest(it);
            var oldid = $(it.node, "id");
            if (oldid) {
                $(it.node, {id: it.id});
                ids.push({
                    old: oldid,
                    id: it.id
                });
            }
        }
        for (i = 0, ii = ids.length; i < ii; i++) {
            var fs = uses[ids[i].old];
            if (fs) {
                for (var j = 0, jj = fs.length; j < jj; j++) {
                    fs[j](ids[i].id);
                }
            }
        }
    }
    elproto.clone = function () {
        var clone = wrap(this.node.cloneNode(true));
        if ($(clone.node, "id")) {
            $(clone.node, {id: clone.id});
        }
        fixids(clone);
        clone.insertAfter(this);
        return clone;
    };
// SIERRA Element.toDefs(): If this _moves_ an element to the <defs> region, why is the return value a _clone_? Also unclear why it's called the _relative_ <defs> section. Perhaps _shared_?
    /*\
     * Element.toDefs
     [ method ]
     **
     * Moves element to the shared `<defs>` area
     **
     = (Element) the clone
    \*/
    elproto.toDefs = function () {
        var defs = getSomeDefs(this);
        defs.appendChild(this.node);
        return this;
    };
// SIERRA Element.pattern(): x/y/width/height data types are listed as both String and Number. Is that an error, or does it mean strings are coerced?
// SIERRA Element.pattern(): clarify that x/y are offsets that e.g., may add gutters between the tiles.
    /*\
     * Element.pattern
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
    elproto.pattern = function (x, y, width, height) {
        var p = make("pattern", getSomeDefs(this));
        if (x == null) {
            x = this.getBBox();
        }
        if (x && "x" in x) {
            y = x.y;
            width = x.width;
            height = x.height;
            x = x.x;
        }
        $(p.node, {
            x: x,
            y: y,
            width: width,
            height: height,
            patternUnits: "userSpaceOnUse",
            id: p.id,
            viewBox: [x, y, width, height].join(" ")
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
    elproto.marker = function (x, y, width, height, refX, refY) {
        var p = make("marker", getSomeDefs(this));
        if (x == null) {
            x = this.getBBox();
        }
        if (x && "x" in x) {
            y = x.y;
            width = x.width;
            height = x.height;
            refX = x.refX || x.cx;
            refY = x.refY || x.cy;
            x = x.x;
        }
        $(p.node, {
            viewBox: [x, y, width, height].join(S),
            markerWidth: width,
            markerHeight: height,
            orient: "auto",
            refX: refX || 0,
            refY: refY || 0,
            id: p.id
        });
        p.node.appendChild(this.node);
        return p;
    };
    // animation
    function slice(from, to, f) {
        return function (arr) {
            var res = arr.slice(from, to);
            if (res.length == 1) {
                res = res[0];
            }
            return f ? f(res) : res;
        };
    }
    var Animation = function (attr, ms, easing, callback) {
        if (typeof easing == "function" && !easing.length) {
            callback = easing;
            easing = mina.linear;
        }
        this.attr = attr;
        this.dur = ms;
        easing && (this.easing = easing);
        callback && (this.callback = callback);
    };
    // SIERRA All object methods should feature sample code. This is just one instance.
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
    Snap.animation = function (attr, ms, easing, callback) {
        return new Animation(attr, ms, easing, callback);
    };
    /*\
     * Element.inAnim
     [ method ]
     **
     * Returns a set of animations that may be able to manipulate the current element
     **
     = (object) in format:
     o {
     o     anim (object) animation object,
     o     curStatus (number) 0..1 — status of the animation: 0 — just started, 1 — just finished,
     o     status (function) gets or sets the status of the animation,
     o     stop (function) stops the animation
     o }
    \*/
    elproto.inAnim = function () {
        var el = this,
            res = [];
        for (var id in el.anims) if (el.anims[has](id)) {
            (function (a) {
                res.push({
                    anim: new Animation(a._attrs, a.dur, a.easing, a._callback),
                    curStatus: a.status(),
                    status: function (val) {
                        return a.status(val);
                    },
                    stop: function () {
                        a.stop();
                    }
                });
            }(el.anims[id]));
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
    Snap.animate = function (from, to, setter, ms, easing, callback) {
        if (typeof easing == "function" && !easing.length) {
            callback = easing;
            easing = mina.linear;
        }
        var now = mina.time(),
            anim = mina(from, to, now, now + ms, mina.time, setter, easing);
        callback && eve.once("mina.finish." + anim.id, callback);
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
        var anims = this.inAnim();
        for (var i = 0, ii = anims.length; i < ii; i++) {
            anims[i].stop();
        }
        return this;
    };
    // SIERRA Element.animate(): For _attrs_, clarify if they represent the destination values, and if the animation executes relative to the element's current attribute values.
    // SIERRA would a _custom_ animation function be an SVG keySplines value?
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
    elproto.animate = function (attrs, ms, easing, callback) {
        if (typeof easing == "function" && !easing.length) {
            callback = easing;
            easing = mina.linear;
        }
        if (attrs instanceof Animation) {
            callback = attrs.callback;
            easing = attrs.easing;
            ms = easing.dur;
            attrs = attrs.attr;
        }
        var fkeys = [], tkeys = [], keys = {}, from, to, f, eq,
            el = this;
        for (var key in attrs) if (attrs[has](key)) {
            if (el.equal) {
                eq = el.equal(key, Str(attrs[key]));
                from = eq.from;
                to = eq.to;
                f = eq.f;
            } else {
                from = +el.attr(key);
                to = +attrs[key];
            }
            var len = is(from, "array") ? from.length : 1;
            keys[key] = slice(fkeys.length, fkeys.length + len, f);
            fkeys = fkeys.concat(from);
            tkeys = tkeys.concat(to);
        }
        var now = mina.time(),
            anim = mina(fkeys, tkeys, now, now + ms, mina.time, function (val) {
                var attr = {};
                for (var key in keys) if (keys[has](key)) {
                    attr[key] = keys[key](val);
                }
                el.attr(attr);
            }, easing);
        el.anims[anim.id] = anim;
        anim._attrs = attrs;
        anim._callback = callback;
        eve.once("mina.finish." + anim.id, function () {
            delete el.anims[anim.id];
            callback && callback.call(el);
        });
        eve.once("mina.stop." + anim.id, function () {
            delete el.anims[anim.id];
        });
        return el;
    };
    var eldata = {};
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
        var data = eldata[this.id] = eldata[this.id] || {};
        if (arguments.length == 1) {
            if (Snap.is(key, "object")) {
                for (var i in key) if (key[has](i)) {
                    this.data(i, key[i]);
                }
                return this;
            }
            eve("snap.data.get." + this.id, this, data[key], key);
            return data[key];
        }
        data[key] = value;
        eve("snap.data.set." + this.id, this, value, key);
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
    // SIERRA Element.toString(): Recommend renaming this _outerSVG_ to keep it consistent with HTML & innerSVG, and also to avoid confusing it with what textContent() does. Cross-reference with innerSVG.
    /*\
     * Element.toString
     [ method ]
     **
     * Returns SVG code for the element, equivalent to HTML's `outerHTML`
     = (string) SVG code for the element
    \*/
    elproto.toString = toString(1);
    /*\
     * Element.innerSVG
     [ method ]
     **
     * Returns SVG code for the element's contents, equivalent to HTML's `innerHTML`
     = (string) SVG code for the element
    \*/
    elproto.innerSVG = toString();
    function toString(type) {
        return function () {
            var res = type ? "<" + this.type : "",
                attr = this.node.attributes,
                chld = this.node.childNodes;
            if (type) {
                for (var i = 0, ii = attr.length; i < ii; i++) {
                    res += " " + attr[i].name + '="' +
                            attr[i].value.replace(/"/g, '\\"') + '"';
                }
            }
            if (chld.length) {
                type && (res += ">");
                for (i = 0, ii = chld.length; i < ii; i++) {
                    if (chld[i].nodeType == 3) {
                        res += chld[i].nodeValue;
                    } else if (chld[i].nodeType == 1) {
                        res += wrap(chld[i]).toString();
                    }
                }
                type && (res += "</" + this.type + ">");
            } else {
                type && (res += "/>");
            }
            return res;
        };
    }
}(Element.prototype));
// SIERRA Snap.parse() accepts & returns a fragment, but there's no info on what it does in between. What if it doesn't parse?
/*\
 * Snap.parse
 [ method ]
 **
 * Parses SVG fragment and converts it into a @Fragment
 **
 - svg (string) SVG string
 = (Fragment) the @Fragment
\*/
Snap.parse = function (svg) {
    var f = glob.doc.createDocumentFragment(),
        pointer = f;
    eve.on("elemental.tag", function (data, extra, raw) {
        var tag = $(data);
        extra && $(tag, extra);
        pointer.appendChild(tag);
        pointer = tag;
    });
    eve.on("elemental.text", function (text) {
        pointer.appendChild(glob.doc.createTextNode(text));
    });
    eve.on("elemental./tag", function () {
        pointer = pointer.parentNode;
    });
    eve.on("elemental.eof", function () {
        eve.off("elemental.*");
        eve("snap.parsed", f);
    });
    elemental().parse(svg).end();
    return new Fragment(f);
};
function Fragment(frag) {
    this.node = frag;
}
/*\
 * Fragment.select
 [ method ]
 **
 * See @Element.select
\*/
Fragment.prototype.select = Element.prototype.select;
/*\
 * Fragment.selectAll
 [ method ]
 **
 * See @Element.selectAll
\*/
Fragment.prototype.selectAll = Element.prototype.selectAll;
// SIERRA Snap.fragment() could especially use a code example
/*\
 * Snap.fragment
 [ method ]
 **
 * Creates a DOM fragment from a given list of elements or strings
 **
 - varargs (…) SVG string
 = (Fragment) the @Fragment
\*/
Snap.fragment = function () {
    var args = Array.prototype.slice.call(arguments, 0),
        f = glob.doc.createDocumentFragment();
    for (var i = 0, ii = args.length; i < ii; i++) {
        var item = args[i];
        if (item.node && item.node.nodeType) {
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

function make(name, parent) {
    var res = $(name);
    parent.appendChild(res);
    var el = wrap(res);
    el.type = name;
    return el;
}
function Paper(w, h) {
    var res,
        desc,
        defs,
        proto = Paper.prototype;
    if (w && w.tagName == "svg") {
        if (w.snap in hub) {
            return hub[w.snap];
        }
        res = new Element(w);
        desc = w.getElementsByTagName("desc")[0];
        defs = w.getElementsByTagName("defs")[0];
        if (!desc) {
            desc = $("desc");
            desc.appendChild(glob.doc.createTextNode("Created with Snap"));
            res.node.appendChild(desc);
        }
        if (!defs) {
            defs = $("defs");
            res.node.appendChild(defs);
        }
        res.defs = defs;
        for (var key in proto) if (proto[has](key)) {
            res[key] = proto[key];
        }
        res.paper = res.root = res;
    } else {
        res = make("svg", glob.doc.body);
        $(res.node, {
            height: h,
            version: 1.1,
            width: w,
            xmlns: "http://www.w3.org/2000/svg"
        });
    }
    return res;
}
function wrap(dom) {
    if (!dom) {
        return dom;
    }
    if (dom instanceof Element || dom instanceof Fragment) {
        return dom;
    }
    if (dom.tagName == "svg") {
        return new Paper(dom);
    }
    return new Element(dom);
}
// gradients' helpers
function Gstops() {
    return this.selectAll("stop");
}
function GaddStop(color, offset) {
    var stop = $("stop"),
        attr = {
            offset: +offset + "%"
        };
    color = Snap.color(color);
    attr["stop-color"] = color.hex;
    if (color.opacity < 1) {
        attr["stop-opacity"] = color.opacity;
    }
    $(stop, attr);
    this.node.appendChild(stop);
    return this;
}
function GgetBBox() {
    if (this.type == "linearGradient") {
        var x1 = $(this.node, "x1") || 0,
            x2 = $(this.node, "x2") || 1,
            y1 = $(this.node, "y1") || 0,
            y2 = $(this.node, "y2") || 0;
        return Snap._.box(x1, y1, math.abs(x2 - x1), math.abs(y2 - y1));
    } else {
        var cx = this.node.cx || .5,
            cy = this.node.cy || .5,
            r = this.node.r || 0;
        return Snap._.box(cx - r, cy - r, r * 2, r * 2);
    }
}
function gradient(defs, str) {
    var grad = arrayFirstValue(eve("snap.util.grad.parse", null, str)),
        el;
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
            gradientUnits: "userSpaceOnUse"
        });
    }
    var stops = grad.stops,
        len = stops.length,
        start = 0,
        j = 0;
    function seed(i, end) {
        var step = (end - start) / (i - j);
        for (var k = j; k < i; k++) {
            stops[k].offset = +(+start + step * (k - j)).toFixed(2);
        }
        j = i;
        start = end;
    }
    len--;
    for (var i = 0; i < len; i++) if ("offset" in stops[i]) {
        seed(i, stops[i].offset);
    }
    stops[len].offset = stops[len].offset || 100;
    seed(len, stops[len].offset);
    for (i = 0; i <= len; i++) {
        var stop = stops[i];
        el.addStop(stop.color, stop.offset);
    }
    return el;
}
function gradientLinear(defs, x1, y1, x2, y2) {
    var el = make("linearGradient", defs);
    el.stops = Gstops;
    el.addStop = GaddStop;
    el.getBBox = GgetBBox;
    if (x1 != null) {
        $(el.node, {
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2
        });
    }
    return el;
}
function gradientRadial(defs, cx, cy, r, fx, fy) {
    var el = make("radialGradient", defs);
    el.stops = Gstops;
    el.addStop = GaddStop;
    el.getBBox = GgetBBox;
    if (cx != null) {
        $(el.node, {
            cx: cx,
            cy: cy,
            r: r
        });
    }
    if (fx != null && fy != null) {
        $(el.node, {
            fx: fx,
            fy: fy
        });
    }
    return el;
}
// Paper prototype methods
(function (proto) {
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
    \*/
    proto.el = function (name, attr) {
        return make(name, this.node).attr(attr);
    };
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
    proto.rect = function (x, y, w, h, rx, ry) {
        var el = make("rect", this.node);
        if (ry == null) {
            ry = rx;
        }
        if (is(x, "object") && "x" in x) {
            el.attr(x);
        } else if (x != null) {
            el.attr({
                x: x,
                y: y,
                width: w,
                height: h
            });
            if (rx != null) {
                el.attr({
                    rx: rx,
                    ry: ry
                });
            }
        }
        return el;
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
    proto.circle = function (cx, cy, r) {
        var el = make("circle", this.node);
        if (is(cx, "object") && "cx" in cx) {
            el.attr(cx);
        } else if (cx != null) {
            el.attr({
                cx: cx,
                cy: cy,
                r: r
            });
        }
        return el;
    };

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
     = (object) Raphaël element object with type `image`
     **
     > Usage
     | var c = paper.image("apple.png", 10, 10, 80, 80);
    \*/
    proto.image = function (src, x, y, width, height) {
        var el = make("image", this.node);
        if (is(src, "object") && "src" in src) {
            el.attr(src);
        } else if (src != null) {
            var set = {
                "xlink:href": src,
                preserveAspectRatio: "none"
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
                    $(el.node, {
                        width: this.offsetWidth,
                        height: this.offsetHeight
                    });
                });
            }
            $(el.node, set);
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
    proto.ellipse = function (cx, cy, rx, ry) {
        var el = make("ellipse", this.node);
        if (is(cx, "object") && "cx" in cx) {
            el.attr(cx);
        } else if (cx != null) {
            el.attr({
                cx: cx,
                cy: cy,
                rx: rx,
                ry: ry
            });
        }
        return el;
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
        var el = make("path", this.node);
        if (is(d, "object") && !is(d, "array")) {
            el.attr(d);
        } else if (d) {
            el.attr({
                d: d
            });
        }
        return el;
    };
// SIERRA Paper.g(): Don't understand the code comment about the order being _different._ Wouldn't it be a rect followed by a circle?
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
    proto.group = proto.g = function (first) {
        var el = make("g", this.node);
        el.add = add2group;
        for (var method in proto) if (proto[has](method)) {
            el[method] = proto[method];
        }
        if (arguments.length == 1 && first && !first.type) {
            el.attr(first);
        } else if (arguments.length) {
            el.add(Array.prototype.slice.call(arguments, 0));
        }
        return el;
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
    \*/
    proto.text = function (x, y, text) {
        var el = make("text", this.node);
        if (is(x, "object")) {
            el.attr(x);
        } else if (x != null) {
            el.attr({
                x: x,
                y: y,
                text: text || ""
            });
        }
        return el;
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
        var el = make("line", this.node);
        if (is(x1, "object")) {
            el.attr(x1);
        } else if (x1 != null) {
            el.attr({
                x1: x1,
                x2: x2,
                y1: y1,
                y2: y2
            });
        }
        return el;
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
    proto.polyline = function (points) {
        if (arguments.length > 1) {
            points = Array.prototype.slice.call(arguments, 0);
        }
        var el = make("polyline", this.node);
        if (is(points, "object") && !is(points, "array")) {
            el.attr(points);
        } else if (points != null) {
            el.attr({
                points: points
            });
        }
        return el;
    };
    /*\
     * Paper.polygon
     [ method ]
     **
     * Draws a polygon. See @Paper.polyline
    \*/
    proto.polygon = function (points) {
        if (arguments.length > 1) {
            points = Array.prototype.slice.call(arguments, 0);
        }
        var el = make("polygon", this.node);
        if (is(points, "object") && !is(points, "array")) {
            el.attr(points);
        } else if (points != null) {
            el.attr({
                points: points
            });
        }
        return el;
    };
    // gradients
    (function () {
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
         | var g = paper.gradient("L(0, 0, 100, 100)#000-#f00:25%-#fff");
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
            var f = glob.doc.createDocumentFragment(),
                d = glob.doc.createElement("div"),
                svg = this.node.cloneNode(true),
                res;
            f.appendChild(d);
            d.appendChild(svg);
            $(svg, {xmlns: "http://www.w3.org/2000/svg"});
            res = d.innerHTML;
            f.removeChild(f.firstChild);
            return res;
        };
        /*\
         * Paper.clear
         [ method ]
         **
         * Removes all child nodes of the paper, except <defs>.
        \*/
        proto.clear = function () {
            var node = this.node.firstChild,
                next;
            while (node) {
                next = node.nextSibling;
                if (node.tagName != "defs") {
                    node.parentNode.removeChild(node);
                }
                node = next;
            }
        };
    }());
}(Paper.prototype));

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
Snap.ajax = function (url, postData, callback, scope){
    var req = new XMLHttpRequest,
        id = ID();
    if (req) {
        if (is(postData, "function")) {
            scope = callback;
            callback = postData;
            postData = null;
        } else if (is(postData, "object")) {
            var pd = [];
            for (var key in postData) if (postData.hasOwnProperty(key)) {
                pd.push(encodeURIComponent(key) + "=" + encodeURIComponent(postData[key]));
            }
            postData = pd.join("&");
        }
        req.open((postData ? "POST" : "GET"), url, true);
        req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        if (postData) {
            req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        }
        if (callback) {
            eve.once("snap.ajax." + id + ".0", callback);
            eve.once("snap.ajax." + id + ".200", callback);
            eve.once("snap.ajax." + id + ".304", callback);
        }
        req.onreadystatechange = function() {
            if (req.readyState != 4) return;
            eve("snap.ajax." + id + "." + req.status, scope, req);
        };
        if (req.readyState == 4) {
            return req;
        }
        req.send(postData);
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
\*/
Snap.load = function (url, callback, scope) {
    Snap.ajax(url, function (req) {
        var f = Snap.parse(req.responseText);
        scope ? callback.call(scope, f) : callback(f);
    });
};

// Attributes event handlers
eve.on("snap.util.attr.mask", function (value) {
    if (value instanceof Element || value instanceof Fragment) {
        eve.stop();
        if (value instanceof Fragment && value.node.childNodes.length == 1) {
            value = value.node.firstChild;
            getSomeDefs(this).appendChild(value);
            value = wrap(value);
        }
        if (value.type == "mask") {
            var mask = value;
        } else {
            mask = make("mask", getSomeDefs(this));
            mask.node.appendChild(value.node);
            !mask.node.id && $(mask.node, {
                id: mask.id
            });
        }
        $(this.node, {
            mask: "url(#" + mask.id + ")"
        });
    }
});
(function (clipIt) {
    eve.on("snap.util.attr.clip", clipIt);
    eve.on("snap.util.attr.clip-path", clipIt);
    eve.on("snap.util.attr.clipPath", clipIt);
}(function (value) {
    if (value instanceof Element || value instanceof Fragment) {
        eve.stop();
        if (value.type == "clipPath") {
            var clip = value;
        } else {
            clip = make("clipPath", getSomeDefs(this));
            clip.node.appendChild(value.node);
            !clip.node.id && $(clip.node, {
                id: clip.id
            });
        }
        $(this.node, {
            "clip-path": "url(#" + clip.id + ")"
        });
    }
}));
function fillStroke(name) {
    return function (value) {
        eve.stop();
        if (value instanceof Fragment && value.node.childNodes.length == 1 &&
            (value.node.firstChild.tagName == "radialGradient" ||
            value.node.firstChild.tagName == "linearGradient" ||
            value.node.firstChild.tagName == "pattern")) {
            value = value.node.firstChild;
            getSomeDefs(this).appendChild(value);
            value = wrap(value);
        }
        if (value instanceof Element) {
            if (value.type == "radialGradient" || value.type == "linearGradient"
               || value.type == "pattern") {
                if (!value.node.id) {
                    $(value.node, {
                        id: value.id
                    });
                }
                var fill = "url(#" + value.node.id + ")";
            } else {
                fill = value.attr(name);
            }
        } else {
            fill = Snap.color(value);
            if (fill.error) {
                var grad = gradient(getSomeDefs(this), value);
                if (grad) {
                    if (!grad.node.id) {
                        $(grad.node, {
                            id: grad.id
                        });
                    }
                    fill = "url(#" + grad.node.id + ")";
                } else {
                    fill = value;
                }
            } else {
                fill = Str(fill);
            }
        }
        var attrs = {};
        attrs[name] = fill;
        $(this.node, attrs);
        this.node.style[name] = E;
    };
}
eve.on("snap.util.attr.fill", fillStroke("fill"));
eve.on("snap.util.attr.stroke", fillStroke("stroke"));
var gradrg = /^([lr])(?:\(([^)]*)\))?(.*)$/i;
eve.on("snap.util.grad.parse", function parseGrad(string) {
    string = Str(string);
    var tokens = string.match(gradrg);
    if (!tokens) {
        return null;
    }
    var type = tokens[1],
        params = tokens[2],
        stops = tokens[3];
    params = params.split(/\s*,\s*/).map(function (el) {
        return +el == el ? +el : el;
    });
    if (params.length == 1 && params[0] == 0) {
        params = [];
    }
    stops = stops.split("-");
    stops = stops.map(function (el) {
        el = el.split(":");
        var out = {
            color: el[0]
        };
        if (el[1]) {
            out.offset = el[1];
        }
        return out;
    });
    return {
        type: type,
        params: params,
        stops: stops
    };
});

eve.on("snap.util.attr.d", function (value) {
    eve.stop();
    if (is(value, "array") && is(value[0], "array")) {
        value = Snap.path.toString.call(value);
    }
    value = Str(value);
    if (value.match(/[ruo]/i)) {
        value = Snap.path.toAbsolute(value);
    }
    $(this.node, {d: value});
})(-1);
eve.on("snap.util.attr.#text", function (value) {
    eve.stop();
    value = Str(value);
    var txt = glob.doc.createTextNode(value);
    while (this.node.firstChild) {
        this.node.removeChild(this.node.firstChild);
    }
    this.node.appendChild(txt);
})(-1);
eve.on("snap.util.attr.path", function (value) {
    eve.stop();
    this.attr({d: value});
})(-1);
eve.on("snap.util.attr.viewBox", function (value) {
    var vb;
    if (is(value, "object") && "x" in value) {
        vb = [value.x, value.y, value.width, value.height].join(" ");
    } else if (is(value, "array")) {
        vb = value.join(" ");
    } else {
        vb = value;
    }
    $(this.node, {
        viewBox: vb
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
            ry: value
        });
    }
})(-1);
eve.on("snap.util.attr.text", function (value) {
    if (this.type == "text") {
        var i = 0,
            node = this.node,
            tuner = function (chunk) {
                var out = $("tspan");
                if (is(chunk, "array")) {
                    for (var i = 0; i < chunk.length; i++) {
                        out.appendChild(tuner(chunk[i]));
                    }
                } else {
                    out.appendChild(glob.doc.createTextNode(chunk));
                }
                out.normalize && out.normalize();
                return out;
            };
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
        var tuned = tuner(value);
        while (tuned.firstChild) {
            node.appendChild(tuned.firstChild);
        }
    }
    eve.stop();
})(-1);
// default
var availableAttributes = {
    rect: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        rx: 0,
        ry: 0,
        "class": 0
    },
    circle: {
        cx: 0,
        cy: 0,
        r: 0,
        "class": 0
    },
    ellipse: {
        cx: 0,
        cy: 0,
        rx: 0,
        ry: 0,
        "class": 0
    },
    line: {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
        "class": 0
    },
    polyline: {
        points: "",
        "class": 0
    },
    polygon: {
        points: "",
        "class": 0
    },
    text: {
        x: 0,
        y: 0,
        dx: 0,
        dy: 0,
        rotate: 0,
        textLength: 0,
        lengthAdjust: 0,
        "class": 0
    },
    tspan: {
        x: 0,
        y: 0,
        dx: 0,
        dy: 0,
        rotate: 0,
        textLength: 0,
        lengthAdjust: 0,
        "class": 0
    },
    textPath: {
        "xlink:href": 0,
        startOffset: 0,
        method: 0,
        spacing: 0,
        "class": 0
    },
    marker: {
        viewBox: 0,
        preserveAspectRatio: 0,
        refX: 0,
        refY: 0,
        markerUnits: 0,
        markerWidth: 0,
        markerHeight: 0,
        orient: 0,
        "class": 0
    },
    use: {
        "class": 0,
        externalResourcesRequired: 0,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        "xlink:href": 0
    },
    linearGradient: {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
        gradientUnits: 0,
        gradientTransform: 0,
        spreadMethod: 0,
        "xlink:href": 0,
        "class": 0
    },
    radialGradient: {
        cx: 0,
        cy: 0,
        r: 0,
        fx: 0,
        fy: 0,
        gradientUnits: 0,
        gradientTransform: 0,
        spreadMethod: 0,
        "xlink:href": 0,
        "class": 0
    },
    stop: {
        offset: 0,
        "class": 0
    },
    pattern: {
        viewBox: 0,
        preserveAspectRatio: 0,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        patternUnits: 0,
        patternContentUnits: 0,
        patternTransform: 0,
        "xlink:href": 0,
        "class": 0
    },
    clipPath: {
        transform: 0,
        clipPathUnits: 0,
        "class": 0
    },
    mask: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        maskUnits: 0,
        maskContentUnits: 0,
        "class": 0
    },
    image: {
        preserveAspectRatio: 0,
        transform: 0,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        "xlink:href": 0,
        "class": 0
    },
    path: {
        d: "",
        "class": 0
    },
    g: {
        "class": 0
    },
    feDistantLight: {
        azimuth: 0,
        elevation: 0
    },
    fePointLight: {
        x: 0,
        y: 0,
        z: 0
    },
    feSpotLight: {
        x: 0,
        y: 0,
        z: 0,
        pointsAtX: 0,
        pointsAtY: 0,
        pointsAtZ: 0,
        specularExponent: 0,
        limitingConeAngle: 0
    },
    feBlend: {
        height: 0,
        result: 0,
        width: 0,
        x: 0,
        y: 0,
        "class": 0,
        style: 0,
        "in": 0,
        in2: 0,
        mode: 0
    },
    feColorMatrix: {
        height: 0,
        result: 0,
        width: 0,
        x: 0,
        y: 0,
        "class": 0,
        style: 0,
        "in": 0,
        type: 0,
        values: 0
    },
    feComponentTransfer: {
        height: 0,
        result: 0,
        width: 0,
        x: 0,
        y: 0,
        "class": 0,
        style: 0,
        "in": 0
    },
    feComposite: {
        height: 0,
        result: 0,
        width: 0,
        x: 0,
        y: 0,
        "class": 0,
        style: 0,
        "in": 0,
        in2: 0,
        operator: 0,
        k1: 0,
        k2: 0,
        k3: 0,
        k4: 0
    },
    feConvolveMatrix: {
        height: 0,
        result: 0,
        width: 0,
        x: 0,
        y: 0,
        "class": 0,
        style: 0,
        "in": 0,
        order: 0,
        kernelMatrix: 0,
        divisor: 0,
        bias: 0,
        targetX: 0,
        targetY: 0,
        edgeMode: 0,
        kernelUnitLength: 0,
        preserveAlpha: 0
    },
    feDiffuseLighting: {
        height: 0,
        result: 0,
        width: 0,
        x: 0,
        y: 0,
        "class": 0,
        style: 0,
        "in": 0,
        surfaceScale: 0,
        diffuseConstant: 0,
        kernelUnitLength: 0
    },
    feDisplacementMap: {
        height: 0,
        result: 0,
        width: 0,
        x: 0,
        y: 0,
        "class": 0,
        style: 0,
        "in": 0,
        in2: 0,
        scale: 0,
        xChannelSelector: 0,
        yChannelSelector: 0
    },
    feFlood: {
        height: 0,
        result: 0,
        width: 0,
        x: 0,
        y: 0,
        "class": 0,
        style: 0,
        "flood-color": 0,
        "flood-opacity": 0
    },
    feGaussianBlur: {
        height: 0,
        result: 0,
        width: 0,
        x: 0,
        y: 0,
        "class": 0,
        style: 0,
        "in": 0,
        stdDeviation: 0
    },
    feImage : {
        height: 0,
        result: 0,
        width: 0,
        x: 0,
        y: 0,
        "class": 0,
        style: 0,
        externalResourcesRequired: 0,
        preserveAspectRatio: 0,
        "xlink:href": 0
    },
    feMerge: {
        height: 0,
        result: 0,
        width: 0,
        x: 0,
        y: 0,
        "class": 0,
        style: 0
    },
    feMergeNode: {
        "in": 0
    },
    feMorphology: {
        height: 0,
        result: 0,
        width: 0,
        x: 0,
        y: 0,
        "class": 0,
        style: 0,
        "in": 0,
        operator: 0,
        radius: 0
    },
    feOffset: {
        height: 0,
        result: 0,
        width: 0,
        x: 0,
        y: 0,
        "class": 0,
        style: 0,
        "in": 0,
        dx: 0,
        dy: 0
    },
    feSpecularLighting: {
        height: 0,
        result: 0,
        width: 0,
        x: 0,
        y: 0,
        "class": 0,
        style: 0,
        "in": 0,
        surfaceScale: 0,
        specularConstant: 0,
        specularExponent: 0,
        kernelUnitLength: 0
    },
    feTile: {
        height: 0,
        result: 0,
        width: 0,
        x: 0,
        y: 0,
        "class": 0,
        style: 0,
        "in": 0
    },
    feTurbulence: {
        height: 0,
        result: 0,
        width: 0,
        x: 0,
        y: 0,
        "class": 0,
        style: 0,
        baseFrequency: 0,
        numOctaves: 0,
        seed: 0,
        stitchTiles: 0,
        type: 0
    }
};
availableAttributes.feFuncR = availableAttributes.feFuncG = availableAttributes.feFuncB = availableAttributes.feFuncA = {
    type: 0,
    tableValues: 0,
    slope: 0,
    intercept: 0,
    amplitude: 0,
    exponent: 0,
    offset: 0
};
eve.on("snap.util.attr", function (value) {
    var att = eve.nt();
    att = att.substring(att.lastIndexOf(".") + 1);
    var style = att.replace(/-(\w)/gi, function (all, letter) {
        return letter.toUpperCase();
    });
    if (availableAttributes[has](this.type) && availableAttributes[this.type][has](att)) {
        value == null ? this.node.removeAttribute(att) : this.node.setAttribute(att, value);
    } else {
        this.node.style[style] = value == null ? E : value;
    }
});
eve.on("snap.util.getattr.transform", function () {
    eve.stop();
    return this.transform();
})(-1);
// Markers
(function () {
    function getter(end) {
        return function () {
            eve.stop();
            var style = glob.doc.defaultView.getComputedStyle(this.node, null).getPropertyValue("marker-" + end);
            if (style == "none") {
                return style;
            } else {
                return Snap(glob.doc.getElementById(style.match(reURLValue)[1]));
            }
        };
    }
    function setter(end) {
        return function (value) {
            eve.stop();
            var name = "marker" + end.charAt(0).toUpperCase() + end.substring(1);
            if (value == "" || !value) {
                this.node.style[name] = "none";
                return;
            }
            if (value.type == "marker") {
                var id = value.node.id;
                if (!id) {
                    $(value.node, {id: value.id});
                }
                this.node.style[name] = "url(#" + id + ")";
                return;
            }
        };
    }
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
}());
eve.on("snap.util.getattr.r", function () {
    if (this.type == "rect" && $(this.node, "rx") == $(this.node, "ry")) {
        eve.stop();
        return $(this.node, "rx");
    }
})(-1);
function textExtract(node) {
    var out = [];
    var children = node.childNodes;
    for (var i = 0, ii = children.length; i < ii; i++) {
        var chi = children[i];
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
}
eve.on("snap.util.getattr.text", function () {
    if (this.type == "text" || this.type == "tspan") {
        eve.stop();
        var out = textExtract(this.node);
        return out.length == 1 ? out[0] : out;
    }
})(-1);
eve.on("snap.util.getattr.#text", function () {
    return this.node.textContent;
})(-1);
eve.on("snap.util.getattr.viewBox", function () {
    eve.stop();
    var vb = $(this.node, "viewBox").split(separator);
    return Snap._.box(+vb[0], +vb[1], +vb[2], +vb[3]);
    // TODO: investigate why I need to z-index it
})(-1);
eve.on("snap.util.getattr.points", function () {
    var p = $(this.node, "points");
    eve.stop();
    return p.split(separator);
});
eve.on("snap.util.getattr.path", function () {
    var p = $(this.node, "d");
    eve.stop();
    return p;
});
// default
eve.on("snap.util.getattr", function () {
    var att = eve.nt();
    att = att.substring(att.lastIndexOf(".") + 1);
    if (availableAttributes[has](this.type) && availableAttributes[this.type][has](att)) {
        return this.node.getAttribute(att);
    } else {
        return glob.doc.defaultView.getComputedStyle(this.node, null).getPropertyValue(att);
    }
});
Snap.plugin = function (f) {
    f(Snap, Element, Paper, glob);
};
glob.win.Snap = Snap;
return Snap;
}());