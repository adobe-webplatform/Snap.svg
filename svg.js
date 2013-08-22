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

var Savage = (function () {
Savage.version = "0.0.1";
/*\
 * Savage
 [ method ]
 **
 * Creates drawing surface or wraps existing SVG element.
 **
 > Parameters
 **
 - width (number|string) width of surface
 - height (number|string) height of surface
 * or
 - dom (SVGElement) element to be wrapped into Savage structure
 * or
 - query (string) CSS query selector
 = (object) @Element
\*/
function Savage(w, h) {
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
Savage.toString = function () {
    return "Savage v" + this.version;
};
Savage._ = {};
var glob = {
    win: window,
    doc: window.document
};
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
    colourRegExp = /^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgba?\(\s*([\d\.]+%?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+%?)?)\s*\)|hsba?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?)%?\s*\)|hsla?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?)%?\s*\))\s*$/i,
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
Savage._.$ = $;
Savage._.id = ID;
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
 * Savage.format
 [ method ]
 **
 * Replaces construction of type “`{<name>}`” to the corresponding argument.
 **
 > Parameters
 **
 - token (string) string to format
 - json (object) object which properties will be used as a replacement
 = (string) formated string
 > Usage
 | // this will draw a rectangular shape equivalent to "M10,20h40v50h-40z"
 | paper.path(Savage.format("M{x},{y}h{dim.width}v{dim.height}h{dim['negative width']}z", {
 |     x: 10,
 |     y: 20,
 |     dim: {
 |         width: 40,
 |         height: 50,
 |         "negative width": -40
 |     }
 | }));
\*/
Savage.format = (function () {
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
Savage._.clone = clone;
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
Savage._.cacher = cacher;
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
 * Savage.rad
 [ method ]
 **
 * Transform angle to radians
 > Parameters
 - deg (number) angle in degrees
 = (number) angle in radians.
\*/
Savage.rad = rad;
/*\
 * Savage.deg
 [ method ]
 **
 * Transform angle to degrees
 > Parameters
 - deg (number) angle in radians
 = (number) angle in degrees.
\*/
Savage.deg = deg;
/*\
 * Savage.is
 [ method ]
 **
 * Handfull replacement for `typeof` operator.
 > Parameters
 - o (…) any object or primitive
 - type (string) name of the type, i.e. “string”, “function”, “number”, etc.
 = (boolean) is given value is of given type
\*/
Savage.is = is;
/*\
 * Savage.snapTo
 [ method ]
 **
 * Snaps given value to given grid.
 > Parameters
 - values (array|number) given array of values or step of the grid
 - value (number) value to adjust
 - tolerance (number) #optional tolerance for snapping. Default is `10`.
 = (number) adjusted value.
\*/
Savage.snapTo = function (values, value, tolerance) {
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
     * Adds given matrix to existing one.
     > Parameters
     - a (number)
     - b (number)
     - c (number)
     - d (number)
     - e (number)
     - f (number)
     or
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
     * Returns inverted version of the matrix
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
     * Returns copy of the matrix
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
     > Parameters
     - x (number)
     - y (number)
    \*/
    matrixproto.translate = function (x, y) {
        return this.add(1, 0, 0, 1, x, y);
    };
    /*\
     * Matrix.scale
     [ method ]
     **
     * Scales the matrix
     > Parameters
     - x (number)
     - y (number) #optional
     - cx (number) #optional
     - cy (number) #optional
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
     > Parameters
     - a (number)
     - x (number)
     - y (number)
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
     * Return x coordinate for given point after transformation described by the matrix. See also @Matrix.y
     > Parameters
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
     * Return y coordinate for given point after transformation described by the matrix. See also @Matrix.x
     > Parameters
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
    /*\
     * Matrix.toTransformString
     [ method ]
     **
     * Return transform string that represents given matrix
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
/*\
 * Savage.Matrix
 [ method ]
 **
 * Utility method
 **
 * Returns matrix based on given parameters.
 > Parameters
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
Savage.Matrix = Matrix;
// Colour
/*\
 * Savage.getRGB
 [ method ]
 **
 * Parses colour string as RGB object
 > Parameters
 - colour (string) colour string in one of formats:
 # <ul>
 #     <li>Colour name (“<code>red</code>”, “<code>green</code>”, “<code>cornflowerblue</code>”, etc)</li>
 #     <li>#••• — shortened HTML colour: (“<code>#000</code>”, “<code>#fc0</code>”, etc)</li>
 #     <li>#•••••• — full length HTML colour: (“<code>#000000</code>”, “<code>#bd2300</code>”)</li>
 #     <li>rgb(•••, •••, •••) — red, green and blue channels values: (“<code>rgb(200,&nbsp;100,&nbsp;0)</code>”)</li>
 #     <li>rgb(•••%, •••%, •••%) — same as above, but in %: (“<code>rgb(100%,&nbsp;175%,&nbsp;0%)</code>”)</li>
 #     <li>hsb(•••, •••, •••) — hue, saturation and brightness values: (“<code>hsb(0.5,&nbsp;0.25,&nbsp;1)</code>”)</li>
 #     <li>hsb(•••%, •••%, •••%) — same as above, but in %</li>
 #     <li>hsl(•••, •••, •••) — same as hsb</li>
 #     <li>hsl(•••%, •••%, •••%) — same as hsb</li>
 # </ul>
 = (object) RGB object in format:
 o {
 o     r (number) red,
 o     g (number) green,
 o     b (number) blue
 o     hex (string) color in HTML/CSS format: #••••••,
 o     error (boolean) true if string cant be parsed
 o }
\*/
Savage.getRGB = cacher(function (colour) {
    if (!colour || !!((colour = Str(colour)).indexOf("-") + 1)) {
        return {r: -1, g: -1, b: -1, hex: "none", error: 1, toString: rgbtoString};
    }
    if (colour == "none") {
        return {r: -1, g: -1, b: -1, hex: "none", toString: rgbtoString};
    }
    !(hsrg[has](colour.toLowerCase().substring(0, 2)) || colour.charAt() == "#") && (colour = toHex(colour));
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
            values[0].slice(-1) == "%" && (red *= 2.55);
            green = toFloat(values[1]);
            values[1].slice(-1) == "%" && (green *= 2.55);
            blue = toFloat(values[2]);
            values[2].slice(-1) == "%" && (blue *= 2.55);
            (values[0].slice(-3) == "deg" || values[0].slice(-1) == "\xb0") && (red /= 360);
            rgb[1].toLowerCase().slice(0, 4) == "hsba" && (opacity = toFloat(values[3]));
            values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
            return Savage.hsb2rgb(red, green, blue, opacity);
        }
        if (rgb[6]) {
            values = rgb[6].split(commaSpaces);
            red = toFloat(values[0]);
            values[0].slice(-1) == "%" && (red *= 2.55);
            green = toFloat(values[1]);
            values[1].slice(-1) == "%" && (green *= 2.55);
            blue = toFloat(values[2]);
            values[2].slice(-1) == "%" && (blue *= 2.55);
            (values[0].slice(-3) == "deg" || values[0].slice(-1) == "\xb0") && (red /= 360);
            rgb[1].toLowerCase().slice(0, 4) == "hsla" && (opacity = toFloat(values[3]));
            values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
            return Savage.hsl2rgb(red, green, blue, opacity);
        }
        rgb = {r: red, g: green, b: blue, toString: rgbtoString};
        rgb.hex = "#" + (16777216 | blue | (green << 8) | (red << 16)).toString(16).slice(1);
        rgb.opacity = is(opacity, "finite") ? opacity : 1;
        return rgb;
    }
    return {r: -1, g: -1, b: -1, hex: "none", error: 1, toString: rgbtoString};
}, Savage);
/*\
 * Savage.hsb
 [ method ]
 **
 * Converts HSB values to hex representation of the colour.
 > Parameters
 - h (number) hue
 - s (number) saturation
 - b (number) value or brightness
 = (string) hex representation of the colour.
\*/
Savage.hsb = cacher(function (h, s, b) {
    return Savage.hsb2rgb(h, s, b).hex;
});
/*\
 * Savage.hsl
 [ method ]
 **
 * Converts HSL values to hex representation of the colour.
 > Parameters
 - h (number) hue
 - s (number) saturation
 - l (number) luminosity
 = (string) hex representation of the colour.
\*/
Savage.hsl = cacher(function (h, s, l) {
    return Savage.hsl2rgb(h, s, l).hex;
});
/*\
 * Savage.rgb
 [ method ]
 **
 * Converts RGB values to hex representation of the colour.
 > Parameters
 - r (number) red
 - g (number) green
 - b (number) blue
 = (string) hex representation of the colour.
\*/
Savage.rgb = cacher(function (r, g, b, o) {
    if (is(o, "finite")) {
        var round = math.round;
        return "rgba(" + [round(r), round(g), round(b), +o.toFixed(2)] + ")";
    }
    return "#" + (16777216 | b | (g << 8) | (r << 16)).toString(16).slice(1);
});
var toHex = function (color) {
    var i = glob.doc.getElementsByTagName("head")[0];
    toHex = cacher(function (color) {
        i.style.color = "inherit";
        i.style.color = color;
        var out = glob.doc.defaultView.getComputedStyle(i, E).getPropertyValue("color");
        return out == "inherit" ? null : out;
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
        var clr = Savage.getRGB(r);
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
        hex: Savage.rgb(r, g, b),
        toString: rgbtoString
    };
    is(o, "finite") && (rgb.opacity = o);
    return rgb;
};

/*\
 * Savage.color
 [ method ]
 **
 * Parses the color string and returns object with all values for the given color.
 > Parameters
 - clr (string) color string in one of the supported formats (see @Savage.getRGB)
 = (object) Combined RGB & HSB object in format:
 o {
 o     r (number) red,
 o     g (number) green,
 o     b (number) blue,
 o     hex (string) color in HTML/CSS format: #••••••,
 o     error (boolean) `true` if string cant be parsed,
 o     h (number) hue,
 o     s (number) saturation,
 o     v (number) value (brightness),
 o     l (number) lightness
 o }
\*/
Savage.color = function (clr) {
    var rgb;
    if (is(clr, "object") && "h" in clr && "s" in clr && "b" in clr) {
        rgb = Savage.hsb2rgb(clr);
        clr.r = rgb.r;
        clr.g = rgb.g;
        clr.b = rgb.b;
        clr.opacity = 1;
        clr.hex = rgb.hex;
    } else if (is(clr, "object") && "h" in clr && "s" in clr && "l" in clr) {
        rgb = Savage.hsl2rgb(clr);
        clr.r = rgb.r;
        clr.g = rgb.g;
        clr.b = rgb.b;
        clr.opacity = 1;
        clr.hex = rgb.hex;
    } else {
        if (is(clr, "string")) {
            clr = Savage.getRGB(clr);
        }
        if (is(clr, "object") && "r" in clr && "g" in clr && "b" in clr) {
            rgb = Savage.rgb2hsl(clr);
            clr.h = rgb.h;
            clr.s = rgb.s;
            clr.l = rgb.l;
            rgb = Savage.rgb2hsb(clr);
            clr.v = rgb.b;
        } else {
            clr = {hex: "none"};
            clr.r = clr.g = clr.b = clr.h = clr.s = clr.v = clr.l = -1;
        }
    }
    clr.toString = rgbtoString;
    return clr;
};
/*\
 * Savage.hsb2rgb
 [ method ]
 **
 * Converts HSB values to RGB object.
 > Parameters
 - h (number) hue
 - s (number) saturation
 - v (number) value or brightness
 = (object) RGB object in format:
 o {
 o     r (number) red,
 o     g (number) green,
 o     b (number) blue,
 o     hex (string) color in HTML/CSS format: #••••••
 o }
\*/
Savage.hsb2rgb = function (h, s, v, o) {
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
 * Savage.hsl2rgb
 [ method ]
 **
 * Converts HSL values to RGB object.
 > Parameters
 - h (number) hue
 - s (number) saturation
 - l (number) luminosity
 = (object) RGB object in format:
 o {
 o     r (number) red,
 o     g (number) green,
 o     b (number) blue,
 o     hex (string) color in HTML/CSS format: #••••••
 o }
\*/
Savage.hsl2rgb = function (h, s, l, o) {
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
 * Savage.rgb2hsb
 [ method ]
 **
 * Converts RGB values to HSB object.
 > Parameters
 - r (number) red
 - g (number) green
 - b (number) blue
 = (object) HSB object in format:
 o {
 o     h (number) hue
 o     s (number) saturation
 o     b (number) brightness
 o }
\*/
Savage.rgb2hsb = function (r, g, b) {
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
 * Savage.rgb2hsl
 [ method ]
 **
 * Converts RGB values to HSL object.
 > Parameters
 - r (number) red
 - g (number) green
 - b (number) blue
 = (object) HSL object in format:
 o {
 o     h (number) hue
 o     s (number) saturation
 o     l (number) luminosity
 o }
\*/
Savage.rgb2hsl = function (r, g, b) {
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
/*\
 * Savage.parsePathString
 [ method ]
 **
 * Utility method
 **
 * Parses given path string into an array of arrays of path segments.
 > Parameters
 - pathString (string|array) path string or array of segments (in the last case it will be returned straight away)
 = (array) array of segments.
\*/
Savage.parsePathString = function (pathString) {
    if (!pathString) {
        return null;
    }
    var pth = Savage.path(pathString);
    if (pth.arr) {
        return Savage.path.clone(pth.arr);
    }
    
    var paramCounts = {a: 7, c: 6, o: 2, h: 1, l: 2, m: 2, r: 4, q: 4, s: 4, t: 2, v: 1, u: 3, z: 0},
        data = [];
    if (is(pathString, "array") && is(pathString[0], "array")) { // rough assumption
        data = Savage.path.clone(pathString);
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
    data.toString = Savage.path.toString;
    pth.arr = Savage.path.clone(data);
    return data;
};
/*\
 * Savage.parseTransformString
 [ method ]
 **
 * Utility method
 **
 * Parses given path string into an array of transformations.
 > Parameters
 - TString (string|array) transform string or array of transformations (in the last case it will be returned straight away)
 = (array) array of transformations.
\*/
var parseTransformString = Savage.parseTransformString = function (TString) {
    if (!TString) {
        return null;
    }
    var paramCounts = {r: 3, s: 4, t: 2, m: 6},
        data = [];
    if (is(TString, "array") && is(TString[0], "array")) { // rough assumption
        data = Savage.path.clone(TString);
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
    data.toString = Savage.path.toString;
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
    } else if (!rgTransform.test(tstr)) {
        tstr = svgTransform2string(tstr);
    } else {
        tstr = Str(tstr).replace(/\.{3}|\u2026/g, el._.transform || E);
    }
    var tdata = parseTransformString(tstr),
        deg = 0,
        dx = 0,
        dy = 0,
        sx = 1,
        sy = 1,
        _ = el._,
        m = new Matrix;
    _.transform = tdata || [];
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
                    bb = bb || el.getBBox(1);
                    m.rotate(t[1], bb.x + bb.width / 2, bb.y + bb.height / 2);
                    deg += t[1];
                } else if (tlen == 4) {
                    if (absolute) {
                        x2 = inver.x(t[2], t[3]);
                        y2 = inver.y(t[2], t[3]);
                        m.rotate(t[1], x2, y2);
                    } else {
                        m.rotate(t[1], t[2], t[3]);
                    }
                    deg += t[1];
                }
            } else if (command == "s") {
                if (tlen == 2 || tlen == 3) {
                    bb = bb || el.getBBox(1);
                    m.scale(t[1], t[tlen - 1], bb.x + bb.width / 2, bb.y + bb.height / 2);
                    sx *= t[1];
                    sy *= t[tlen - 1];
                } else if (tlen == 5) {
                    if (absolute) {
                        x2 = inver.x(t[3], t[4]);
                        y2 = inver.y(t[3], t[4]);
                        m.scale(t[1], t[2], x2, y2);
                    } else {
                        m.scale(t[1], t[2], t[3], t[4]);
                    }
                    sx *= t[1];
                    sy *= t[2];
                }
            } else if (command == "m" && tlen == 7) {
                m.add(t[1], t[2], t[3], t[4], t[5], t[6]);
            }
        }
        if (doReturn) {
            return m;
        } else {
            _.dirtyT = 1;
            el.matrix = m;
        }
    }

    el.matrix = m;

    _.sx = sx;
    _.sy = sy;
    _.deg = deg;
    _.dx = dx = m.e;
    _.dy = dy = m.f;

    if (sx == 1 && sy == 1 && !deg && _.bbox) {
        _.bbox.x += +dx;
        _.bbox.y += +dy;
    } else {
        _.dirtyT = 1;
    }
}
function unit2px(el, name, value) {
    var defs = el.paper.defs,
        out = {},
        mgr = el.paper.measurer;
    if (!mgr) {
        el.paper.measurer = mgr = $("rect");
        $(mgr, {width: 10, height: 10});
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
            out = null;
    }
    return out;
}
/*\
 * Savage.select
 [ method ]
 **
 * Wraps DOM element specified by CSS selector as @Element
 > Parameters
 - query (string) CSS selector of the element
 = (Element)
\*/
Savage.select = function (query) {
    return wrap(glob.doc.querySelector(query));
};
/*\
 * Savage.selectAll
 [ method ]
 **
 * Wraps DOM elements specified by CSS selector as set or array of @Element
 > Parameters
 - query (string) CSS selector of the element
 = (Element)
\*/
Savage.selectAll = function (query) {
    var nodelist = glob.doc.querySelectorAll(query),
        set = (Savage.set || Array)();
    for (var i = 0; i < nodelist.length; i++) {
        set.push(wrap(nodelist[i]));
    }
    return set;
};

function Element(el) {
    if (el.savage in hub) {
        return hub[el.savage];
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
    el.savage = id;
    hub[id] = this;
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
    /*\
     * Element.attr
     [ method ]
     **
     * Gets or sets given attributes of the element
     **
     > Parameters
     **
     - params (object) key-value pairs of attributes you want to set
     * or
     - param (string) name of the attribute
     = (Element)
     * or
     = (string) value of attribute
     > Usage
     | el.attr({
     |     fill: "#fc0",
     |     stroke: "#000",
     |     strokeWidth: 2, // CamelCase...
     |     "fill-opacity": 0.5 // or dash-separated names
     | });
     | console.log(el.attr("fill")); // “#fc0”
    \*/
    elproto.attr = function (params) {
        var node = this.node;
        if (is(params, "string")) {
            return arrayFirstValue(eve("savage.util.getattr." + params, this));
        }
        for (var att in params) {
            if (params[has](att)) {
                eve("savage.util.attr." + att, this, params[att]);
            }
        }
        return this;
    };
    /*\
     * Element.getBBox
     [ method ]
     **
     * Returns bounding box descriptor for the given element.
     **
     = (object) bounding box descriptor:
     o {
     o     cx: (number) x of the center,
     o     cy: (number) x of the center,
     o     h: (number) height,
     o     height: (number) height,
     o     path: (string) path command for the box,
     o     r0: (number) radius of the circle that will enclose the box,
     o     r1: (number) radius of the smallest circle that can be enclosed,
     o     r2: (number) radius of the biggest circle that can be enclosed,
     o     vb: (string) box as a viewbox command,
     o     w: (number) width,
     o     width: (number) width,
     o     x2: (number) x of the right side,
     o     x: (number) x of the left side,
     o     y2: (number) y of the right side,
     o     y: (number) y of the left side
     o }
    \*/
    elproto.getBBox = function (isWithoutTransform) {
        if (this.removed) {
            return {};
        }
        var _ = this._;
        if (isWithoutTransform) {
            if (_.dirty || !_.bboxwt) {
                this.realPath = Savage.path.get[this.type](this);
                _.bboxwt = Savage.path.getBBox(this.realPath);
                _.bboxwt.toString = x_y_w_h;
                _.dirty = 0;
            }
            return Savage._.box(_.bboxwt);
        }
        if (_.dirty || _.dirtyT || !_.bbox) {
            if (_.dirty || !this.realPath) {
                _.bboxwt = 0;
                this.realPath = Savage.path.get[this.type](this);
            }
            _.bbox = Savage.path.getBBox(Savage.path.map(this.realPath, this.matrix));
            _.bbox.toString = x_y_w_h;
            _.dirty = _.dirtyT = 0;
        }
        return Savage._.box(_.bbox);
    };
    var propString = function () {
        return this.local;
    };
    /*\
     * Element.transform
     [ method ]
     **
     * Gets or sets transformation of the element
     **
     > Parameters
     **
     - tstr (string) transform string in Savage or SVG format
     = (Element)
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
                local = extractTransform(this);
            return {
                string: _.transform || "",
                globalMatrix: global,
                localMatrix: local,
                diffMatrix: global.clone().add(local.invert()),
                global: global.toTransformString(),
                local: local.toTransformString(),
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
     * Returns parent of the element
     **
     = (Element) parent
    \*/
    elproto.parent = function () {
        return wrap(this.node.parentNode);
    };
    /*\
     * Element.append
     [ method ]
     **
     * Appends given element to current one.
     **
     > Parameters
     **
     - el (Element|Set) element to append
     = (Element) parent
    \*/
    elproto.append = function (el) {
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
     * Prepends given element to current one.
     **
     > Parameters
     **
     - el (Element) element to prepend
     = (Element) parent
    \*/
    elproto.prepend = function (el) {
        el = wrap(el);
        this.node.parentNode.insertBefore(el.node, this.node.firstChild);
        el.paper = this.paper;
        return this;
    };
    /*\
     * Element.before
     [ method ]
     **
     * Inserts given element before the current one.
     **
     > Parameters
     **
     - el (Element) element to insert
     = (Element) parent
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
     * Inserts given element after the current one.
     **
     > Parameters
     **
     - el (Element) element to insert
     = (Element) parent
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
     * Inserts the element after the given one.
     **
     > Parameters
     **
     - el (Element) element next to whom insert to
     = (Element) parent
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
     * Inserts the element after the given one.
     **
     > Parameters
     **
     - el (Element) element next to whom insert to
     = (Element) parent
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
    \*/
    elproto.remove = function () {
        this.node.parentNode.removeChild(this.node);
        delete this.paper;
        this.removed = true;
    };
    /*\
     * Element.select
     [ method ]
     **
     * Applies CSS selector with the element as a parent and returns the result as an @Element.
     **
     > Parameters
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
     * Applies CSS selector with the element as a parent and returns the result as a set or array of elements.
     **
     > Parameters
     **
     - query (string) CSS selector
     = (Set|array) result of query selection
    \*/
    elproto.selectAll = function (query) {
        var nodelist = this.node.querySelectorAll(query),
            set = (Savage.set || Array)();
        for (var i = 0; i < nodelist.length; i++) {
            set.push(wrap(nodelist[i]));
        }
        return set;
    };
    /*\
     * Element.asPX
     [ method ]
     **
     * Return given attribute of the element as a `px` value. (Not %, em, etc)
     **
     > Parameters
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
    /*\
     * Element.use
     [ method ]
     **
     * Creates `<use>` element linked to the current element.
     **
     = (Element) `<use>` element
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
        return use;
    };
    /*\
     * Element.clone
     [ method ]
     **
     * Creates `<use>` element linked to the current element.
     **
     = (Element) `<use>` element
    \*/
    elproto.clone = function () {
        var clone = wrap(this.node.cloneNode(true));
        clone.insertAfter(this);
        return clone;
    };
    /*\
     * Element.pattern
     [ method ]
     **
     * Creates `<pattern>` element from the current element.
     **
     > Parameters
     **
     * To create a pattern you have to specify the pattern rect:
     - x (string|number)
     - y (string|number)
     - width (string|number)
     - height (string|number)
     = (Element) `<pattern>` element
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
        var p = make("pattern", this.paper.defs);
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
    /*\
     * Element.marker
     [ method ]
     **
     * Creates `<marker>` element from the current element.
     **
     > Parameters
     **
     * To create a marker you have to specify the bounding rect and reference point:
     - x (number)
     - y (number)
     - width (number)
     - height (number)
     - refX (number)
     - refY (number)
     = (Element) `<marker>` element
     * You can use pattern later on as an argument for `marker-start` or `marker-end` attributes.
    \*/
    // TODO add usage for markers
    elproto.marker = function (x, y, width, height, refX, refY) {
        var p = make("marker", this.paper.defs);
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
        if (typeof easing == "function") {
            callback = easing;
            easing = mina.linear;
        }
        this.attr = attr;
        this.dur = ms;
        easing && (this.easing = easing);
        callback && (this.callback = callback);
    };
    /*\
     * Savage.animation
     [ method ]
     **
     * Creates animation object.
     **
     > Parameters
     **
     - attr (object) attributes of final destination
     - ms (number) animation duration
     - easing (function) #optional one of easing functions of @mina or custom one
     - callback (function) #optional callback
     = (object) animation object
    \*/
    Savage.animation = function (attr, ms, easing, callback) {
        return new Animation(attr, ms, easing, callback);
    };
    /*\
     * Element.inAnim
     [ method ]
     **
     * Returns an array of animations element currently in
     **
     = (object) in format
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
     * Savage.animate
     [ method ]
     **
     * Runs generic animation of one number into another with a caring function.
     **
     > Parameters
     - from (number|array) number or array of numbers
     - to (number|array) number or array of numbers
     - setter (function) caring function that will take one number argument
     - ms (number) duration
     - easing (function) #optional easing function from @mina or custom
     - callback (function) #optional 
     = (object) animation object in @mina format
     o {
     o     id (string) animation id, consider it read-only,
     o     duration (function) gets or sets the duration of the animation,
     o     easing (function) easing,
     o     speed (function) gets or sets the speed of the animation,
     o     status (function) gets or sets the status of the animation,
     o     stop (function) stops the animation
     o }
    \*/
    Savage.animate = function (from, to, setter, ms, easing, callback) {
        if (typeof easing == "function") {
            callback = easing;
            easing = mina.linear;
        }
        var now = mina.time(),
            anim = mina(from, to, now, now + ms, mina.time, setter, easing);
        callback && eve.once("mina.finish." + anim.id, callback);
        return anim;
    };
    /*\
     * Element.animate
     [ method ]
     **
     * Animate given attributes of the element.
     **
     > Parameters
     - attrs (object) key-value pairs of destination attributes
     - ms (number) duration
     - easing (function) #optional easing function from @mina or custom
     - callback (function) #optional 
     = (Element) the element
    \*/
    elproto.animate = function (attrs, ms, easing, callback) {
        if (typeof easing == "function") {
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
}(Element.prototype));
/*\
 * Savage.parse
 [ method ]
 **
 * Parses SVG fragment and converts it into @Fragment.
 **
 > Parameters
 - svg (string) SVG string
 = (Fragment) the fragment
\*/
Savage.parse = function (svg) {
    var f = document.createDocumentFragment(),
        pointer = f;
    eve.on("elemental.tag", function (data, extra, raw) {
        var tag = $(data);
        extra && $(tag, extra);
        pointer.appendChild(tag);
        pointer = tag;
    });
    eve.on("elemental.text", function (text) {
        pointer.appendChild(document.createTextNode(text));
    });
    eve.on("elemental./tag", function () {
        pointer = pointer.parentNode;
    });
    eve.on("elemental.eof", function () {
        eve.off("elemental.*");
        eve("savage.parsed", f);
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
/*\
 * Savage.fragment
 [ method ]
 **
 * Creates DOM fragment from given list of elements or strings
 **
 > Parameters
 - varargs (…) SVG string
 = (Fragment) the @Fragment
\*/
Savage.fragment = function () {
    var args = Array.prototype.slice.call(arguments, 0),
        f = document.createDocumentFragment();
    for (var i = 0, ii = args.length; i < ii; i++) {
        var item = args[i];
        if (item.node && item.node.nodeType) {
            f.appendChild(item.node);
        }
        if (item.nodeType) {
            f.appendChild(item);
        }
        if (typeof item == "string") {
            f.appendChild(Savage.parse(item).node);
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
        if (w.savage in hub) {
            return hub[w.savage];
        }
        res = new Element(w);
        desc = w.getElementsByTagName("desc")[0];
        defs = w.getElementsByTagName("defs")[0];
    } else {
        res = make("svg", glob.doc.body);
        $(res.node, {
            height: h,
            version: 1.1,
            width: w,
            xmlns: "http://www.w3.org/2000/svg"
        });
    }
    if (!desc) {
        desc = $("desc");
        desc.appendChild(glob.doc.createTextNode("Created with Savage"));
        res.node.appendChild(desc);
    }
    if (!defs) {
        defs = $("defs");
        res.node.appendChild(defs);
    }
    for (var key in proto) if (proto[has](key)) {
        res[key] = proto[key];
    }
    res.paper = res;
    res.defs = defs;
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
(function (proto) {
    /*\
     * Paper.el
     [ method ]
     **
     * Creates element on paper with a given name and no attributes.
     **
     > Parameters
     - name (string) element tag name
     = (Element) the element
     > Usage
     | var c = paper.circle(10, 10, 10); // is the same as...
     | var c = paper.el("circle").attr({
     |     cx: 10,
     |     cy: 10,
     |     r: 10
     | });
    \*/
    proto.el = function (name) {
        return make(name, this.node);
    };
    /*\
     * Paper.rect
     [ method ]
     *
     * Draws a rectangle.
     **
     > Parameters
     **
     - x (number) x coordinate of the top left corner
     - y (number) y coordinate of the top left corner
     - width (number) width
     - height (number) height
     - rx (number) #optional horisontal radius for rounded corners, default is 0
     - ry (number) #optional vertical radius for rounded corners, default is rx or 0
     = (object) Element object with type “rect”
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
     * Draws a circle.
     **
     > Parameters
     **
     - x (number) x coordinate of the centre
     - y (number) y coordinate of the centre
     - r (number) radius
     = (object) Element object with type “circle”
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
     * Embeds an image into the surface.
     **
     > Parameters
     **
     - src (string) URI of the source image
     - x (number) x coordinate position
     - y (number) y coordinate position
     - width (number) width of the image
     - height (number) height of the image
     = (object) Raphaël element object with type “image”
     **
     > Usage
     | var c = paper.image("apple.png", 10, 10, 80, 80);
    \*/
    /*\
     * Paper.image
     [ method ]
     **
     * Embeds an image into the surface.
     **
     > Parameters
     **
     - src (string) URI of the source image
     - x (number) x coordinate position
     - y (number) y coordinate position
     - width (number) width of the image
     - height (number) height of the image
     = (object) Element object with type “image”
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
     * Draws an ellipse.
     **
     > Parameters
     **
     - x (number) x coordinate of the centre
     - y (number) y coordinate of the centre
     - rx (number) horizontal radius
     - ry (number) vertical radius
     = (object) Element object with type “ellipse”
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
    /*\
     * Paper.path
     [ method ]
     **
     * Creates a path element by given path data string.
     > Parameters
     - pathString (string) #optional path string in SVG format.
     * Path string consists of one-letter commands, followed by comma seprarated arguments in numercal form. Example:
     | "M10,20L30,40"
     * Here we can see two commands: “M”, with arguments `(10, 20)` and “L” with arguments `(30, 40)`. Upper case letter mean command is absolute, lower case—relative.
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
     * * “Catmull-Rom curveto” is a not standard SVG command and added to make life easier.
     * Note: there is a special case when path consist of just three commands: “M10,10R…z”. In this case path will smoothly connects to its beginning.
     > Usage
     | var c = paper.path("M10 10L90 90");
     | // draw a diagonal line:
     | // move to 10,10, line to 90,90
    \*/
    proto.path = function (d) {
        var el = make("path", this.node);
        if (is(d, "object")) {
            el.attr(d);
        } else if (d) {
            el.attr({
                d: d
            });
        }
        return el;
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
        for (i = 0; i < children.length; i++) if (children[i].savage) {
            this[j++] = hub[children[i].savage];
        }
    }
    /*\
     * Paper.g
     [ method ]
     **
     * Makes a group element.
     **
     > Parameters
     **
     - varargs (…) #optional elements
     = (object) Element object with type “g”
     **
     > Usage
     | var c1 = paper.circle(),
     |     c2 = paper.rect(),
     |     g = paper.g(c2, c1); // note that the order of elements will be different
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
    proto.group = proto.g = function () {
        var el = make("g", this.node);
        el.add = add2group;
        if (arguments.length) {
            add2group.call(el, Array.prototype.slice.call(arguments, 0));
        }
        return el;
    };
    /*\
     * Paper.text
     [ method ]
     **
     * Draws a text string.
     **
     > Parameters
     **
     - x (number) x coordinate position
     - y (number) y coordinate position
     - text (string|array) The text string to draw or array of <tspan>s
     = (object) Element object with type “text”
     **
     > Usage
     | var t1 = paper.text(50, 50, "Savage");
     | var t2 = paper.text(50, 50, ["S","a","v","a","g","e"]);
    \*/
    proto.text = function (x, y, text) {
        var el = make("text", this.node);
        if (is(x, "object")) {
            le.attr(x);
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
     * Draws a line.
     **
     > Parameters
     **
     - x1 (number) x coordinate position of the start
     - y1 (number) y coordinate position of the start
     - x2 (number) x coordinate position of the end
     - y2 (number) y coordinate position of the end
     = (object) Element object with type “line”
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
     * Draws a polyline.
     **
     > Parameters
     **
     - points (array) array of points
     * or
     - varargs (…) points
     = (object) Element object with type “text”
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
         * Creates a gradient element.
         **
         > Parameters
         **
         - gradient (string) gradient descriptor
         > Gradient Descriptor
         * Gradient descriptor consists of `<type>(<coords>)<colors>`. Type
         * could be linear or radial, which presented as letter “L” or “R”. Any
         * type could be absolute or relative, absolute gradient take it coords
         * relative to the SVG surface, while relative takes them relative to
         * the bounding box of the element it applied to. For absolute
         * coordinates you specify type as an upper case letter (“L” or “R”).
         * For relative use low case letter (“l” or “r”). Coordinates specify
         * vector of gradient for linear as x1, y1, x2, y2. For radial as cx,
         * cy, r and optional fx, fy. Colors are list of dash separated colors.
         * Optionally color could have offset after colon.
         > Example
         | var g = paper.gradient("l(0, 0, 1, 1)#000-#f00-#fff");
         * Linear gradient, relative from top-left corner to bottom-right
         * corner, from black through red to white.
         | var g = paper.gradient("L(0, 0, 100, 100)#000-#f00:25%-#fff");
         * Linear gradient, absolute from (0, 0) to (100, 100), from black
         * through red at 25% to white.
         | var g = paper.gradient("r(0.5, 0.5, 0.5)#000-#fff");
         * Radial gradient, relative from the center of the element with radius
         * 0.5 of the width, from black to white.
         | paper.circle(50, 50, 40).attr({
         |     fill: g
         | });
         = (object) Element object with type “gradient”
        \*/
        proto.gradient = function (str) {
            var grad = arrayFirstValue(eve("savage.util.grad.parse", null, str)),
                el;
            if (grad.type.toLowerCase() == "l") {
                el = this.gradientLinear.apply(this, grad.params);
            } else {
                el = this.gradientRadial.apply(this, grad.params);
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
        };
        function stops() {
            return this.selectAll("stop");
        }
        function addStop(color, offset) {
            var stop = $("stop");
            $(stop, {
                "stop-color": color,
                offset: +offset + "%"
            });
            this.node.appendChild(stop);
            return this;
        }
        function getBBox() {
            if (this.type == "linearGradient") {
                var x1 = $(this.node, "x1") || 0,
                    x2 = $(this.node, "x2") || 1,
                    y1 = $(this.node, "y1") || 0,
                    y2 = $(this.node, "y2") || 0;
                return Savage._.box(x1, y1, math.abs(x2 - x1), math.abs(y2 - y1));
            } else {
                var cx = this.node.cx || .5,
                    cy = this.node.cy || .5,
                    r = this.node.r || 0;
                return Savage._.box(cx - r, cy - r, r * 2, r * 2);
            }
        }
        proto.gradientLinear = function (x1, y1, x2, y2) {
            var el = make("linearGradient", this.node);
            el.stops = stops;
            el.addStop = addStop;
            el.getBBox = getBBox;
            if (x1 != null) {
                $(el.node, {
                    x1: x1,
                    y1: y1,
                    x2: x2,
                    y2: y2
                });
            }
            return el;
        };
        proto.gradientRadial = function (cx, cy, r, fx, fy) {
            var el = make("radialGradient", this.node);
            el.stops = stops;
            el.addStop = addStop;
            el.getBBox = getBBox;
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
        };
    }());
}(Paper.prototype));
// Attributes event handlers
eve.on("savage.util.attr.mask", function (value) {
    if (value instanceof Element || value instanceof Fragment) {
        eve.stop();
        if (value instanceof Fragment && value.node.childNodes.length == 1) {
            value = value.node.firstChild;
            this.paper.defs.appendChild(value);
            value = wrap(value);
        }
        if (value.type == "mask") {
            var mask = value;
        } else {
            mask = make("mask", this.paper.defs);
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
    eve.on("savage.util.attr.clip", clipIt);
    eve.on("savage.util.attr.clip-path", clipIt);
    eve.on("savage.util.attr.clipPath", clipIt);
}(function (value) {
    if (value instanceof Element || value instanceof Fragment) {
        eve.stop();
        if (value.type == "clipPath") {
            var clip = value;
        } else {
            clip = make("clipPath", this.paper.defs);
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
eve.on("savage.util.attr.fill", function (value) {
    eve.stop();
    if (value instanceof Fragment && value.node.childNodes.length == 1 &&
        (value.node.firstChild.tagName == "radialGradient" ||
        value.node.firstChild.tagName == "linearGradient" ||
        value.node.firstChild.tagName == "pattern")) {
        value = value.node.firstChild;
        this.paper.defs.appendChild(value);
        value = wrap(value);
    }
    if (value instanceof Element &&
        (value.type == "radialGradient" || value.type == "linearGradient" ||
         value.type == "pattern")) {
            if (!value.node.id) {
                $(value.node, {
                    id: value.id
                });
            }
            var fill = "url(#" + value.node.id + ")";
    } else {
        fill = Savage.color(value);
        if (fill.error) {
            var grad = this.paper.gradient(value);
            if (!grad.node.id) {
                $(grad.node, {
                    id: grad.id
                });
            }
            fill = "url(#" + grad.node.id + ")";
        } else {
            fill = Str(fill);
        }
    }
    $(this.node, {fill: fill});
    this.node.style.fill = E;
});
var gradrg = /^([lr])(?:\(([^)]*)\))?(.*)$/i;
eve.on("savage.util.grad.parse", function parseGrad(string) {
    string = Str(string);
    var tokens = string.match(gradrg),
        type = tokens[1],
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

eve.on("savage.util.attr.d", function (value) {
    eve.stop();
    if (is(value, "array") && is(value[0], "array")) {
        value = Savage.path.toString.call(value);
    }
    value = Str(value);
    if (value.match(/[ruo]/i)) {
        value = Savage.path.toAbsolute(value);
    }
    $(this.node, {d: value});
})(-1);
eve.on("savage.util.attr.path", function (value) {
    eve.stop();
    this.attr({d: value});
})(-1);
eve.on("savage.util.attr.viewBox", function (value) {
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
eve.on("savage.util.attr.transform", function (value) {
    this.transform(value);
    eve.stop();
})(-1);
eve.on("savage.util.attr.r", function (value) {
    if (this.type == "rect") {
        eve.stop();
        $(this.node, {
            rx: value,
            ry: value
        });
    }
})(-1);
eve.on("savage.util.attr.text", function (value) {
    if (this.type == "text") {
        var i = 0,
            node = this.node;
        var tuner = function (chunk) {
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
        node.appendChild(tuner(value));
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
    }
};
eve.on("savage.util.attr", function (value) {
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
eve.on("savage.util.getattr.transform", function () {
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
                return Savage(glob.doc.getElementById(style.match(reURLValue)[1]));
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
    eve.on("savage.util.getattr.marker-end", getter("end"))(-1);
    eve.on("savage.util.getattr.markerEnd", getter("end"))(-1);
    eve.on("savage.util.getattr.marker-start", getter("start"))(-1);
    eve.on("savage.util.getattr.markerStart", getter("start"))(-1);
    eve.on("savage.util.getattr.marker-mid", getter("mid"))(-1);
    eve.on("savage.util.getattr.markerMid", getter("mid"))(-1);
    eve.on("savage.util.attr.marker-end", setter("end"))(-1);
    eve.on("savage.util.attr.markerEnd", setter("end"))(-1);
    eve.on("savage.util.attr.marker-start", setter("start"))(-1);
    eve.on("savage.util.attr.markerStart", setter("start"))(-1);
    eve.on("savage.util.attr.marker-mid", setter("mid"))(-1);
    eve.on("savage.util.attr.markerMid", setter("mid"))(-1);
}());
eve.on("savage.util.getattr.r", function () {
    if (this.type == "rect" && $(this.node, "rx") == $(this.node, "ry")) {
        eve.stop();
        return $(this.node, "rx");
    }
})(-1);
eve.on("savage.util.getattr.viewBox", function () {
    eve.stop();
    var vb = $(this.node, "viewBox").split(separator);
    return Savage._.box(+vb[0], +vb[1], +vb[2], +vb[3]);
    // TODO: investigate why I need to z-index it
})(-1);
eve.on("savage.util.getattr.points", function () {
    var p = $(this.node, "points");
    eve.stop();
    return p.split(separator);
});
eve.on("savage.util.getattr.path", function () {
    var p = $(this.node, "d");
    eve.stop();
    return p;
});
// default
eve.on("savage.util.getattr", function () {
    var att = eve.nt();
    att = att.substring(att.lastIndexOf(".") + 1);
    var style = att.replace(/-(\w)/gi, function (all, letter) {
        return letter.toUpperCase();
    });
    if (availableAttributes[has](this.type) && availableAttributes[this.type][has](att)) {
        return this.node.getAttribute(att);
    } else {
        return glob.doc.defaultView.getComputedStyle(this.node, null).getPropertyValue(style);
    }
});
Savage.plugin = function (f) {
    f(Savage, Element, Paper, glob);
};
return Savage;
}());