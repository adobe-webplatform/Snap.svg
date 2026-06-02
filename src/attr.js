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
Snap.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {
    const has = "hasOwnProperty",
        make = Snap._.make,
        wrap = Snap._.wrap,
        is = Snap.is,
        getSomeDefs = Snap._.getSomeDefs,
        reURLValue = /^url\((['"]?)([^)]+)\1\)$/,
        $ = Snap._.$,
        URL = Snap.url,
        Str = String,
        separator = Snap._.separator,
        E = "";
    /**
     * Snap.deurl @method
     *
     * Unwraps path from `"url(<path>)"`.
     * @param {string} value - url path
     * @returns {string} unwrapped path
     */
    Snap.deurl = function (value) {
        const res = String(value).match(reURLValue);
        return res ? res[2] : value;
    }
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
            }
            !mask.node.id && $(mask.node, {
                id: mask.id
            }, this);
            mask.attrMonitor("id");
            $(this.node, {
                mask: URL(mask.id)
            }, this);
            this.attrMonitor("mask");
        }
    });
    (function (clipIt) {
        eve.on("snap.util.attr.clip", clipIt);
        eve.on("snap.util.attr.clip-path", clipIt);
        eve.on("snap.util.attr.clipPath", clipIt);
    }(function (value) {
        if (value instanceof Element || value instanceof Fragment) {
            eve.stop();
            const ElementClass = Snap.getClass("Element");
            let clip,
                node = value.node;
            while (node) {
                if (node.nodeName === "clipPath") {
                    clip = new ElementClass(node);
                    break;
                }
                if (node.nodeName === "svg") {
                    clip = undefined;
                    break;
                }
                node = node.parentNode;
            }
            if (!clip) {
                clip = make("clipPath", getSomeDefs(this));
                clip.node.appendChild(value.node);
                !clip.node.id && $(clip.node, {
                    id: clip.id
                }, this);
            }
            $(this.node, {
                "clip-path": URL(clip.node.id || clip.id)
            }, this);
            this.attrMonitor("clip-path");
            this.clearCHull();
        }
    }));

    function fillStroke(name) {
        return function (value, force_attribute) {
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
                if (value.type == "radialgradient" || value.type == "lineargradient"
                    || value.type == "pattern") {
                    if (!value.node.id) {
                        $(value.node, {
                            id: value.id
                        }, this);
                    }
                    var fill = URL(value.node.id);
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
                                id: grad.id
                            }, this);
                        }
                        fill = URL(grad.node.id);
                    } else {
                        fill = value;
                    }
                } else {
                    fill = Str(fill);
                }
            }
            const attrs = {};
            attrs[name] = fill;
            $(this.node, attrs, this);
            this.node.style[name] = E;
            this.attrMonitor(name);
        };
    }

    eve.on("snap.util.attr.fill", fillStroke("fill"));
    eve.on("snap.util.attr.stroke", fillStroke("stroke"));
    const gradrg = /^([lr])(?:\(([^)]*)\))?(.*)$/i;
    eve.on("snap.util.grad.parse", function parseGrad(string) {
        string = Str(string);
        const tokens = string.match(gradrg);
        if (!tokens) {
            return null;
        }
        const type = tokens[1];
        let params = tokens[2],
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
            const out = {
                color: el[0]
            };
            if (el[1]) {
                out.offset = parseFloat(el[1]);
            }
            return out;
        });
        let len = stops.length,
            start = 0,
            j = 0;

        function seed(i, end) {
            const step = (end - start) / (i - j);
            for (let k = j; k < i; k++) {
                stops[k].offset = +(+start + step * (k - j)).toFixed(2);
            }
            j = i;
            start = end;
        }

        len--;
        for (var i = 0; i < len; ++i) if ("offset" in stops[i]) {
            seed(i, stops[i].offset);
        }
        stops[len].offset = stops[len].offset || 100;
        seed(len, stops[len].offset);
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
        this.clearCHull();
        $(this.node, {d: value}, this);
    })(-1);
    eve.on("snap.util.attr.points", function (value) {
        if (Array.isArray(value)) {
            if (Array.isArray(value[0])) {
                eve.stop();
                let points = [];
                value.forEach((p) => {
                    points.push(p[0]);
                    points.push(p[1]);
                });
                this.attr("points", points);
            } else if (typeof value[0] === "object" && value[0].hasOwnProperty("x")) {
                eve.stop();
                let points = [];
                value.forEach((p) => {
                    points.push(p.x);
                    points.push(p.y);
                });
                this.attr("points", points);
            }
        }
        this.clearCHull();
    })(-1);
    eve.on("snap.util.attr.#text", function (value) {
        eve.stop();
        value = Str(value);
        const txt = glob.doc.createTextNode(value);
        while (this.node.firstChild) {
            this.node.removeChild(this.node.firstChild);
        }
        this.node.appendChild(txt);
        this.clearCHull();
    })(-1);
    eve.on("snap.util.attr.path", function (value) {
        eve.stop();
        this.attr({d: value});
    })(-1);
    eve.on("snap.util.attr.class", function (value) {
        eve.stop();
        if (typeof this.node.className === "object") {
            this.node.className.baseVal = value;
        } else {
            this.node.className = value;
        }
        this.attrMonitor("class");

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
            viewBox: vb
        }, this);
        this.attrMonitor("viewBox");
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
            }, this);
            this.attrMonitor("rx").attrMonitor("ry");

            this.clearCHull();
        }
    })(-1);
    eve.on("snap.util.attr.textpath", function (value) {
        eve.stop();
        if (this.type == "text") {
            let id, tp, node;
            if (!value && this.textPath) {
                tp = this.textPath;
                while (tp.node.firstChild) {
                    this.node.appendChild(tp.node.firstChild);
                }
                tp.remove();
                delete this.textPath;
                return;
            }
            if (is(value, "string")) {
                let defs = getSomeDefs(this);
                const path = wrap(defs.parentNode).path(value),
                    textpath_group = defs.querySelector("#text-paths");
                defs = textpath_group || defs;
                defs.appendChild(path.node);
                id = path.id;
                path.attr({id: id});
            } else {
                value = wrap(value);
                if (value instanceof Element) {
                    id = value.attr("id");
                    if (!id) {
                        id = value.id;
                        value.attr({id: id});
                    }
                }
            }
            if (id) {
                tp = this.textPath;
                node = this.node;
                if (tp) {
                    tp.attr({"xlink:href": "#" + id});
                } else {
                    tp = $("textPath", {
                        "xlink:href": "#" + id
                    }, this);
                    while (node.firstChild) {
                        tp.appendChild(node.firstChild);
                    }
                    node.appendChild(tp);
                    this.textPath = wrap(tp);
                }
            }
            this.clearCHull();
        }
    })(-1);
    eve.on("snap.util.attr.text", function (value) {
        if (this.type == "text") {
            let i = 0;
            const node = this.node,
                tuner = function (chunk) {
                    const out = $("tspan", undefined, this);
                    if (is(chunk, "array")) {
                        for (let i = 0; i < chunk.length; ++i) {
                            const newChild = tuner(chunk[i]);
                            out.appendChild(newChild);
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
            const tuned = tuner(value);
            while (tuned.firstChild) {
                node.appendChild(tuned.firstChild);
            }
            this.clearCHull();
        } else if (this.type === "tspan") {
            this.node.textContent = value;
            this.clearCHull();
        }
        eve.stop();
    })(-1);

    eve.on("snap.util.attr.href", function (value) {
        if (this.type === "use" && this.use_target) this.use_target = undefined;
        this.clearCHull();
        value = Snap.fixUrl(value);
        if (value) {
            $(this.node, {href: value}, this);
        } else {
            this.node.removeAttribute("href");
        }
        this.attrMonitor("href");
    });

    eve.on("snap.util.attr.src", function (value) {
        value = Snap.fixUrl(value);
        if (value) {
            $(this.node, {src: value}, this);
        } else {
            this.node.removeAttribute("src");
        }
        this.attrMonitor("src");
    });

    function setFontSize(value, force_attribute) {
        eve.stop();
        if (value == +value) {
            value += "px";
        }
        if (force_attribute) {
            $(this.node, {"font-size": value}, this);
            this.node.style.fontSize = E;
        } else {
            this.node.style.fontSize = value;
        }
        this.attrMonitor(["font-size", "fontSize"]);
        this.clearCHull();
    }

    eve.on("snap.util.attr.fontSize", setFontSize)(-1);
    eve.on("snap.util.attr.font-size", setFontSize)(-1);

    function fontClearBox(value) {
        this.clearCHull();
    }

    //Attributs
    eve.on("snap.util.attr.fontFamily", fontClearBox)(-1);
    eve.on("snap.util.attr.font-family", fontClearBox)(-1);
    eve.on("snap.util.attr.fontWeight", fontClearBox)(-1);
    eve.on("snap.util.attr.font-weight", fontClearBox)(-1);
    eve.on("snap.util.attr.fontStyle", fontClearBox)(-1);
    eve.on("snap.util.attr.font-style", fontClearBox)(-1);
    eve.on("snap.util.attr.letterSpacing", fontClearBox)(-1);
    eve.on("snap.util.attr.letter-spacing", fontClearBox)(-1);
    eve.on("snap.util.attr.wordSpacing", fontClearBox)(-1);
    eve.on("snap.util.attr.word-spacing", fontClearBox)(-1);
    eve.on("snap.util.attr.textAnchor", fontClearBox)(-1);
    eve.on("snap.util.attr.text-anchor", fontClearBox)(-1);

    eve.on("snap.util.getattr.transform", function () {
        eve.stop();
        return this.transform();
    })(-1);
    eve.on("snap.util.getattr.textpath", function () {
        eve.stop();
        return this.textPath;
    })(-1);
    // Markers
    (function () {
        function getter(end) {
            return function () {
                eve.stop();
                const style = glob.doc.defaultView.getComputedStyle(this.node, null).getPropertyValue("marker-" + end);
                if (style == "none") {
                    return style;
                } else {
                    return Snap(glob.doc.getElementById(style.match(reURLValue)[1]));
                }
            };
        }

        function setter(end) {
            return function (value, force_attribute) {
                eve.stop();
                const name = "marker" + end.charAt(0).toUpperCase() + end.substring(1);
                const attrName = "marker-" + end;
                let markerValue;
                if (value == "" || !value) {
                    markerValue = "none";
                } else if (value.type == "marker") {
                    let id = value.node.id;
                    if (!id) {
                        $(value.node, {id: value.id}, this);
                        value.attrMonitor("id");
                        id = value.id;
                    }
                    markerValue = URL(id);
                } else {
                    markerValue = value;
                }

                if (force_attribute) {
                    const attrs = {};
                    attrs[attrName] = markerValue;
                    $(this.node, attrs, this);
                    this.node.style[name] = E;
                } else {
                    this.node.style[name] = markerValue;
                }
                this.attrMonitor(name);
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
        if (this.type == "rect" && $(this.node, "rx", this) == $(this.node, "ry", this)) {
            eve.stop();
            return $(this.node, "rx", this);
        }
    })(-1);

    function textExtract(node) {
        const out = [];
        const children = node.childNodes;
        let i = 0;
        const ii = children.length;
        for (; i < ii; ++i) {
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
    }

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
        const value = eve(["snap", "util", "getattr", "fill"], this, true).firstDefined();
        return Snap(Snap.deurl(value)) || value;
    })(-1);
    eve.on("snap.util.getattr.stroke", function (internal) {
        if (internal) {
            return;
        }
        eve.stop();
        const value = eve(["snap", "util", "getattr", "stroke"], this, true).firstDefined();
        return Snap(Snap.deurl(value)) || value;
    })(-1);
    eve.on("snap.util.getattr.viewBox", function () {
        eve.stop();
        let vb = $(this.node, "viewBox", this).trim();
        if (vb) {
            vb = vb.split(separator);
            return Snap.box(+vb[0], +vb[1], +vb[2], +vb[3]);
        } else {
            return;
        }
    })(-1);
    eve.on("snap.util.getattr.points", function () {
        const p = $(this.node, "points", this).trim();
        eve.stop();
        if (p) {

            return p.split(separator);
        } else {
            return;
        }
    })(-1);
    eve.on("snap.util.getattr.path", function () {
        const p = $(this.node, "d", this).trim();
        eve.stop();
        return p;
    })(-1);
    eve.on("snap.util.getattr.class", function () {
        return (typeof this.node.className === "string") ? this.node.className : this.node.className.baseVal;
    })(-1);

    function getFontSize() {
        eve.stop();
        const inline = this.node.style.fontSize;
        if (inline) {
            return inline;
        }
        return $(this.node, "font-size", this) || inline;
    }

    eve.on("snap.util.getattr.fontSize", getFontSize)(-1);
    eve.on("snap.util.getattr.font-size", getFontSize)(-1);
});
