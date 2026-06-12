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
import { Snap } from "./svg.js";

Snap.plugin((Snap, _Element, _Paper, _glob, _Fragment) => {
  const objectToString = Object.prototype.toString;
  const Str = String;
  const math = Math;
  const E = "";
  class Matrix {
    constructor(a, b, c, d, e, f) {
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
    add(a, b, c, d, e, f) {
      if (a && a instanceof Matrix) {
        return this.add(a.a, a.b, a.c, a.d, a.e, a.f);
      }
      const aNew = a * this.a + b * this.c;
      const bNew = a * this.b + b * this.d;
      this.e += e * this.a + f * this.c;
      this.f += e * this.b + f * this.d;
      this.c = c * this.a + d * this.c;
      this.d = c * this.b + d * this.d;

      this.a = aNew;
      this.b = bNew;
      return this;
    }
    /*\
      * Matrix.multLeft
      [ method ]
      **
      * Multiplies a passed affine transform to the left: M * this.
      - a (number)
      - b (number)
      - c (number)
      - d (number)
      - e (number)
      - f (number)
      * or
      - matrix (object) @Matrix
    \*/
    multLeft(a, b, c, d, e, f) {
      if (a && a instanceof Matrix) {
        return this.multLeft(a.a, a.b, a.c, a.d, a.e, a.f);
      }
      const aNew = a * this.a + c * this.b;
      const cNew = a * this.c + c * this.d;
      const eNew = a * this.e + c * this.f + e;
      this.b = b * this.a + d * this.b;
      this.d = b * this.c + d * this.d;
      this.f = b * this.e + d * this.f + f;

      this.a = aNew;
      this.c = cNew;
      this.e = eNew;
      return this;
    }
    /*\
      * Matrix.invert
      [ method ]
      **
      * Returns an inverted version of the matrix
      = (object) @Matrix
    \*/
    invert() {
      const x = this.a * this.d - this.b * this.c;
      return new Matrix(
        this.d / x,
        -this.b / x,
        -this.c / x,
        this.a / x,
        (this.c * this.f - this.d * this.e) / x,
        (this.b * this.e - this.a * this.f) / x,
      );
    }
    /*\
      * Matrix.clone
      [ method ]
      **
      * Returns a copy of the matrix
      = (object) @Matrix
    \*/
    clone() {
      return new Matrix(this.a, this.b, this.c, this.d, this.e, this.f);
    }
    /*\
      * Matrix.translate
      [ method ]
      **
      * Translate the matrix
      - x (number) horizontal offset distance
      - y (number) vertical offset distance
    \*/
    translate(x, y) {
      this.e += x * this.a + y * this.c;
      this.f += x * this.b + y * this.d;
      return this;
    }
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
    scale(x, y = x, cx = 0, cy = 0) {
      (cx || cy) && this.translate(cx, cy);
      this.a *= x;
      this.b *= x;
      this.c *= y;
      this.d *= y;
      (cx || cy) && this.translate(-cx, -cy);
      return this;
    }
    /*\
      * Matrix.rotate
      [ method ]
      **
      * Rotates the matrix
      - a (number) angle of rotation, in degrees
      - x (number) horizontal origin point from which to rotate
      - y (number) vertical origin point from which to rotate
    \*/
    rotate(angle, x = 0, y = 0) {
      const a = Snap.rad(angle);
      const cos = +math.cos(a).toFixed(9);
      const sin = +math.sin(a).toFixed(9);
      this.add(cos, sin, -sin, cos, x, y);
      return this.add(1, 0, 0, 1, -x, -y);
    }
    /*\
      * Matrix.skewX
      [ method ]
      **
      * Skews the matrix along the x-axis
      - x (number) Angle to skew along the x-axis (in degrees).
    \*/
    skewX(x) {
      return this.skew(x, 0);
    }
    /*\
      * Matrix.skewY
      [ method ]
      **
      * Skews the matrix along the y-axis
      - y (number) Angle to skew along the y-axis (in degrees).
    \*/
    skewY(y) {
      return this.skew(0, y);
    }
    /*\
      * Matrix.skew
      [ method ]
      **
      * Skews the matrix
      - y (number) Angle to skew along the y-axis (in degrees).
      - x (number) Angle to skew along the x-axis (in degrees).
    \*/
    skew(x = 0, y = 0) {
      const c = Snap.tan(x).toFixed(9);
      const b = Snap.tan(y).toFixed(9);
      return this.add(1, b, c, 1, 0, 0);
    }
    /*\
      * Matrix.x
      [ method ]
      **
      * Returns x coordinate for given point after transformation described by the matrix. See also @Matrix.y
      - x (number)
      - y (number)
      = (number) x
    \*/
    x(x, y) {
      return x * this.a + y * this.c + this.e;
    }
    /*\
      * Matrix.y
      [ method ]
      **
      * Returns y coordinate for given point after transformation described by the matrix. See also @Matrix.x
      - x (number)
      - y (number)
      = (number) y
    \*/
    y(x, y) {
      return x * this.b + y * this.d + this.f;
    }
    get(i) {
      return +this[Str.fromCharCode(97 + i)].toFixed(4);
    }
    toString() {
      return `matrix(${[this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)]})`;
    }
    offset() {
      return [this.e.toFixed(4), this.f.toFixed(4)];
    }
    /*\
      * Matrix.determinant
      [ method ]
      **
      * Finds determinant of the given matrix.
      = (number) determinant
    \*/
    determinant() {
      return this.a * this.d - this.b * this.c;
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
    split() {
      const out = {};
      // translation
      out.dx = this.e;
      out.dy = this.f;

      // scale and shear
      const row = [
        [this.a, this.b],
        [this.c, this.d],
      ];
      out.scalex = math.sqrt(norm(row[0]));
      normalize(row[0]);

      out.shear = row[0][0] * row[1][0] + row[0][1] * row[1][1];
      row[1] = [
        row[1][0] - row[0][0] * out.shear,
        row[1][1] - row[0][1] * out.shear,
      ];

      out.scaley = math.sqrt(norm(row[1]));
      normalize(row[1]);
      out.shear /= out.scaley;

      if (this.determinant() < 0) {
        out.scalex = -out.scalex;
      }

      // rotation
      const sin = row[0][1];
      const cos = row[1][1];
      if (cos < 0) {
        out.rotate = Snap.deg(math.acos(cos));
        if (sin < 0) {
          out.rotate = 360 - out.rotate;
        }
      } else {
        out.rotate = Snap.deg(math.asin(sin));
      }

      out.isSimple =
        !+out.shear.toFixed(9) &&
        (out.scalex.toFixed(9) == out.scaley.toFixed(9) || !out.rotate);
      out.isSuperSimple =
        !+out.shear.toFixed(9) &&
        out.scalex.toFixed(9) == out.scaley.toFixed(9) &&
        !out.rotate;
      out.noRotation = !+out.shear.toFixed(9) && !out.rotate;
      return out;
    }
    /*\
      * Matrix.toTransformString
      [ method ]
      **
      * Returns transform string that represents given matrix
      = (string) transform string
    \*/
    toTransformString(shorter) {
      const s = shorter || this.split();
      if (!+s.shear.toFixed(9)) {
        s.scalex = +s.scalex.toFixed(4);
        s.scaley = +s.scaley.toFixed(4);
        s.rotate = +s.rotate.toFixed(4);
        return (
          (s.dx || s.dy ? `t${[+s.dx.toFixed(4), +s.dy.toFixed(4)]}` : E) +
          (s.rotate ? `r${[+s.rotate.toFixed(4), 0, 0]}` : E) +
          (s.scalex != 1 || s.scaley != 1
            ? `s${[s.scalex, s.scaley, 0, 0]}`
            : E)
        );
      }
      return `m${[this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)]}`;
    }
  }
  const norm = (a) => a[0] * a[0] + a[1] * a[1];
  const normalize = (a) => {
    const mag = math.sqrt(norm(a));
    if (a[0]) {
      a[0] /= mag;
    }
    if (a[1]) {
      a[1] /= mag;
    }
  };
  /*\
     * Snap.Matrix
     [ method ]
     **
     * Matrix constructor, extend on your own risk.
     * To create matrices use @Snap.matrix.
    \*/
  Snap.Matrix = Matrix;
  /*\
     * Snap.matrix
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
  Snap.matrix = (a, b, c, d, e, f) => new Matrix(a, b, c, d, e, f);
});
