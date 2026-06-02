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
    var elproto = Element.prototype,
        pproto = Paper.prototype,
        rgurl = /^\s*url\((.+)\)/,
        Str = String,
        $ = Snap._.$;
    Snap.filter = {};
    /**
     * Paper.filter @method
     *
     * Creates a `<filter>` element
     *
     * @param {string} filstr - SVG fragment of filter provided as a string
     * @returns {object} @Element
     * Note: It is recommended to use filters embedded into the page inside an empty SVG element.
     > Usage
     | var f = paper.filter('<feGaussianBlur stdDeviation="2"/>'),
     |     c = paper.circle(10, 10, 10).attr({
     |         filter: f
     |     });
     */
    pproto.filter = function (filstr, local) {
        var paper = this;
        if (paper.type != "svg") {
            paper = paper.paper;
        }
        var f = Snap.parse(Str(filstr)),
            id = Snap._.id(),
            // width = paper.node.offsetWidth,
            // height = paper.node.offsetHeight,
            filter = $("filter", undefined, this);
        $(filter, {
            id: id,
            filterUnits: (local) ? "objectBoundingBox" : "userSpaceOnUse",
        }, this);
        filter.appendChild(f.node);
        paper.defs.appendChild(filter);
        const ElementClass = Snap.getClass("Element");
        const element = new ElementClass(filter);
        let deffun = filter.querySelector("[deffun]");
        if (deffun) {
            let type = deffun.getAttribute("deffun");
            if (updates.hasOwnProperty(type)) element.update = updates[type].bind(
                element);
        }
        return element;
    };

    const updates = {};

    eve.on("snap.util.getattr.filter", function () {
        eve.stop();
        var p = $(this.node, "filter", this);
        if (p) {
            var match = Str(p).match(rgurl);
            return match && Snap.select(match[1]);
        }
    })(-1);
    eve.on("snap.util.attr.filter", function (value) {
        if (value instanceof Element && value.type == "filter") {
            eve.stop();
            var id = value.node.id;
            if (!id) {
                $(value.node, {id: value.id}, this);
                id = value.id;
            }
            $(this.node, {
                filter: Snap.url(id),
            }, this);
        }
        if (!value || value == "none") {
            eve.stop();
            this.node.removeAttribute("filter");
        }
    })(-1);
    /**
     * Snap.filter.blur @method
     *
     * Returns an SVG markup string for the blur filter
     *
     * @param {number} x - amount of horizontal blur, in pixels
     * @param {number} y - #optional amount of vertical blur, in pixels
     * @returns {string} filter representation
     > Usage
     | var f = paper.filter(Snap.filter.blur(5, 10)),
     |     c = paper.circle(10, 10, 10).attr({
     |         filter: f
     |     });
     */
    Snap.filter.blur = function (x, y) {
        if (x == null) {
            x = 2;
        }
        var def = y == null ? x : [x, y];
        const filter_str = Snap.format(
            "<feGaussianBlur deffun=\"blur\" stdDeviation=\"{def}\"/>", {
                def: def,
            });

        return filter_str;
    };
    Snap.filter.blur.toString = function () {
        return this();
    };
    updates.blur = function blur_update(x, y) {
        if (x == null) {
            x = 2;
        }
        var def = y == null ? x : [x, y];
        let feGaussianBlur = this.select("feGaussianBlur");
        feGaussianBlur.node.setAttribute("stdDeviation",
            Snap.format("{def}", {def: def}));
    };
    /**
     * Snap.filter.shadow @method
     *
     * Returns an SVG markup string for the shadow filter
     *
     * @param {number} dx - #optional horizontal shift of the shadow, in pixels
     * @param {number} dy - #optional vertical shift of the shadow, in pixels
     * @param {number} blur - #optional amount of blur
     * @param {string} color - #optional color of the shadow
     * @param {number} opacity - #optional `0..1` opacity of the shadow
     * or
     * @param {number} dx - #optional horizontal shift of the shadow, in pixels
     * @param {number} dy - #optional vertical shift of the shadow, in pixels
     * @param {string} color - #optional color of the shadow
     * @param {number} opacity - #optional `0..1` opacity of the shadow
     * which makes blur default to `4`. Or
     * @param {number} dx - #optional horizontal shift of the shadow, in pixels
     * @param {number} dy - #optional vertical shift of the shadow, in pixels
     * @param {number} opacity - #optional `0..1` opacity of the shadow
     * @returns {string} filter representation
     > Usage
     | var f = paper.filter(Snap.filter.shadow(0, 2, .3)),
     |     c = paper.circle(10, 10, 10).attr({
     |         filter: f
     |     });
     */
    Snap.filter.shadow = function (dx, dy, blur, color, opacity) {
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
        return Snap.format(
           "<feGaussianBlur in=\"SourceAlpha\" stdDeviation=\"{blur}\"/>" +
           "<feOffset dx=\"{dx}\" dy=\"{dy}\" result=\"offsetblur\"/>" +
           "<feFlood flood-color=\"{color}\"/>" +
           "<feComposite in2=\"offsetblur\" operator=\"in\"/>" +
           "<feComponentTransfer><feFuncA type=\"linear\" slope=\"{opacity}\"/></feComponentTransfer>" +
           "<feMerge><feMergeNode/><feMergeNode in=\"SourceGraphic\"/></feMerge>",
            {
                color: color,
                dx: dx,
                dy: dy,
                blur: blur,
                opacity: opacity,
            });
    };
    Snap.filter.shadow.toString = function () {
        return this();
    };
    /**
     * Snap.filter.grayscale @method
     *
     * Returns an SVG markup string for the grayscale filter
     *
     * @param {number} amount - amount of filter (`0..1`)
     * @returns {string} filter representation
     */
    Snap.filter.grayscale = function (amount) {
        if (amount == null) {
            amount = 1;
        }
        return Snap.format(
            "<feColorMatrix type=\"matrix\" values=\"{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {b} {h} 0 0 0 0 0 1 0\"/>",
            {
                a: 0.2126 + 0.7874 * (1 - amount),
                b: 0.7152 - 0.7152 * (1 - amount),
                c: 0.0722 - 0.0722 * (1 - amount),
                d: 0.2126 - 0.2126 * (1 - amount),
                e: 0.7152 + 0.2848 * (1 - amount),
                f: 0.0722 - 0.0722 * (1 - amount),
                g: 0.2126 - 0.2126 * (1 - amount),
                h: 0.0722 + 0.9278 * (1 - amount),
            });
    };
    Snap.filter.grayscale.toString = function () {
        return this();
    };
    /**
     * Snap.filter.sepia @method
     *
     * Returns an SVG markup string for the sepia filter
     *
     * @param {number} amount - amount of filter (`0..1`)
     * @returns {string} filter representation
     */
    Snap.filter.sepia = function (amount) {
        if (amount == null) {
            amount = 1;
        }
        return Snap.format(
            "<feColorMatrix type=\"matrix\" values=\"{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {h} {i} 0 0 0 0 0 1 0\"/>",
            {
                a: 0.393 + 0.607 * (1 - amount),
                b: 0.769 - 0.769 * (1 - amount),
                c: 0.189 - 0.189 * (1 - amount),
                d: 0.349 - 0.349 * (1 - amount),
                e: 0.686 + 0.314 * (1 - amount),
                f: 0.168 - 0.168 * (1 - amount),
                g: 0.272 - 0.272 * (1 - amount),
                h: 0.534 - 0.534 * (1 - amount),
                i: 0.131 + 0.869 * (1 - amount),
            });
    };
    Snap.filter.sepia.toString = function () {
        return this();
    };
    /**
     * Snap.filter.saturate @method
     *
     * Returns an SVG markup string for the saturate filter
     *
     * @param {number} amount - amount of filter (`0..1`)
     * @returns {string} filter representation
     */
    Snap.filter.saturate = function (amount) {
        if (amount == null) {
            amount = 1;
        }
        return Snap.format("<feColorMatrix type=\"saturate\" values=\"{amount}\"/>", {
            amount: 1 - amount,
        });
    };
    Snap.filter.saturate.toString = function () {
        return this();
    };
    /**
     * Snap.filter.hueRotate @method
     *
     * Returns an SVG markup string for the hue-rotate filter
     *
     * @param {number} angle - angle of rotation
     * @returns {string} filter representation
     */
    Snap.filter.hueRotate = function (angle) {
        angle = angle || 0;
        return Snap.format(
            "<feColorMatrix type=\"hueRotate\" values=\"{angle}\"/>",
            {
                angle: angle,
            });
    };
    Snap.filter.hueRotate.toString = function () {
        return this();
    };
    /**
     * Snap.filter.invert @method
     *
     * Returns an SVG markup string for the invert filter
     *
     * @param {number} amount - amount of filter (`0..1`)
     * @returns {string} filter representation
     */
    Snap.filter.invert = function (amount) {
        if (amount == null) {
            amount = 1;
        }
//        <feColorMatrix type="matrix" values="-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0" color-interpolation-filters="sRGB"/>
        return Snap.format(
            "<feComponentTransfer><feFuncR type=\"table\" tableValues=\"{amount} {amount2}\"/><feFuncG type=\"table\" tableValues=\"{amount} {amount2}\"/><feFuncB type=\"table\" tableValues=\"{amount} {amount2}\"/></feComponentTransfer>",
            {
                amount: amount,
                amount2: 1 - amount,
            });
    };
    Snap.filter.invert.toString = function () {
        return this();
    };
    /**
     * Snap.filter.brightness @method
     *
     * Returns an SVG markup string for the brightness filter
     *
     * @param {number} amount - amount of filter (`0..1`)
     * @returns {string} filter representation
     */
    Snap.filter.brightness = function (amount) {
        if (amount == null) {
            amount = 1;
        }
        return Snap.format(
            "<feComponentTransfer><feFuncR type=\"linear\" slope=\"{amount}\"/><feFuncG type=\"linear\" slope=\"{amount}\"/><feFuncB type=\"linear\" slope=\"{amount}\"/></feComponentTransfer>",
            {
                amount: amount,
            });
    };
    Snap.filter.brightness.toString = function () {
        return this();
    };
    /**
     * Snap.filter.contrast @method
     *
     * Returns an SVG markup string for the contrast filter
     *
     * @param {number} amount - amount of filter (`0..1`)
     * @returns {string} filter representation
     */
    Snap.filter.contrast = function (amount) {
        if (amount == null) {
            amount = 1;
        }
        return Snap.format(
            "<feComponentTransfer><feFuncR type=\"linear\" slope=\"{amount}\" intercept=\"{amount2}\"/><feFuncG type=\"linear\" slope=\"{amount}\" intercept=\"{amount2}\"/><feFuncB type=\"linear\" slope=\"{amount}\" intercept=\"{amount2}\"/></feComponentTransfer>",
            {
                amount: amount,
                amount2: .5 - amount / 2,
            });
    };
    Snap.filter.contrast.toString = function () {
        return this();
    };
    /**
     * Snap.filter.dropShadow @method
     *
     * Returns an SVG markup string for the drop shadow filter (more efficient than shadow)
     *
     * @param {number} dx - #optional horizontal offset of the shadow, default 2
     * @param {number} dy - #optional vertical offset of the shadow, default 2
     * @param {number} blur - #optional blur amount, default 3
     * @param {string} color - #optional shadow color, default "#000"
     * @param {number} opacity - #optional shadow opacity (0..1), default 0.5
     * @returns {string} filter representation
     */
    Snap.filter.dropShadow = function (dx, dy, blur, color, opacity) {
        dx = dx == null ? 2 : dx;
        dy = dy == null ? 2 : dy;
        blur = blur == null ? 3 : blur;
        color = color || "#000";
        opacity = opacity == null ? 0.5 : opacity;
        color = Snap.color(color);
        return Snap.format(
            "<feDropShadow dx=\"{dx}\" dy=\"{dy}\" stdDeviation=\"{blur}\" flood-color=\"{color}\" flood-opacity=\"{opacity}\"/>",
            {
                dx: dx,
                dy: dy,
                blur: blur,
                color: color,
                opacity: opacity
            });
    };
    Snap.filter.dropShadow.toString = function () {
        return this();
    };
    /**
     * Snap.filter.glow @method
     *
     * Returns an SVG markup string for the glow filter
     *
     * @param {string} color - #optional glow color, default "#fff"
     * @param {number} width - #optional glow width, default 5
     * @param {number} opacity - #optional glow opacity (0..1), default 0.8
     * @returns {string} filter representation
     */
    Snap.filter.glow = function (color, width, opacity) {
        color = color || "#fff";
        width = width == null ? 5 : width;
        opacity = opacity == null ? 0.8 : opacity;
        color = Snap.color(color);
        return Snap.format(
            "<feColorMatrix type=\"matrix\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0\"/>" +
            "<feGaussianBlur stdDeviation=\"{width}\" result=\"coloredBlur\"/>" +
            "<feFlood flood-color=\"{color}\" flood-opacity=\"{opacity}\" result=\"flood\"/>" +
            "<feComposite in=\"flood\" in2=\"coloredBlur\" operator=\"in\" result=\"comp\"/>" +
            "<feMerge><feMergeNode in=\"comp\"/><feMergeNode in=\"SourceGraphic\"/></feMerge>",
            {
                color: color,
                width: width,
                opacity: opacity
            });
    };
    Snap.filter.glow.toString = function () {
        return this();
    };
    /**
     * Snap.filter.innerGlow @method
     *
     * Returns an SVG markup string for the inner glow filter
     *
     * @param {string} color - #optional glow color, default "#fff"
     * @param {number} width - #optional glow width, default 5
     * @param {number} opacity - #optional glow opacity (0..1), default 0.8
     * @returns {string} filter representation
     */
    Snap.filter.innerGlow = function (color, width, opacity) {
        color = color || "#fff";
        width = width == null ? 5 : width;
        opacity = opacity == null ? 0.8 : opacity;
        color = Snap.color(color);
        return Snap.format(
            "<feFlood flood-color=\"{color}\" flood-opacity=\"{opacity}\" result=\"flood\"/>" +
            "<feComposite in=\"flood\" in2=\"SourceGraphic\" operator=\"in\" result=\"comp\"/>" +
            "<feGaussianBlur in=\"comp\" stdDeviation=\"{width}\" result=\"blur\"/>" +
            "<feComposite in=\"blur\" in2=\"SourceGraphic\" operator=\"in\" result=\"final\"/>" +
            "<feMerge><feMergeNode in=\"SourceGraphic\"/><feMergeNode in=\"final\"/></feMerge>",
            {
                color: color,
                width: width,
                opacity: opacity
            });
    };
    Snap.filter.innerGlow.toString = function () {
        return this();
    };
    /**
     * Snap.filter.blur3d @method
     *
     * Returns an SVG markup string for 3D-like blur effect
     *
     * @param {number} depth - #optional depth of 3D effect, default 5
     * @param {string} color - #optional shadow color, default "#000"
     * @returns {string} filter representation
     */
    Snap.filter.blur3d = function (depth, color) {
        depth = depth == null ? 5 : depth;
        color = color || "#000";
        color = Snap.color(color);
        return Snap.format(
            "<feGaussianBlur in=\"SourceAlpha\" stdDeviation=\"{blur}\"/>" +
            "<feOffset dx=\"{offset}\" dy=\"{offset}\" result=\"offsetblur\"/>" +
            "<feFlood flood-color=\"{color}\"/>" +
            "<feComposite in2=\"offsetblur\" operator=\"in\"/>" +
            "<feMerge><feMergeNode/><feMergeNode in=\"SourceGraphic\"/></feMerge>",
            {
                blur: depth / 2,
                offset: depth,
                color: color
            });
    };
    Snap.filter.blur3d.toString = function () {
        return this();
    };
    /**
     * Snap.filter.emboss @method
     *
     * Returns an SVG markup string for emboss filter
     *
     * @param {number} strength - #optional emboss strength, default 1
     * @returns {string} filter representation
     */
    Snap.filter.emboss = function (strength) {
        strength = strength == null ? 1 : strength;
        var s = strength * 5;
        return Snap.format(
            "<feConvolveMatrix order=\"3\" kernelMatrix=\"{k1} {k2} {k3} {k4} {k5} {k6} {k7} {k8} {k9}\"/>",
            {
                k1: -s, k2: -s, k3: 0,
                k4: -s, k5: 1, k6: s,
                k7: 0, k8: s, k9: s
            });
    };
    Snap.filter.emboss.toString = function () {
        return this();
    };
    /**
     * Snap.filter.sharpen @method
     *
     * Returns an SVG markup string for sharpen filter
     *
     * @param {number} amount - #optional sharpen amount, default 1
     * @returns {string} filter representation
     */
    Snap.filter.sharpen = function (amount) {
        amount = amount == null ? 1 : amount;
        var center = 1 + (4 * amount);
        return Snap.format(
            "<feConvolveMatrix order=\"3\" kernelMatrix=\"0 -{amount} 0 -{amount} {center} -{amount} 0 -{amount} 0\"/>",
            {
                amount: amount,
                center: center
            });
    };
    Snap.filter.sharpen.toString = function () {
        return this();
    };
    /**
     * Snap.filter.edge @method
     *
     * Returns an SVG markup string for edge detection filter
     *
     * @param {number} strength - #optional edge detection strength, default 1
     * @returns {string} filter representation
     */
    Snap.filter.edge = function (strength) {
        strength = strength == null ? 0.9 : strength;
        var s = strength;
        var c = strength * 4;
        return Snap.format(
            "<feConvolveMatrix order=\"3\" kernelMatrix=\"0 {s} 0 {s} -{c} {s} 0 {s} 0\" " +
            // "divisor=\"1\"" +
            "/>",
            {
                s: s,
                c: c
            });
    };
    Snap.filter.edge.toString = function () {
        return this();
    };

    Snap.filter.sobel = function (strength, rotation) {
        strength = strength == null ? 1 : strength;
        rotation = rotation == null ? 0 : rotation;
        var s = strength;

        var kernelX, kernelY;

        if (rotation === 45) {
            // Diagonal ↘ Sobel
            kernelX = "0 " + (1*s) + " " + (2*s) + " " + (-1*s) + " 0 " + (1*s) + " " + (-2*s) + " " + (-1*s) + " 0";
            kernelY = kernelX; // single diagonal kernel
        } else if (rotation === 135) {
            // Diagonal ↙ Sobel
            kernelX = (2*s) + " " + (1*s) + " 0 " + (1*s) + " 0 " + (-1*s) + " 0 " + (-1*s) + " " + (-2*s);
            kernelY = kernelX; // single diagonal kernel
        } else {
            // Default back to standard
            kernelX = (-1*s) + " " + (-2*s) + " " + (-1*s) + " 0 0 0 " + (1*s) + " " + (2*s) + " " + (1*s);
            kernelY = (-1*s) + " 0 " + (1*s) + " " + (-2*s) + " 0 " + (2*s) + " " + (-1*s) + " 0 " + (1*s);
        }

        return (
            "<feConvolveMatrix in=\"SourceGraphic\" result=\"sobelX\" order=\"3\" " +
            "kernelMatrix=\"" + kernelX + "\" divisor=\"1\" edgeMode=\"duplicate\"/>" +

            "<feConvolveMatrix in=\"SourceGraphic\" result=\"sobelY\" order=\"3\" " +
            "kernelMatrix=\"" + kernelY + "\" divisor=\"1\" edgeMode=\"duplicate\"/>" +

            "<feComposite in=\"sobelX\" in2=\"sobelY\" operator=\"arithmetic\" " +
            "k1=\"0\" k2=\"1\" k3=\"1\" k4=\"0\" result=\"combined\"/>" +

            "<feMerge><feMergeNode in=\"combined\"/></feMerge>"
        );
    };

    Snap.filter.sobel.toString = function () {
        return this();
    };


    /**
     * Snap.filter.motionBlur @method
     *
     * Returns an SVG markup string for motion blur filter
     *
     * @param {number} angle - #optional motion angle in degrees, default 0 (horizontal)
     * @param {number} distance - #optional blur distance, default 10
     * @returns {string} filter representation
     */
    Snap.filter.motionBlur = function (angle, distance) {
        angle = angle == null ? 0 : angle;
        distance = distance == null ? 10 : distance;
        var rad = angle * Math.PI / 180;
        var dx = Math.cos(rad) * distance;
        var dy = Math.sin(rad) * distance;
        return Snap.format(
            "<feGaussianBlur in=\"SourceGraphic\" stdDeviation=\"{blur}\"/>" +
            "<feOffset dx=\"{dx}\" dy=\"{dy}\" result=\"blur1\"/>" +
            "<feMerge>" +
            "<feMergeNode in=\"blur1\"/>" +
            "<feMergeNode in=\"blur1\"/>" +
            "<feMergeNode in=\"SourceGraphic\"/>" +
            "</feMerge>",
            {
                blur: distance / 5,
                dx: dx / 3,
                dy: dy / 3
            });
    };
    Snap.filter.motionBlur.toString = function () {
        return this();
    };
    /**
     * Snap.filter.turbulence @method
     *
     * Returns an SVG markup string for turbulence/noise filter
     *
     * @param {number} baseFrequency - #optional turbulence frequency, default 0.05
     * @param {number} numOctaves - #optional number of octaves, default 2
     * @param {string} type - #optional "fractalNoise" or "turbulence", default "turbulence"
     * @returns {string} filter representation
     */
    Snap.filter.turbulence = function (baseFrequency, numOctaves, type) {
        baseFrequency = baseFrequency == null ? 0.05 : baseFrequency;
        numOctaves = numOctaves == null ? 2 : numOctaves;
        type = type || "turbulence";
        return Snap.format(
            "<feTurbulence type=\"{type}\" baseFrequency=\"{freq}\" numOctaves=\"{octaves}\" result=\"turbulence\"/>" +
            "<feDisplacementMap in=\"SourceGraphic\" in2=\"turbulence\" scale=\"20\" xChannelSelector=\"R\" yChannelSelector=\"G\"/>",
            {
                type: type,
                freq: baseFrequency,
                octaves: numOctaves
            });
    };
    Snap.filter.turbulence.toString = function () {
        return this();
    };
    /**
     * Snap.filter.duotone @method
     *
     * Returns an SVG markup string for duotone filter
     *
     * @param {string} color1 - #optional first color, default "#00f"
     * @param {string} color2 - #optional second color, default "#f00"
     * @returns {string} filter representation
     */
    Snap.filter.duotone = function (color1, color2) {
        color1 = Snap.color(color1 || "#00f");
        color2 = Snap.color(color2 || "#f00");
        var r1 = color1.r / 255, g1 = color1.g / 255, b1 = color1.b / 255;
        var r2 = color2.r / 255, g2 = color2.g / 255, b2 = color2.b / 255;
        return Snap.format(
            "<feColorMatrix type=\"matrix\" values=\".33 .33 .33 0 0 .33 .33 .33 0 0 .33 .33 .33 0 0 0 0 0 1 0\"/>" +
            "<feComponentTransfer>" +
            "<feFuncR type=\"table\" tableValues=\"{r1} {r2}\"/>" +
            "<feFuncG type=\"table\" tableValues=\"{g1} {g2}\"/>" +
            "<feFuncB type=\"table\" tableValues=\"{b1} {b2}\"/>" +
            "</feComponentTransfer>",
            {
                r1: r1, g1: g1, b1: b1,
                r2: r2, g2: g2, b2: b2
            });
    };
    Snap.filter.duotone.toString = function () {
        return this();
    };
    /**
     * Snap.filter.colorize @method
     *
     * Returns an SVG markup string for colorize filter
     *
     * @param {string} color - #optional target color, default "#f00"
     * @param {number} amount - #optional colorization amount (0..1), default 1
     * @returns {string} filter representation
     */
    Snap.filter.colorize = function (color, amount) {
        color = Snap.color(color || "#f00");
        amount = amount == null ? 1 : amount;
        var r = color.r / 255, g = color.g / 255, b = color.b / 255;
        var invAmount = 1 - amount;
        return Snap.format(
            "<feColorMatrix type=\"matrix\" values=\"" +
            "{ia} 0 0 0 {ra} " +
            "0 {ia} 0 0 {ga} " +
            "0 0 {ia} 0 {ba} " +
            "0 0 0 1 0\"/>",
            {
                ia: invAmount,
                ra: r * amount,
                ga: g * amount,
                ba: b * amount
            });
    };
    Snap.filter.colorize.toString = function () {
        return this();
    };
    /**
     * Snap.filter.pixelate @method
     *
     * Returns an SVG markup string for pixelate filter
     *
     * @param {number} size - #optional pixel size, default 5
     * @returns {string} filter representation
     */
    Snap.filter.pixelate = function (size) {
        size = size == null ? 5 : size;
        return Snap.format(
            "<feTurbulence type=\"turbulence\" baseFrequency=\"0\" numOctaves=\"1\" result=\"turbulence\"/>" +
            "<feDisplacementMap in=\"SourceGraphic\" in2=\"turbulence\" scale=\"{size}\" xChannelSelector=\"R\" yChannelSelector=\"G\"/>" +
            "<feGaussianBlur stdDeviation=\"0.5\"/>",
            {
                size: size
            });
    };
    Snap.filter.pixelate.toString = function () {
        return this();
    };
    /**
     * Snap.filter.posterize @method
     *
     * Returns an SVG markup string for posterize filter
     *
     * @param {number} levels - #optional number of color levels (2-10), default 4
     * @returns {string} filter representation
     */
    Snap.filter.posterize = function (levels) {
        levels = levels == null ? 4 : Math.max(2, Math.min(10, levels));
        var values = [];
        for (var i = 0; i < levels; i++) {
            values.push(i / (levels - 1));
        }
        var tableValues = values.join(" ");
        return Snap.format(
            "<feComponentTransfer>" +
            "<feFuncR type=\"discrete\" tableValues=\"{values}\"/>" +
            "<feFuncG type=\"discrete\" tableValues=\"{values}\"/>" +
            "<feFuncB type=\"discrete\" tableValues=\"{values}\"/>" +
            "</feComponentTransfer>",
            {
                values: tableValues
            });
    };
    Snap.filter.posterize.toString = function () {
        return this();
    };
    /**
     * Snap.filter.chromaticAberration @method
     *
     * Returns an SVG markup string for chromatic aberration filter (RGB channel separation)
     *
     * @param {number} amount - #optional aberration amount, default 2
     * @returns {string} filter representation
     */
    Snap.filter.chromaticAberration = function (amount) {
        amount = amount == null ? 2 : amount;
        return Snap.format(
            "<feOffset in=\"SourceGraphic\" dx=\"{neg}\" result=\"red\" />" +
            "<feOffset in=\"SourceGraphic\" dx=\"{pos}\" result=\"blue\" />" +
            "<feBlend mode=\"screen\" in=\"red\" in2=\"SourceGraphic\" result=\"redBlend\" />" +
            "<feBlend mode=\"screen\" in=\"blue\" in2=\"redBlend\" />",
            {
                neg: -amount,
                pos: amount
            });
    };
    Snap.filter.chromaticAberration.toString = function () {
        return this();
    };
    /**
     * Snap.filter.vignette @method
     *
     * Returns an SVG markup string for vignette filter (darkened corners)
     *
     * @param {number} intensity - #optional vignette intensity (0..1), default 0.5
     * @param {number} radius - #optional vignette radius (0..1), default 0.7
     * @returns {string} filter representation
     */
    Snap.filter.vignette = function (intensity, radius) {
        intensity = intensity == null ? 0.5 : intensity;
        radius = radius == null ? 0.7 : radius;
        var cx = 0.5, cy = 0.5;
        return Snap.format(
            "<feGaussianBlur in=\"SourceAlpha\" stdDeviation=\"0\" />" +
            "<feOffset dx=\"0\" dy=\"0\" result=\"offsetBlur\" />" +
            "<feFlood flood-color=\"#000000\" flood-opacity=\"{intensity}\" />" +
            "<feComposite in2=\"offsetBlur\" operator=\"out\" />" +
            "<feGaussianBlur stdDeviation=\"{blur}\" />" +
            "<feBlend mode=\"multiply\" in2=\"SourceGraphic\" />",
            {
                intensity: intensity,
                blur: (1 - radius) * 50
            });
    };
    Snap.filter.vignette.toString = function () {
        return this();
    };
    /**
     * Snap.filter.oldFilm @method
     *
     * Returns an SVG markup string for old film effect (grain + sepia + scratches)
     *
     * @param {number} grainAmount - #optional grain amount (0..1), default 0.3
     * @param {number} sepiaAmount - #optional sepia amount (0..1), default 0.8
     * @returns {string} filter representation
     */
    Snap.filter.oldFilm = function (grainAmount, sepiaAmount) {
        grainAmount = grainAmount == null ? 0.3 : grainAmount;
        sepiaAmount = sepiaAmount == null ? 0.8 : sepiaAmount;

        // Generate sepia matrix values
        var a = 0.393 + 0.607 * (1 - sepiaAmount);
        var b = 0.769 - 0.769 * (1 - sepiaAmount);
        var c = 0.189 - 0.189 * (1 - sepiaAmount);
        var d = 0.349 - 0.349 * (1 - sepiaAmount);
        var e = 0.686 + 0.314 * (1 - sepiaAmount);
        var f = 0.168 - 0.168 * (1 - sepiaAmount);
        var g = 0.272 - 0.272 * (1 - sepiaAmount);
        var h = 0.534 - 0.534 * (1 - sepiaAmount);
        var i = 0.131 + 0.869 * (1 - sepiaAmount);

        return Snap.format(
            "<feColorMatrix type=\"matrix\" values=\"{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {h} {i} 0 0 0 0 0 1 0\" result=\"sepia\"/>" +
            "<feTurbulence type=\"fractalNoise\" baseFrequency=\"{freq}\" numOctaves=\"4\" result=\"noise\"/>" +
            "<feBlend mode=\"multiply\" in=\"sepia\" in2=\"noise\" result=\"blend\"/>" +
            "<feComponentTransfer in=\"blend\">" +
            "<feFuncR type=\"linear\" slope=\"1.2\" intercept=\"-0.1\"/>" +
            "<feFuncG type=\"linear\" slope=\"1.2\" intercept=\"-0.1\"/>" +
            "<feFuncB type=\"linear\" slope=\"1.2\" intercept=\"-0.1\"/>" +
            "</feComponentTransfer>",
            {
                a: a, b: b, c: c,
                d: d, e: e, f: f,
                g: g, h: h, i: i,
                freq: grainAmount * 0.9
            });
    };
    Snap.filter.oldFilm.toString = function () {
        return this();
    };
    /**
     * Snap.filter.neon @method
     *
     * Returns an SVG markup string for neon glow effect
     *
     * @param {string} color - #optional neon color, default "#0ff"
     * @param {number} width - #optional glow width, default 3
     * @returns {string} filter representation
     */
    Snap.filter.neon = function (color, width) {
        color = color || "#0ff";
        width = width == null ? 3 : width;
        color = Snap.color(color);
        return Snap.format(
            "<feColorMatrix type=\"matrix\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0\" result=\"alpha\"/>" +
            "<feGaussianBlur in=\"alpha\" stdDeviation=\"{w1}\" result=\"blur1\"/>" +
            "<feGaussianBlur in=\"alpha\" stdDeviation=\"{w2}\" result=\"blur2\"/>" +
            "<feGaussianBlur in=\"alpha\" stdDeviation=\"{w3}\" result=\"blur3\"/>" +
            "<feFlood flood-color=\"{color}\" result=\"flood\"/>" +
            "<feComposite in=\"flood\" in2=\"blur1\" operator=\"in\" result=\"comp1\"/>" +
            "<feComposite in=\"flood\" in2=\"blur2\" operator=\"in\" result=\"comp2\"/>" +
            "<feComposite in=\"flood\" in2=\"blur3\" operator=\"in\" result=\"comp3\"/>" +
            "<feMerge>" +
            "<feMergeNode in=\"comp3\"/>" +
            "<feMergeNode in=\"comp2\"/>" +
            "<feMergeNode in=\"comp1\"/>" +
            "<feMergeNode in=\"SourceGraphic\"/>" +
            "</feMerge>",
            {
                color: color,
                w1: width,
                w2: width * 2,
                w3: width * 3
            });
    };
    Snap.filter.neon.toString = function () {
        return this();
    };
});
