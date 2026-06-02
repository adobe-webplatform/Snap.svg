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
Snap.plugin(function (Snap, _Element_, _future_me_, glob, _Fragment_, eve) {
    const hub = Snap._.hub;
    const $ = Snap._.$;
    const make = Snap._.make;
    const getSomeDefs = Snap._.getSomeDefs;
    const has = "hasOwnProperty";
    const xmlns = "http://www.w3.org/2000/svg";

    /**
     * Wrapper around an `<svg>` root node providing element creation helpers and utilities.
     * Instances are created through {@link Snap} and mirror the behaviour of Snap.svg papers.
     *
     * @class Snap.Paper
     * @param {(number|string|SVGElement)} w Width of the surface or an existing SVG element.
     * @param {(number|string)} [h] Height of the surface when `w` is a numeric or string size.
     * @param {(Document|DocumentFragment)} [doc] Document or DocumentFragment to create the SVG in. If a DocumentFragment is provided, the SVG will be created detached from the DOM.
     */
    class Paper {
        constructor(w, h, doc) {
            let res,
                defs;
            const proto = Paper.prototype;
            if (w && w.tagName && w.tagName.toLowerCase() === "svg") {
                if (w.snap in hub) {
                    return hub[w.snap];
                }
                // const doc = w.ownerDocument;
                const ElementClass = Snap.getClass("Element");
                res = new ElementClass(w);
                defs = w.getElementsByTagName("defs")[0];
                if (!defs) {
                    defs = $("defs");
                    res.node.appendChild(defs);
                }
                res.defs = defs;
                for (let key in proto) if (proto[has](key)) {
                    res[key] = proto[key];
                }
                res.paper = res.root = res;
            } else {
                // Determine parent: DocumentFragment for detached construction, or document.body for normal use
                const parent = (doc && doc.nodeType === 11) ? doc : Snap.document(doc).body;
                res = Snap._.make("svg", parent, doc);
                $(res.node, {
                    height: h,
                    version: 1.1,
                    width: w,
                    xmlns: xmlns,
                });
            }
            return res;
        }
    }

    // Register the Paper class with Snap
    Snap.registerClass("Paper", Paper);

    var proto = Paper.prototype,
        is = Snap.is;

    function isPlainObject(value) {
        return is(value, "object") && value && !Array.isArray(value) && !Snap.is(value, "Element") && !value.node && !value.type && !value.paper;
    }

    function listToString(value, innerSeparator) {
        if (!Array.isArray(value)) {
            return value;
        }
        var outer = ";";
        return value.map(function (item) {
            if (Array.isArray(item)) {
                return item.map(function (inner) {
                    return inner == null ? "" : String(inner);
                }).join(innerSeparator || " ");
            }
            return item == null ? "" : String(item);
        }).join(outer);
    }

    function normaliseAnimationAttributes(attr) {
        if (!attr) {
            return;
        }
        if (attr.values != null) {
            attr.values = listToString(attr.values, " ");
        }
        if (attr.keyTimes != null) {
            attr.keyTimes = listToString(attr.keyTimes);
        }
        if (attr.keyPoints != null) {
            attr.keyPoints = listToString(attr.keyPoints);
        }
        if (attr.keySplines != null) {
            attr.keySplines = listToString(attr.keySplines, " ");
        }
    }
    /**
     * Draws a rectangle on the paper.
     *
     * @function Snap.Paper#rect
     * @param {number} x X coordinate of the top-left corner.
     * @param {number} y Y coordinate of the top-left corner.
     * @param {number} width Rectangle width.
     * @param {number} height Rectangle height.
     * @param {number|Array.<number>} [rx] Horizontal radius for rounded corners, or an `[rx, ry]` pair.
     * @param {number} [ry] Vertical radius for rounded corners; defaults to `rx` when omitted.
     * @param {Object} [attr] Attribute map applied to the created element.
     * @returns {Snap.Element} The rectangle element.
     * @example
     * // Regular rectangle
     * paper.rect(10, 10, 50, 50);
     *
     * // Rectangle with rounded corners
     * paper.rect(40, 40, 50, 50, 10);
     */
    proto.rect = function (x, y, w, h, rx, ry, attr) {
        if (is(rx, "object") && !Array.isArray(rx)) {
            attr = rx;
            rx = ry = undefined
        }
        if (is(ry, "object")) {
            attr = ry;
            ry = undefined
        }
        if (ry == null) {
            ry = rx;
        }
        attr = attr || {};
        if (is(x, "object") && x == "[object Object]") {
            attr = x;
        } else if (x != null) {
            attr = Object.assign(attr, {
                x: x,
                y: y,
                width: w,
                height: h
            });
            if (rx != null) {
                if (Array.isArray(rx)) {
                    ry = rx[1];
                    rx = rx[0];
                }
                attr.rx = rx;
                attr.ry = ry;
            }
        }
        return this.el("rect", attr);
    };

    /**
     * Draws a circle.
     *
     * @function Snap.Paper#circle
     * @param {number} x X coordinate of the centre.
     * @param {number} y Y coordinate of the centre.
     * @param {number} r Circle radius.
     * @param {Object} [attr] Attribute map for the circle element.
     * @returns {Snap.Element} The circle element.
     * @example
     * paper.circle(50, 50, 40);
     */
    proto.circle = function (cx, cy, r, attr) {
        if (is(cx, "object") && cx == "[object Object]") {
            attr = cx;
        } else if (cx != null) {
            attr = attr || {};
            attr = Object.assign(attr, {
                cx: cx,
                cy: cy,
                r: r
            });
        }
        return this.el("circle", attr);
    };
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

    /**
     * Places an image on the surface.
     *
     * @function Snap.Paper#image
     * @param {string|Object} src Image URL or attribute map containing at least a `src` property.
     * @param {number} [x] Horizontal offset on the paper.
     * @param {number} [y] Vertical offset on the paper.
     * @param {number} [width] Image width.
     * @param {number} [height] Image height.
     * @param {Object} [attr] Additional attributes applied to the element.
     * @returns {Snap.Element} The image element.
     * @example
     * paper.image("apple.png", 10, 10, 80, 80);
     */
    proto.image = function (src, x, y, width, height, attr) {
        var el = this.el("image");
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
                    Snap._.$(el.node, {
                        width: this.offsetWidth,
                        height: this.offsetHeight
                    });
                });
            }
            Snap._.$(el.node, set);
            if (attr) el.attr(attr);
        }

        return el;
    };
    /**
     * Draws an ellipse.
     *
     * @function Snap.Paper#ellipse
     * @param {number} x X coordinate of the centre.
     * @param {number} y Y coordinate of the centre.
     * @param {number} rx Horizontal radius.
     * @param {number} ry Vertical radius.
     * @param {Object} [attr] Attribute map for the element.
     * @returns {Snap.Element} The ellipse element.
     * @example
     * paper.ellipse(50, 50, 40, 20);
     */
    proto.ellipse = function (cx, cy, rx, ry, attr) {
        if (is(cx, "object") && cx == "[object Object]") {
            attr = cx;
        } else if (cx != null) {
            attr = attr || {};
            attr = Object.assign(attr, {
                cx: cx,
                cy: cy,
                rx: rx,
                ry: ry
            });
        }
        return this.el("ellipse", attr);
    };
// SIERRA Paper.path(): Unclear from the link what a Catmull-Rom curveto is, and why it would make life any easier.
    /**
     * Creates a `<path>` element using the provided SVG path data string.
     * The path data follows standard SVG syntax where single-letter commands are followed by
     * comma- or space-separated numeric arguments (for example, `"M10,20L30,40"`).
     *
     * @function Snap.Paper#path
     * @param {(string|Array|Object)} [pathString] SVG path string, an array of segments, or an
     *        attribute map applied to the created element.
     * @returns {Snap.Element} The resulting path element.
     * @see <a href="http://www.w3.org/TR/SVG/paths.html#PathData">SVG path specification</a>
     * @see <a href="https://developer.mozilla.org/en/SVG/Tutorial/Paths">MDN path tutorial</a>
     * @example
     * // Draw a diagonal line
     * paper.path("M10 10L90 90");
     */
    proto.path = function (d, attr) {
        attr = attr || {};
        if (is(d, "object") && !is(d, "array")) {
            attr = Object.assign(attr, d);
        } else if (d) {
            attr['d'] = d;
        }
        return this.el("path", attr);
    };
    /**
     * Creates an SVG `<g>` element on the paper and optionally nests the supplied elements within it.
     * The last argument may be an attribute map applied to the created group.
     *
     * @function Snap.Paper#g
     * @alias Snap.Paper#def_group
     * @param {...any} elements Elements to append to the group. When the final argument
     *        is a plain object without `type` or `paper` properties, it is treated as the attribute map.
     * @returns {Snap.Element} The group element.
     * @example
     * const circle = paper.circle(10, 10, 5);
     * const rect = paper.rect(0, 0, 20, 20);
     * paper.g(circle, rect);
     */
    proto.def_group = proto.g = function () {
        var attr,
            el = this.el("g");

        var last = (arguments.length) ? arguments[arguments.length - 1] : undefined;
        if (last && is(last, "object") && !last.type && !last.paper) {
            attr = last
        }

        if (arguments.length) {
            var end = (attr) ? -1 : undefined;
            el.add(Array.prototype.slice.call(arguments, 0, end));
        }

        if (attr) el.attr(attr);

        return el;
    };
    /**
     * Creates a nested `<svg>` element.
     *
     * @function Snap.Paper#svg
     * @param {number} [x] X coordinate of the embedded SVG.
     * @param {number} [y] Y coordinate of the embedded SVG.
     * @param {number|string} [width] Viewport width.
     * @param {number|string} [height] Viewport height.
     * @param {number} [vbx] ViewBox x origin.
     * @param {number} [vby] ViewBox y origin.
     * @param {number} [vbw] ViewBox width.
     * @param {number} [vbh] ViewBox height.
     * @returns {Snap.Element} The nested SVG element.
     */
    proto.svg = function (x, y, width, height, vbx, vby, vbw, vbh) {
        var attrs = {};
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
    proto.svg.skip = true;
    /**
     * Creates an SVG `<mask>` element, mirroring the behaviour of {@link Snap.Paper#g}.
     * When a single plain object is supplied, it is treated as the attribute map; otherwise all
     * parameters are added to the mask as children.
     *
     * @function Snap.Paper#mask
     * @param {...any} nodes Elements to include in the mask or a terminating attribute map.
     * @returns {Snap.Element} The mask element.
     */
    proto.mask = function (first) {
        var attr,
            el = this.el("mask");
        if (arguments.length == 1 && first && !first.type) {
            el.attr(first);
        } else if (arguments.length) {
            el.add(Array.prototype.slice.call(arguments, 0));
        }
        return el;
    };
    /**
     * Creates an SVG `<pattern>` element, optionally configuring its position, size, and viewBox.
     *
     * @function Snap.Paper#ptrn
     * @param {number} [x] X coordinate of the pattern.
     * @param {number} [y] Y coordinate of the pattern.
     * @param {number} [width] Width of the pattern tile.
     * @param {number} [height] Height of the pattern tile.
     * @param {number} [vx] ViewBox x origin.
     * @param {number} [vy] ViewBox y origin.
     * @param {number} [vw] ViewBox width.
     * @param {number} [vh] ViewBox height.
     * @param {Object} [attr] Attribute map applied to the pattern.
     * @returns {Snap.Element} The pattern element.
     */
    proto.ptrn = function (x, y, width, height, vx, vy, vw, vh, attr) {
        attr = arguments(arguments.length - 1);
        if (!is(attr, "object")) attr = {};
        if (is(x, "object")) {
            attr = x;
        } else {
            attr.patternUnits = "userSpaceOnUse";
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
    /**
     * Creates an SVG `<use>` element referencing an existing symbol or node.
     *
     * @function Snap.Paper#use
     * @param {(string|Snap.Element|Object)} [id] ID of the element to reference, the element itself,
     *        or an attribute map containing an `id` property. When omitted the method defers to the
     *        {@link Snap.Element#use} behaviour.
     * @param {Object} [attr] Additional attributes applied to the `<use>` element.
     * @returns {Snap.Element} The `<use>` element.
     */
    proto.use = function (id, attr) {
        if (id != null) {
            if (Snap.is(id, "Element")) {
                if (!id.attr("id")) {
                    id.attr({id: Snap._.id(id)});
                }
                id = id.attr("id");
            } else if (is(id, "object")) {
                attr = id;
                id = attr.id;
            }
            if (String(id).charAt() == "#") {
                id = id.substring(1);
            }
            attr = attr || {};

            attr["href"] = "#" + id;
            return this.el("use", attr);
        } else {
            let Element = Snap.getClass("Element");
            return Element && Element.prototype.use.call(this);
        }
    };
    proto.use.skip = true;

    /**
     * Creates an SVG `<symbol>` element.
     *
     * @function Snap.Paper#symbol
     * @param {number} [vbx] ViewBox x origin.
     * @param {number} [vby] ViewBox y origin.
     * @param {number} [vbw] ViewBox width.
     * @param {number} [vbh] ViewBox height.
     * @param {Object} [attr] Additional attributes applied to the symbol.
     * @returns {Snap.Element} The symbol element.
     */
    proto.symbol = function (vx, vy, vw, vh, attr) {
        attr = attr || {};
        if (vx != null && vy != null && vw != null && vh != null) {
            attr.viewBox = [vx, vy, vw, vh];
        }

        return this.el("symbol", attr);
    };
    /**
     * Draws a text string.
     *
     * @function Snap.Paper#text
     * @param {number} x X coordinate of the baseline origin.
     * @param {number} y Y coordinate of the baseline origin.
     * @param {(string|Array.<string>)} text Text content or an array of strings that become nested `<tspan>` elements.
     * @param {Object} [attr] Attribute map for the text element.
     * @returns {Snap.Element} The text element.
     * @example
     * const label = paper.text(50, 50, "Snap");
     * label.attr({textpath: "M10,10L100,100"});
     */
    proto.text = function (x, y, text, attr) {
        attr = attr || {};
        if (is(x, "object")) {
            attr = x;
        } else if (x != null) {
            attr = Object.assign(attr, {
                x: x,
                y: y,
                text: text || ""
            });
        }
        return this.el("text", attr);
    };

    /**
     * Creates a `<textPath>` element bound to a path reference and optional text content.
     *
     * @function Snap.Paper#textPath
     * @param {(string|Array|Snap.Element|Object)} path Path data string or array, existing path element,
     *        `#id` reference, or attribute map.
     * @param {(string|Array.<string>)} [text] Text content applied to the `<textPath>` element.
     * @param {Object} [attr] Attribute map for the `<textPath>` element.
     * @returns {Snap.Element} The `<textPath>` element.
     */
    proto.textPath = function (path, text, attr) {
        attr = attr || {};
        let textContent = text;
        let hrefValue;
        let targetPath;
        let createdPath = false;

        if (isPlainObject(path)) {
            attr = path;
            if (attr.text != null && textContent == null) {
                textContent = attr.text;
            }
            hrefValue = attr["xlink:href"] || attr.href;
            path = hrefValue;
        }

        if (Snap.is(path, "Element")) {
            targetPath = path;
        } else if (Snap.is(path, "array")) {
            targetPath = this.path(path);
            createdPath = true;
        } else if (is(path, "string")) {
            if (path.charAt(0) === "#") {
                hrefValue = path;
            } else {
                targetPath = this.path(path);
                createdPath = true;
            }
        }

        if (targetPath) {
            let id = targetPath.attr("id");
            if (!id) {
                id = Snap._.id(targetPath);
                targetPath.attr({id: id});
            }
            hrefValue = "#" + id;
            if (createdPath) {
                const defs = getSomeDefs(this);
                if (defs) {
                    const group = defs.querySelector("#text-paths");
                    (group || defs).appendChild(targetPath.node);
                }
            }
        }

        if (hrefValue) {
            attr["xlink:href"] = hrefValue;
            attr.href = hrefValue;
        }

        if (textContent != null && attr.text == null) {
            attr.text = textContent;
        }

        return this.el("textPath", attr);
    };

    /**
     * Creates an SVG `<animate>` element and optionally appends it to a target element.
     *
     * Positional arguments map to the most common animation attributes. An attribute map can be
     * supplied instead (or in addition) to cover extra properties. When the last argument is a
     * {@link Snap.Element}, the animation node is automatically added to it via {@link Snap.Element#add}.
     *
     * @function Snap.Paper#animate
     * @param {string} [attributeName] Animated attribute name.
     * @param {(string|number)} [from] Start value.
     * @param {(string|number)} [to] End value.
     * @param {(string|number)} [dur] Animation duration (for example `"2s"`).
     * @param {(string|number)} [begin] Delay before the animation starts.
     * @param {(string|number)} [repeatCount] Repeat configuration (for example `"indefinite"`).
     * @param {string} [fill] Fill behaviour (`"freeze"`, `"remove"`).
     * @param {string} [calcMode] Interpolation mode.
     * @param {(string|Array)} [values] Value list for keyframe animation.
     * @param {(string|Array)} [keyTimes] Key time list matching `values`.
     * @param {(string|Array)} [keySplines] Bezier control points for spline timing.
     * @param {(string|number)} [by] Relative delta value.
     * @param {Object} [attr] Additional attributes for the `<animate>` element.
     * @param {Snap.Element} [target] Element that receives the animation via `.add`.
     * @returns {Snap.Element} The `<animate>` element.
     */
    proto.animate = function () {
        const args = Array.prototype.slice.call(arguments);
        let insertionTarget = null;
        let attr = {};

        if (args.length && Snap.is(args[args.length - 1], "Element")) {
            insertionTarget = args.pop();
        }

        if (args.length && isPlainObject(args[args.length - 1])) {
            attr = args.pop();
        }

        if (args.length === 1 && isPlainObject(args[0])) {
            Object.assign(attr, args.pop());
        } else if (args.length) {
            const keys = [
                "attributeName",
                "from",
                "to",
                "dur",
                "begin",
                "repeatCount",
                "fill",
                "calcMode",
                "values",
                "keyTimes",
                "keySplines",
                "by"
            ];
            for (let i = 0; i < keys.length && i < args.length; ++i) {
                const value = args[i];
                if (value != null && attr[keys[i]] == null) {
                    attr[keys[i]] = value;
                }
            }
        }

        normaliseAnimationAttributes(attr);

        const el = this.el("animate", attr);
        if (insertionTarget) {
            insertionTarget.add(el);
        }
        return el;
    };

    /**
     * An Alias for animate tag to be able to copy to Element. Needed because Element has an animate method
     * with a different function.
    * @type {Function}
     */
    proto.animate_el = proto.animate

    /**
     * Creates an `<animateTransform>` element.
     *
     * Accepts the standard animateTransform attributes in positional order, or via an attribute object.
     * As with {@link Snap.Paper#animate}, the final argument may be a target element that receives the
     * animation node.
     *
     * @function Snap.Paper#animateTransform
     * @param {string} [type] Transform type ("translate", "scale", "rotate", "skewX", "skewY").
     * @param {(string|number)} [from] Starting transform value.
     * @param {(string|number)} [to] Ending transform value.
     * @param {(string|number)} [dur] Animation duration.
     * @param {(string|number)} [begin] Delay before start.
     * @param {(string|number)} [repeatCount] Repeat configuration.
     * @param {string} [fill] Fill mode (e.g. "freeze").
     * @param {string} [calcMode] Interpolation mode.
     * @param {(string|Array)} [values] Value list for keyframe animation.
     * @param {(string|Array)} [keyTimes] Key time list matching `values`.
     * @param {(string|Array)} [keySplines] Bezier control points for spline timing.
     * @param {(string|number)} [by] Relative delta value.
     * @param {string} [additive] Additive mode.
     * @param {string} [accumulate] Accumulate mode.
     * @param {Object} [attr] Additional attributes for the `<animateTransform>` element.
     * @param {Snap.Element} [target] Element that receives the animation via `.add`.
     * @returns {Snap.Element} The `<animateTransform>` element.
     */
    proto.animateTransform = function () {
        const args = Array.prototype.slice.call(arguments);
        let insertionTarget = null;
        let attr = {};

        if (args.length && Snap.is(args[args.length - 1], "Element")) {
            insertionTarget = args.pop();
        }

        if (args.length && isPlainObject(args[args.length - 1])) {
            attr = args.pop();
        }

        if (args.length === 1 && isPlainObject(args[0])) {
            Object.assign(attr, args.pop());
        } else if (args.length) {
            const keys = [
                "type",
                "from",
                "to",
                "dur",
                "begin",
                "repeatCount",
                "fill",
                "calcMode",
                "values",
                "keyTimes",
                "keySplines",
                "by",
                "additive",
                "accumulate"
            ];
            for (let i = 0; i < keys.length && i < args.length; ++i) {
                const value = args[i];
                if (value != null && attr[keys[i]] == null) {
                    attr[keys[i]] = value;
                }
            }
        }

        if (attr.attributeName == null) {
            attr.attributeName = "transform";
        }

        normaliseAnimationAttributes(attr);

        const el = this.el("animateTransform", attr);
        if (insertionTarget) {
            insertionTarget.add(el);
        }
        return el;
    };

    /**
     * An Alias for animateTransform tag to be able to copy to Element. Needed because Element has an
     * animateTransform method with a different function.
    * @type {Function}
     */
    proto.animateTransform_el = proto.animateTransform

    /**
     * Creates an `<animateMotion>` element, optionally wiring it to an existing motion path via `<mpath>`.
     *
     * The first positional argument may be a path data string, an array of path segments, a Snap element,
     * or a `#id` reference. When an element or reference is supplied, an `<mpath>` child is generated
     * automatically. As with {@link Snap.Paper#animate}, the final argument may be a target element that
     * receives the animation node.
     *
     * @function Snap.Paper#animateMotion
     * @param {(string|Array|Snap.Element)} [path] Motion path specification or reference.
     * @param {(string|number)} [dur] Animation duration.
     * @param {(string|number)} [begin] Delay before start.
     * @param {(string|number)} [repeatCount] Repeat configuration.
     * @param {(string|number)} [rotate] Rotation behaviour (`"auto"`, angle, etc.).
     * @param {string} [calcMode] Interpolation mode.
     * @param {(string|Array)} [keyPoints] Fractional positions along the path.
     * @param {(string|Array)} [keyTimes] Key timing list.
     * @param {(string|Array)} [keySplines] Spline control points for timing.
     * @param {Object} [attr] Additional attributes for `<animateMotion>`.
     * @param {Snap.Element} [target] Element that should receive the animation via `.add`.
     * @returns {Snap.Element} The `<animateMotion>` element.
     */
    proto.animateMotion = function () {
        const args = Array.prototype.slice.call(arguments);
        let insertionTarget = null;
        let attr = {};
        let pathInput;

        if (args.length && Snap.is(args[args.length - 1], "Element")) {
            insertionTarget = args.pop();
        }

        if (args.length && isPlainObject(args[args.length - 1])) {
            attr = args.pop();
        }

        if (args.length === 1 && isPlainObject(args[0])) {
            Object.assign(attr, args.pop());
        } else if (args.length) {
            pathInput = args.shift();
            const keys = [
                "dur",
                "begin",
                "repeatCount",
                "rotate",
                "calcMode",
                "keyPoints",
                "keyTimes",
                "keySplines"
            ];
            for (let i = 0; i < keys.length && i < args.length; ++i) {
                const value = args[i];
                if (value != null && attr[keys[i]] == null) {
                    attr[keys[i]] = value;
                }
            }
        }

        if (pathInput == null && attr.path != null) {
            pathInput = attr.path;
            delete attr.path;
        }

        let mpathSource = null;
        if (Snap.is(pathInput, "Element")) {
            mpathSource = pathInput;
        } else if (Array.isArray(pathInput)) {
            attr.path = Snap.path && Snap.path.toString ? Snap.path.toString.call(pathInput) : pathInput.join(" ");
        } else if (typeof pathInput === "string") {
            if (pathInput.charAt(0) === "#") {
                mpathSource = pathInput;
            } else {
                attr.path = pathInput;
            }
        } else if (pathInput && pathInput.node && pathInput.node.tagName === "path") {
            mpathSource = Snap(pathInput);
        }

        if (attr.path != null && Array.isArray(attr.path)) {
            attr.path = Snap.path && Snap.path.toString ? Snap.path.toString.call(attr.path) : attr.path.join(" ");
        }

        normaliseAnimationAttributes(attr);

        const el = this.el("animateMotion", attr);

        if (mpathSource) {
            const mpathEl = this.mpath(mpathSource);
            el.add(mpathEl);
        }

        if (insertionTarget) {
            insertionTarget.add(el);
        }

        return el;
    };

    /**
     * Creates an `<mpath>` element referencing a motion path definition.
     *
     * @function Snap.Paper#mpath
     * @param {(string|Array|Snap.Element|Object)} path Path data, existing path element, `#id` reference,
     *        or attribute map containing `href`/`xlink:href`.
     * @param {Object} [attr] Additional attributes for `<mpath>`.
     * @returns {Snap.Element} The `<mpath>` element.
     */
    proto.mpath = function (path, attr) {
        let attributes = attr;
        let pathInput = path;

        if (attr == null && isPlainObject(path)) {
            attributes = path;
            pathInput = attributes.path || attributes["xlink:href"] || attributes.href;
        }

        attributes = attributes || {};

        let hrefValue = attributes["xlink:href"] || attributes.href;
        let targetPath = null;
        let createdPath = false;

        if (Snap.is(pathInput, "Element")) {
            targetPath = pathInput;
        } else if (Array.isArray(pathInput)) {
            targetPath = this.path(pathInput);
            createdPath = true;
        } else if (typeof pathInput === "string") {
            if (pathInput.charAt(0) === "#") {
                hrefValue = pathInput;
            } else if (pathInput) {
                targetPath = this.path(pathInput);
                createdPath = true;
            }
        } else if (pathInput && pathInput.node && pathInput.node.tagName === "path") {
            targetPath = Snap(pathInput);
        }

        if (targetPath) {
            let id = targetPath.attr("id");
            if (!id) {
                id = Snap._.id(targetPath);
                targetPath.attr({id: id});
            }
            hrefValue = "#" + id;

            if (createdPath) {
                const defs = getSomeDefs(this);
                if (defs) {
                    const group = defs.querySelector("#motion-paths");
                    (group || defs).appendChild(targetPath.node);
                }
            }
        }

        if (hrefValue) {
            attributes["xlink:href"] = hrefValue;
            attributes.href = hrefValue;
        }

        delete attributes.path;

        return this.el("mpath", attributes);
    };

    
    /**
     * Draws a line segment between two points.
     *
     * @function Snap.Paper#line
     * @param {number} x1 Start point X coordinate.
     * @param {number} y1 Start point Y coordinate.
     * @param {number} x2 End point X coordinate.
     * @param {number} y2 End point Y coordinate.
     * @param {Object} [attr] Attribute map for the line element.
     * @returns {Snap.Element} The line element.
     */
    proto.line = function (x1, y1, x2, y2, attr) {
        attr = attr || {};
        if (is(x1, "object")) {
            attr = x1;
        } else if (x1 != null) {
            attr = Object.assign(attr, {
                x1: x1,
                x2: x2,
                y1: y1,
                y2: y2
            });
        }
        return this.el("line", attr);
    };

    function point_args(args) {
        let points, attr;
        if (args.length) {
            points = Array.prototype.slice.call(args, 0);
            const last = points[points.length - 1];
            if (is(last, "object") && !Array.isArray(last)) {
                attr = points.pop();
            } else {
                attr = {};
            }
            if (points.length === 1 && Array.isArray(points[0])) {
                points = points[0];
            }
        }

        if (points != null) {
            attr = attr || {};
            attr.points = points;
        }
        return attr;
    }

    /**
     * Draws a polyline through a list of coordinates.
     *
     * @function Snap.Paper#polyline
     * @param {(Array.<number>|...number)} points Coordinate list. Provide either a flat array or individual arguments.
     * @param {Object} [attr] Attribute map applied to the element.
     * @returns {Snap.Element} The polyline element.
     */
    proto.polyline = function (points, attr) {
        attr = point_args(Array.from(arguments));
        return this.el("polyline", attr);
    };


    /**
     * Draws a closed polygon by joining supplied coordinates.
     *
     * @function Snap.Paper#polygon
     * @see Snap.Paper#polyline
     * @param {(Array.<number>|...number)} points Coordinate list as an array or individual numbers.
     * @param {Object} [attr] Attribute map for the polygon element.
     * @returns {Snap.Element} The polygon element.
     */
    proto.polygon = function (points, attr) {
        attr = point_args(Array.from(arguments));
        return this.el("polygon", attr);
    };
// gradients
    (function () {
        var $ = Snap._.$;
        // gradients' helpers
        /**
         * Returns all gradient stop elements.
         *
         * @function Snap.Element#stops
         * @memberof Snap.Element
         * @returns {Snap.Set} Collection of `<stop>` elements.
         */
        function Gstops() {
            return this.selectAll("stop");
        }

        /**
         * Adds a stop to the gradient.
         *
         * @function Snap.Element#addStop
         * @memberof Snap.Element
         * @param {string} color Stop colour.
         * @param {number} offset Stop offset from `0` to `100`.
         * @returns {Snap.Element} The gradient element.
         */
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
            var stops = this.stops(),
                inserted;
            for (var i = 0; i < stops.length; ++i) {
                var stopOffset = parseFloat(stops[i].attr("offset"));
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
                var x1 = $(this.node, "x1") || 0,
                    x2 = $(this.node, "x2") || 1,
                    y1 = $(this.node, "y1") || 0,
                    y2 = $(this.node, "y2") || 0;
                return Snap.box(x1, y1, math.abs(x2 - x1), math.abs(y2 - y1));
            } else {
                var cx = this.node.cx || .5,
                    cy = this.node.cy || .5,
                    r = this.node.r || 0;
                return Snap.box(cx - r, cy - r, r * 2, r * 2);
            }
        }

    /**
     * Updates gradient stops based on a descriptor string or parsed structure.
     *
     * @function Snap.Element#setStops
     * @memberof Snap.Element
     * @param {(string|Array)} str Gradient descriptor (after the `()` portion) or parsed stops array.
     * @returns {Snap.Element} The gradient element.
     * @example
     * const grad = paper.gradient("l(0, 0, 1, 1)#000-#f00-#fff");
     * grad.setStops("#fff-#000-#f00-#fc0");
     */
        function GsetStops(str) {
            var grad = str,
                stops = this.stops();
            if (typeof str == "string") {
                grad = eve(["snap", "util", "grad", "parse"], null, "l(0,0,0,1)" + str).firstDefined().stops;
            }
            if (!Snap.is(grad, "array")) {
                return;
            }
            for (var i = 0; i < stops.length; ++i) {
                if (grad[i]) {
                    var color = Snap.color(grad[i].color),
                        attr = {"offset": grad[i].offset + "%"};
                    attr["stop-color"] = color.hex;
                    if (color.opacity < 1) {
                        attr["stop-opacity"] = color.opacity;
                    }
                    stops[i].attr(attr);
                } else {
                    stops[i].remove();
                }
            }
            for (i = stops.length; i < grad.length; ++i) {
                this.addStop(grad[i].color, grad[i].offset);
            }
            return this;
        }

        function gradient(defs, str) {
            var grad = eve(["snap", "util", "grad", "parse"], null, str).firstDefined(),
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
                len = stops.length;
            for (var i = 0; i < len; ++i) {
                var stop = stops[i];
                el.addStop(stop.color, stop.offset);
            }
            return el;
        }

        function gradientLinear(defs, x1, y1, x2, y2) {
            var el = Snap._.make("linearGradient", defs);
            el.stops = Gstops;
            el.addStop = GaddStop;
            el.getBBox = GgetBBox;
            el.setStops = GsetStops;
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
            var el = Snap._.make("radialGradient", defs);
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

        /**
         * Creates an SVG gradient element from a descriptor string.
         * The descriptor has the format `<type>(<coords>)<stops>` where `type` is one of `l`, `L`,
         * `r`, or `R` (lowercase for relative coordinates, uppercase for absolute). Coordinates define
         * the gradient line or circle and stops are dash-separated colour values with optional
         * `:offset` suffixes.
         *
         * @function Snap.Paper#gradient
         * @param {string} str Gradient descriptor.
         * @returns {Snap.Element} The gradient element.
         * @example
         * const grad = paper.gradient("l(0, 0, 1, 1)#000-#f00-#fff");
         * paper.circle(50, 50, 40).attr({fill: grad});
         */
        proto.gradient = function (str) {
            return gradient(this.defs, str);
        };
        /**
         * Creates a linear gradient with the given bounding coordinates.
         * @function Snap.Paper#gradientLinear
         * @param {number} x1 Start x coordinate.
         * @param {number} y1 Start y coordinate.
         * @param {number} x2 End x coordinate.
         * @param {number} y2 End y coordinate.
         * @returns {Snap.Element} The linear gradient element.
         */
        proto.gradientLinear = function (x1, y1, x2, y2) {
            return gradientLinear(this.defs, x1, y1, x2, y2);
        };
        /**
         * Creates a radial gradient centred at the supplied coordinates.
         * @function Snap.Paper#gradientRadial
         * @param {number} cx Centre x coordinate.
         * @param {number} cy Centre y coordinate.
         * @param {number} r Radius of the gradient.
         * @param {number} [fx] Optional focal x coordinate.
         * @param {number} [fy] Optional focal y coordinate.
         * @returns {Snap.Element} The radial gradient element.
         */
        proto.gradientRadial = function (cx, cy, r, fx, fy) {
            return gradientRadial(this.defs, cx, cy, r, fx, fy);
        };
    /**
     * Serialises the paper to SVG markup.
     *
     * @function Snap.Paper#toString
     * @returns {string} SVG markup representing the paper.
     */
        proto.toString = function () {
            var doc = this.node.ownerDocument,
                f = doc.createDocumentFragment(),
                d = doc.createElement("div"),
                svg = this.node.cloneNode(true),
                res;
            f.appendChild(d);
            d.appendChild(svg);
            Snap._.$(svg, {xmlns: "http://www.w3.org/2000/svg"});
            res = d.innerHTML;
            f.removeChild(f.firstChild);
            return res;
        };
        proto.toString.skip = true;
    /**
     * Serialises the paper to a Data URI containing SVG markup.
     *
     * @function Snap.Paper#toDataURL
     * @returns {string} Data URI string for the paper's SVG content.
     */
        proto.toDataURL = function () {
            if (window && window.btoa) {
                if (window && window.btoa) {
                    return "data:image/svg+xml;base64," + btoa(
                        encodeURIComponent(String(this)).replace(/%([0-9A-F]{2})/g, function(_, p1) {
                            return String.fromCharCode(parseInt(p1, 16));
                        })
                    );
                }
            }
        };
        proto.toDataURL.skip = true;
    /**
     * Removes all child nodes of the paper except its `<defs>` block.
     *
     * @function Snap.Paper#clear
     */
        proto.clear = function () {
            var node = this.node.firstChild,
                next;
            while (node) {
                next = node.nextSibling;
                if (node.tagName != "defs") {
                    node.parentNode.removeChild(node);
                } else {
                    proto.clear.call({node: node});
                }
                node = next;
            }
        };
        proto.clear.skip = true;
    }());

    /**
     * Paper.el @method
     *
     * Creates an element on paper with a given name and no attributes
     *
     * @param {string} name - tag name
     * @param {object} attr - attributes
     * @returns {Element} the current element
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
     */
    proto.el = function (name, attr) {
        const el = make(name, this.node);
        attr && el.attr(attr);
        return el;
    };

    //MeasureText
    Snap.measureTextClientRect = function (text_el) {
        if (!Snap._.measureSVG) {
            Snap._.measureSVG = Snap(100, 100).attr("style", "position:absolute;left:-9999px;top:-9999px; pointer-events:none");
        }
        let temp_clone = text_el.node.cloneNode(true);
        temp_clone.removeAttribute("transform");
        Snap._.measureSVG.node.appendChild(temp_clone);
        const rect = temp_clone.getBoundingClientRect();
        const parent_rect = Snap._.measureSVG.node.getBoundingClientRect();
        temp_clone.remove();
        return {
            left: rect.left - parent_rect.left, top: rect.top - parent_rect.top,
            width: rect.width, height: rect.height
        };
    }
})
;
