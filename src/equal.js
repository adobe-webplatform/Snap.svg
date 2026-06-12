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

Snap.plugin((Snap, Element, _Paper, _glob) => {
  const names = {};
  const reUnit = /[%a-z]+$/i;
  const Str = String;
  names.stroke = names.fill = "colour";
  const getEmpty = (item) => {
    const l = item[0];
    switch (l.toLowerCase()) {
      case "t":
        return [l, 0, 0];
      case "m":
        return [l, 1, 0, 0, 1, 0, 0];
      case "r":
        if (item.length == 4) {
          return [l, 0, item[2], item[3]];
        }
        return [l, 0];
      case "s":
        if (item.length == 5) {
          return [l, 1, 1, item[3], item[4]];
        }
        if (item.length == 3) {
          return [l, 1, 1];
        }
        return [l, 1];
    }
  };
  const equaliseTransformString = (ts1, ts2, getBBox) => {
    let t1 = ts1;
    let t2 = ts2;
    t1 = (typeof t1 == "string" && Snap.parseTransformString(t1)) || [];
    t2 = (typeof t2 == "string" && Snap.parseTransformString(t2)) || [];
    const maxlength = Math.max(t1.length, t2.length);
    let from = [];
    let to = [];
    let i = 0;
    let j;
    let jj;
    let tt1;
    let tt2;
    for (; i < maxlength; i++) {
      tt1 = t1[i] || getEmpty(t2[i]);
      tt2 = t2[i] || getEmpty(tt1);
      if (
        tt1[0] != tt2[0] ||
        (tt1[0].toLowerCase() == "r" &&
          (tt1[2] != tt2[2] || tt1[3] != tt2[3])) ||
        (tt1[0].toLowerCase() == "s" && (tt1[3] != tt2[3] || tt1[4] != tt2[4]))
      ) {
        t1 = Snap._.transform2matrix(t1, getBBox(1));
        t2 = Snap._.transform2matrix(t2, getBBox(1));
        from = [["m", t1.a, t1.b, t1.c, t1.d, t1.e, t1.f]];
        to = [["m", t2.a, t2.b, t2.c, t2.d, t2.e, t2.f]];
        break;
      }
      from[i] = [];
      to[i] = [];
      for (j = 0, jj = Math.max(tt1.length, tt2.length); j < jj; j++) {
        if (j in tt1) {
          from[i][j] = tt1[j];
        }
        if (j in tt2) {
          to[i][j] = tt2[j];
        }
      }
    }
    return {
      from: path2array(from),
      to: path2array(to),
      f: getPath(from),
    };
  };
  const equaliseTransform = (ts1, ts2, t1Matrix, t2Matrix, getBBox) => {
    let t1 = ts1;
    let t2 = ts2;
    t1 = t1 || new Snap.Matrix();
    t2 = t2 || new Snap.Matrix();
    const stringRes = equaliseTransformString(t1, t2, getBBox);
    let matrixRes;
    if (stringRes.f([]).charAt() == "m") {
      matrixRes = equaliseTransformString(
        t1Matrix.toTransformString(),
        t2Matrix.toTransformString(),
        getBBox,
      );
    }
    return matrixRes || stringRes;
  };
  const getNumber = (val) => val;
  const getUnit = (unit) => (val) => +val.toFixed(3) + unit;
  const getViewBox = (val) => val.join(" ");
  const getColour = (clr) => Snap.rgb(clr[0], clr[1], clr[2], clr[3]);
  const getPath = (path) => {
    let k = 0;
    let i;
    let ii;
    let j;
    let jj;
    let out;
    let a;
    const b = [];
    for (i = 0, ii = path.length; i < ii; i++) {
      out = "[";
      a = [`"${path[i][0]}"`];
      for (j = 1, jj = path[i].length; j < jj; j++) {
        a[j] = `val[${k++}]`;
      }
      out += `${a}]`;
      b[i] = out;
    }
    return Function("val", `return Snap.path.toString.call([${b}])`);
  };
  const path2array = (path) => {
    const out = [];
    for (let i = 0, ii = path.length; i < ii; i++) {
      for (let j = 1, jj = path[i].length; j < jj; j++) {
        out.push(path[i][j]);
      }
    }
    return out;
  };
  const isNumeric = (obj) => Number.isFinite(obj);
  const arrayEqual = (arr1, arr2) => {
    if (!Snap.is(arr1, "array") || !Snap.is(arr2, "array")) {
      return false;
    }
    return arr1.toString() == arr2.toString();
  };
  Element.prototype.equal = function (name, b) {
    return eve("snap.util.equal", this, name, b).firstDefined();
  };
  eve.on("snap.util.equal", function (name, b) {
    let A;
    let B;
    const a = Str(this.attr(name) || "");
    if (names[name] == "colour") {
      A = Snap.color(a);
      B = Snap.color(b);
      return {
        from: [A.r, A.g, A.b, A.opacity],
        to: [B.r, B.g, B.b, B.opacity],
        f: getColour,
      };
    }
    if (name == "viewBox") {
      A = this.attr(name).vb.split(" ").map(Number);
      B = b.split(" ").map(Number);
      return {
        from: A,
        to: B,
        f: getViewBox,
      };
    }
    if (
      name == "transform" ||
      name == "gradientTransform" ||
      name == "patternTransform"
    ) {
      let B = b;
      if (typeof b == "string") {
        B = Str(b).replace(/\.{3}|\u2026/g, a);
      }
      let bMatrix;
      if (!Snap._.rgTransform.test(B)) {
        bMatrix = Snap._.transform2matrix(
          Snap._.svgTransform2string(B),
          this.getBBox(),
        );
      } else {
        bMatrix = Snap._.transform2matrix(B, this.getBBox());
      }
      return equaliseTransform(a, B, this.matrix, bMatrix, () =>
        this.getBBox(1),
      );
    }
    if (name == "d" || name == "path") {
      A = Snap.path.toCubic(a, b);
      return {
        from: path2array(A[0]),
        to: path2array(A[1]),
        f: getPath(A[0]),
      };
    }
    if (name == "points") {
      A = Str(a).split(Snap._.separator);
      B = Str(b).split(Snap._.separator);
      return {
        from: A,
        to: B,
        f: (val) => val,
      };
    }
    if (isNumeric(a) && isNumeric(b)) {
      return {
        from: Number.parseFloat(a),
        to: Number.parseFloat(b),
        f: getNumber,
      };
    }
    const aUnit = a.match(reUnit);
    const bUnit = Str(b).match(reUnit);
    if (aUnit && arrayEqual(aUnit, bUnit)) {
      return {
        from: Number.parseFloat(a),
        to: Number.parseFloat(b),
        f: getUnit(aUnit),
      };
    }
    return {
      from: this.asPX(name),
      to: this.asPX(name, b),
      f: getNumber,
    };
  });
});
