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

Snap.plugin((Snap) => {
  const math = Math;
  const PI = math.PI;

  // ---- internal cubic-beziér helpers -------------------------------------
  // Coordinate order matches Snap.path.findDotsAtSegment:
  // (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y) i.e. start, anchor1, anchor2, end.

  // Evaluates a cubic beziér at parameter t.
  const bezpoint = (x1, y1, x2, y2, x3, y3, x4, y4, t) => {
    const t1 = 1 - t;
    const a = t1 * t1 * t1;
    const b = 3 * t1 * t1 * t;
    const c = 3 * t1 * t * t;
    const d = t * t * t;
    return {
      x: a * x1 + b * x2 + c * x3 + d * x4,
      y: a * y1 + b * y2 + c * y3 + d * y4,
    };
  };

  // Removes out-of-range roots and merges duplicates within `eps`.
  const cleanRoots = (roots, eps) => {
    const res = [];
    for (const t of roots) {
      if (t >= 0 && t <= 1) {
        res.push(t);
      }
    }
    for (let i = 0; i < res.length; i++) {
      for (let j = i + 1; j < res.length; j++) {
        if (math.abs(res[i] - res[j]) < eps) {
          res[i] = (res[i] + res[j]) / 2;
          res.splice(j, 1);
          j--;
        }
      }
    }
    return res;
  };

  // Newton-Raphson root finder shared by the line / circle intersection
  // solvers. `s3` is the polynomial, `s4` its derivative.
  const newtonRoots = (s3, s4) => {
    const seq = [0, 0.25, 0.5, 0.75, 1];
    const res = [];
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < seq.length; j++) {
        const p = seq[j];
        seq[j] -= s3(p) / s4(p);
        if (math.abs(p - seq[j]) < 0.001) {
          res.push(seq[j]);
          seq.splice(j, 1);
          j--;
        }
      }
    }
    return cleanRoots(res, 0.001);
  };

  /*\
     * Snap.path.bezierTangent
     [ method ]
     **
     * Utility method
     **
     * Finds the tangent angle of a cubic beziér curve at the given t
     - p1x (number) x of the first point of the curve
     - p1y (number) y of the first point of the curve
     - c1x (number) x of the first anchor of the curve
     - c1y (number) y of the first anchor of the curve
     - c2x (number) x of the second anchor of the curve
     - c2y (number) y of the second anchor of the curve
     - p2x (number) x of the second point of the curve
     - p2y (number) y of the second point of the curve
     - t (number) position on the curve (0..1)
     = (number) tangent angle in degrees (-180..180)
    \*/
  const bezierTangent = (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) => {
    const num =
      3 * t * t * (3 * c1y + p2y - 3 * c2y - p1y) +
      6 * t * (p1y - 2 * c1y + c2y) +
      3 * (c1y - p1y);
    const den =
      3 * t * t * (3 * c1x + p2x - 3 * c2x - p1x) +
      6 * t * (p1x - 2 * c1x + c2x) +
      3 * (c1x - p1x);
    return (math.atan2(num, den) * 180) / PI;
  };

  /*\
     * Snap.path.bezierCurvature
     [ method ]
     **
     * Utility method
     **
     * Finds the curvature and radius of curvature of a cubic beziér at the given t
     - p1x (number) x of the first point of the curve
     - p1y (number) y of the first point of the curve
     - c1x (number) x of the first anchor of the curve
     - c1y (number) y of the first anchor of the curve
     - c2x (number) x of the second anchor of the curve
     - c2y (number) y of the second anchor of the curve
     - p2x (number) x of the second point of the curve
     - p2y (number) y of the second point of the curve
     - t (number) position on the curve (0..1)
     = (object) `{ k: signed curvature, r: radius of curvature }` (both 0 on straight segments / cusps)
    \*/
  const bezierCurvature = (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) => {
    const a1 = 3 * (3 * c1x - p1x - 3 * c2x + p2x);
    const a2 = 3 * (3 * c1y - p1y - 3 * c2y + p2y);
    const b1 = 6 * (p1x - 2 * c1x + c2x);
    const b2 = 6 * (p1y - 2 * c1y + c2y);
    const g1 = 3 * (c1x - p1x);
    const g2 = 3 * (c1y - p1y);
    const dx = (a1 * t + b1) * t + g1;
    const dy = (a2 * t + b2) * t + g2;
    const ddx = 2 * a1 * t + b1;
    const ddy = 2 * a2 * t + b2;
    const num = dx * ddy - dy * ddx;
    const den = (dx * dx + dy * dy) ** 1.5;
    if (num == 0 || den == 0) {
      return { k: 0, r: 0 };
    }
    return { k: num / den, r: den / num };
  };

  /*\
     * Snap.path.bezierClosest
     [ method ]
     **
     * Utility method
     **
     * Finds the closest point on a cubic beziér curve to the given coordinate.
     * Solves the quintic (B(t) - P)·B'(t) = 0 exactly via bracketed Newton-Raphson.
     - p1x (number) x of the first point of the curve
     - p1y (number) y of the first point of the curve
     - c1x (number) x of the first anchor of the curve
     - c1y (number) y of the first anchor of the curve
     - c2x (number) x of the second anchor of the curve
     - c2y (number) y of the second anchor of the curve
     - p2x (number) x of the second point of the curve
     - p2y (number) y of the second point of the curve
     - x (number) x of the query point
     - y (number) y of the query point
     = (object) `{ x, y, t, d }` closest point, its curve parameter and distance
    \*/
  const bezierClosest = (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, x, y) => {
    const a1 = 3 * (3 * c1x - p1x - 3 * c2x + p2x);
    const a2 = 3 * (3 * c1y - p1y - 3 * c2y + p2y);
    const b1 = 6 * (p1x - 2 * c1x + c2x);
    const b2 = 6 * (p1y - 2 * c1y + c2y);
    const g1 = 3 * (c1x - p1x);
    const g2 = 3 * (c1y - p1y);
    const d1 = p1x;
    const d2 = p1y;
    // s3(v) = (B(v) - P)·B'(v) expanded to a quintic; s4 = s3'.
    const z1 = (a1 * a1 + a2 * a2) / 3;
    const z2 = (5 / 6) * (a1 * b1 + a2 * b2);
    const z3 = (4 / 3) * (a1 * g1 + a2 * g2) + (b1 * b1 + b2 * b2) / 2;
    const z4 =
      a1 * d1 + a2 * d2 + (3 / 2) * (b1 * g1 + b2 * g2) - a1 * x - a2 * y;
    const z5 = g1 * g1 + g2 * g2 + b1 * d1 + b2 * d2 - b1 * x - b2 * y;
    const z6 = g1 * d1 + g2 * d2 - g1 * x - g2 * y;
    const s3 = (v) => ((((z1 * v + z2) * v + z3) * v + z4) * v + z5) * v + z6;
    const s4 = (v) =>
      (((5 * z1 * v + 4 * z2) * v + 3 * z3) * v + 2 * z4) * v + z5;
    const X = (t) => (((a1 / 3) * t + b1 / 2) * t + g1) * t + d1;
    const Y = (t) => (((a2 / 3) * t + b2 / 2) * t + g2) * t + d2;

    // Phase 1: bracket every real root of s3 on [0, 1] via a 20-sample scan.
    const N = 20;
    const roots = [0, 1];
    let prevT = 0;
    let prev = s3(0);
    for (let i = 1; i <= N; i++) {
      const t = i / N;
      const cur = s3(t);
      if (math.sign(cur) != math.sign(prev)) {
        // Phase 2: safeguarded Newton on [lo, hi] with fLo*fHi <= 0.
        let lo = prevT;
        let hi = t;
        let fLo = prev;
        let tt;
        if (fLo == 0) {
          tt = lo;
        } else if (cur == 0) {
          tt = hi;
        } else {
          tt = (lo + hi) / 2;
          for (let k = 0; k < 30; k++) {
            const f = s3(tt);
            if (f == 0) {
              break;
            }
            if (math.sign(f) == math.sign(fLo)) {
              lo = tt;
              fLo = f;
            } else {
              hi = tt;
            }
            const df = s4(tt);
            const ttNewton = df == 0 ? tt : tt - f / df;
            const ttNew =
              ttNewton >= lo && ttNewton <= hi ? ttNewton : (lo + hi) / 2;
            if (math.abs(ttNew - tt) < 1e-10) {
              tt = ttNew;
              break;
            }
            tt = ttNew;
          }
        }
        roots.push(tt);
      }
      prev = cur;
      prevT = t;
    }

    // Phase 3: pick the candidate with the minimum squared distance.
    const result = { x: 0, y: 0, t: -1, d: Infinity };
    for (const t of roots) {
      if (t < 0 || t > 1) {
        continue;
      }
      const dx = X(t) - x;
      const dy = Y(t) - y;
      const d = dx * dx + dy * dy;
      if (d < result.d) {
        result.d = d;
        result.t = t;
        result.x = dx + x;
        result.y = dy + y;
      }
    }
    result.d = math.sqrt(result.d);
    return result;
  };

  /*\
     * Snap.path.bezierLineIntersection
     [ method ]
     **
     * Utility method
     **
     * Finds the parameter values t where a cubic beziér meets the line `y = a * x + b`
     - p1x (number) x of the first point of the curve
     - p1y (number) y of the first point of the curve
     - c1x (number) x of the first anchor of the curve
     - c1y (number) y of the first anchor of the curve
     - c2x (number) x of the second anchor of the curve
     - c2y (number) y of the second anchor of the curve
     - p2x (number) x of the second point of the curve
     - p2y (number) y of the second point of the curve
     - a (number) line slope
     - b (number) line y-intercept
     = (array) curve parameters (0..1) of the intersection points
    \*/
  const bezierLineIntersection = (
    p1x,
    p1y,
    c1x,
    c1y,
    c2x,
    c2y,
    p2x,
    p2y,
    a,
    b,
  ) => {
    const a1 = 3 * c1x - p1x - 3 * c2x + p2x;
    const a2 = 3 * c1y - p1y - 3 * c2y + p2y;
    const b1 = 3 * (p1x - 2 * c1x + c2x);
    const b2 = 3 * (p1y - 2 * c1y + c2y);
    const g1 = 3 * (c1x - p1x);
    const g2 = 3 * (c1y - p1y);
    const z1 = a * a1 - a2;
    const z2 = a * b1 - b2;
    const z3 = a * g1 - g2;
    const z4 = a * p1x - p1y + b;
    const s3 = (v) => ((z1 * v + z2) * v + z3) * v + z4;
    const s4 = (v) => (3 * z1 * v + 2 * z2) * v + z3;
    return newtonRoots(s3, s4);
  };

  /*\
     * Snap.path.bezierCircleIntersection
     [ method ]
     **
     * Utility method
     **
     * Finds the parameter values t where a cubic beziér meets a circle
     - p1x (number) x of the first point of the curve
     - p1y (number) y of the first point of the curve
     - c1x (number) x of the first anchor of the curve
     - c1y (number) y of the first anchor of the curve
     - c2x (number) x of the second anchor of the curve
     - c2y (number) y of the second anchor of the curve
     - p2x (number) x of the second point of the curve
     - p2y (number) y of the second point of the curve
     - cx (number) x of the circle center
     - cy (number) y of the circle center
     - r (number) circle radius
     = (array) curve parameters (0..1) of the intersection points
    \*/
  const bezierCircleIntersection = (
    p1x,
    p1y,
    c1x,
    c1y,
    c2x,
    c2y,
    p2x,
    p2y,
    cx,
    cy,
    r,
  ) => {
    const a1 = 3 * c1x - p1x - 3 * c2x + p2x;
    const a2 = 3 * c1y - p1y - 3 * c2y + p2y;
    const b1 = 3 * (p1x - 2 * c1x + c2x);
    const b2 = 3 * (p1y - 2 * c1y + c2y);
    const g1 = 3 * (c1x - p1x);
    const g2 = 3 * (c1y - p1y);
    const d1 = p1x;
    const d2 = p1y;
    const z1 = a1 * a1 + a2 * a2;
    const z2 = 2 * a1 * b1 + 2 * a2 * b2;
    const z3 = 2 * a1 * g1 + b1 * b1 + 2 * a2 * g2 + b2 * b2;
    const z4 = 2 * (a1 * d1 + a2 * d2 + b1 * g1 + b2 * g2 - a1 * cx - a2 * cy);
    const z5 =
      g1 * g1 + g2 * g2 + 2 * b1 * d1 + 2 * b2 * d2 - 2 * b1 * cx - 2 * b2 * cy;
    const z6 = 2 * (g1 * d1 + g2 * d2 - g1 * cx - g2 * cy);
    const z7 =
      d1 * d1 + d2 * d2 - 2 * d1 * cx - 2 * d2 * cy + cx * cx + cy * cy - r * r;
    const s3 = (v) =>
      (((((z1 * v + z2) * v + z3) * v + z4) * v + z5) * v + z6) * v + z7;
    const s4 = (v) =>
      ((((6 * z1 * v + 5 * z2) * v + 4 * z3) * v + 3 * z4) * v + 2 * z5) * v +
      z6;
    return newtonRoots(s3, s4);
  };

  /*\
     * Snap.path.bezierDistance
     [ method ]
     **
     * Utility method
     **
     * Finds the minimum distance between two cubic beziér curves.
     * Each curve is given as a flat array of 8 numbers
     * `[p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y]`.
     - curve1 (array) first curve as 8 coordinates
     - curve2 (array) second curve as 8 coordinates
     = (object) `{ p1, p2, t1, t2, d }` closest points, their curve parameters and the distance
    \*/
  const bezierDistance = (curve1, curve2) => {
    const [x1, y1, x2, y2, x3, y3, x4, y4] = curve1;
    const [x5, y5, x6, y6, x7, y7, x8, y8] = curve2;
    let d = Infinity;
    let p1;
    let p2;
    let t1;
    let t2;
    // Phase 1: coarse scan of curve 1, closest point on curve 2 at each sample.
    for (let t = 0; t <= 1; t += 0.1) {
      const p = bezpoint(x1, y1, x2, y2, x3, y3, x4, y4, t);
      const c = bezierClosest(x5, y5, x6, y6, x7, y7, x8, y8, p.x, p.y);
      if (c.d < d) {
        d = c.d;
        t1 = t;
        t2 = c.t;
        p1 = p;
        p2 = { x: c.x, y: c.y };
      }
    }
    // Phase 2: hill-climb refinement on t1 with shrinking step size.
    let prec = 0.05;
    while (prec > 0.001) {
      const pb = bezpoint(x1, y1, x2, y2, x3, y3, x4, y4, t1 + prec);
      const cb =
        t1 + prec > 1
          ? { d }
          : bezierClosest(x5, y5, x6, y6, x7, y7, x8, y8, pb.x, pb.y);
      if (cb.d < d) {
        d = cb.d;
        t1 += prec;
        t2 = cb.t;
        p1 = pb;
        p2 = { x: cb.x, y: cb.y };
      } else {
        const pa = bezpoint(x1, y1, x2, y2, x3, y3, x4, y4, t1 - prec);
        const ca =
          t1 - prec < 0
            ? { d }
            : bezierClosest(x5, y5, x6, y6, x7, y7, x8, y8, pa.x, pa.y);
        if (ca.d < d) {
          d = ca.d;
          t1 -= prec;
          t2 = ca.t;
          p1 = pa;
          p2 = { x: ca.x, y: ca.y };
        } else {
          prec /= 2;
        }
      }
    }
    return { p1, p2, t1, t2, d };
  };

  // Normalizes a point given as {x, y} or [x, y] to {x, y}.
  const toXY = (p) =>
    Snap.is(p, "array") ? { x: p[0], y: p[1] } : { x: p.x, y: p.y };

  /*\
     * Snap.path.smooth
     [ method ]
     **
     * Utility method
     **
     * Builds a smooth cubic beziér path that passes through the given points
     * using a cardinal spline.
     - points (array) array of points, each `{x, y}` or `[x, y]`
     - close (boolean) #optional whether to close the path (default `false`)
     - tension (number) #optional spline tension, higher is tighter (default `1`)
     = (string) path string
    \*/
  const smooth = (points, close = false, tension = 1) => {
    const pts = (points || []).map(toXY);
    const n = pts.length;
    if (!n) {
      return "";
    }
    if (n == 1) {
      return `M${pts[0].x},${pts[0].y}`;
    }
    const at = (i) => pts[((i % n) + n) % n];
    let path = `M${pts[0].x},${pts[0].y}`;
    const segments = close ? n : n - 1;
    for (let i = 0; i < segments; i++) {
      const p0 = close ? at(i - 1) : pts[math.max(i - 1, 0)];
      const p1 = at(i);
      const p2 = close ? at(i + 1) : pts[i + 1];
      const p3 = close ? at(i + 2) : pts[math.min(i + 2, n - 1)];
      const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
      const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;
      const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
      const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;
      path += `C${cp1x},${cp1y},${cp2x},${cp2y},${p2.x},${p2.y}`;
    }
    if (close) {
      path += "z";
    }
    return path;
  };

  // Perpendicular distance from point p to the line through s and e.
  const perpendicularDistance = (s, e, p) => {
    const x1 = e.x - s.x;
    const y1 = e.y - s.y;
    const x2 = p.x - s.x;
    const y2 = p.y - s.y;
    const k = (x1 * x2 + y1 * y2) / (x1 * x1 + y1 * y1);
    return math.hypot(x2 - k * x1, y2 - k * y1);
  };

  const rdp = (pts, eps) => {
    if (pts.length < 3) {
      return pts.slice();
    }
    const end = pts.length - 1;
    let dmax = 0;
    let index = 0;
    for (let i = 1; i < end; i++) {
      const d = perpendicularDistance(pts[0], pts[end], pts[i]);
      if (d > dmax) {
        index = i;
        dmax = d;
      }
    }
    if (dmax > eps) {
      const left = rdp(pts.slice(0, index + 1), eps);
      const right = rdp(pts.slice(index), eps);
      return left.slice(0, -1).concat(right);
    }
    return [pts[0], pts[end]];
  };

  /*\
     * Snap.path.simplify
     [ method ]
     **
     * Utility method
     **
     * Simplifies a polyline using the Ramer-Douglas-Peucker algorithm
     - points (array) array of points, each `{x, y}` or `[x, y]`
     - tolerance (number) #optional maximum allowed deviation (default `1`)
     = (array) simplified array of `{x, y}` points
    \*/
  const simplify = (points, tolerance = 1) => {
    const pts = (points || []).map(toXY);
    if (pts.length < 3) {
      return pts;
    }
    return rdp(pts, tolerance);
  };

  // ---- grid ---------------------------------------------------------------

  const getLens = (width, height, angle, padding, ox, oy) => {
    const sin = math.sin(((180 - angle) * PI) / 180);
    const cos = math.cos(((180 - angle) * PI) / 180);
    const turn = (x, y) => [
      cos * (x - ox) - sin * (y - oy) + ox,
      sin * (x - ox) + cos * (y - oy) + oy,
    ];
    const box = [
      turn(-padding, -padding),
      turn(-padding, height + padding * 2),
      turn(width + padding * 2, -padding),
      turn(width + padding * 2, height + padding * 2),
    ];
    const boxx = [];
    const boxy = [];
    for (const corner of box) {
      boxx.push(corner[0]);
      boxy.push(corner[1]);
    }
    const lenxf = math.max(...boxx) - ox;
    const lenxb = ox - math.min(...boxx);
    const lenyf = math.max(...boxy) - oy;
    const lenyb = oy - math.min(...boxy);
    return [lenxf, lenxb, lenyf, lenyb];
  };

  /*\
     * Snap.grid
     [ method ]
     **
     * Generates the points of a square or hexagonal grid covering the given
     * area, optionally rotated and padded. Points falling outside the area
     * (allowing for `padding`) are clipped out.
     - width (number) width of the area to cover
     - height (number) height of the area to cover
     - step (number) spacing between grid points
     - angle (number) #optional rotation of the grid in degrees (default `0`)
     - padding (number) #optional extra margin around the area (default `0`)
     - type (string) #optional `"square"` or `"hex"` (default `"square"`)
     - startx (number) #optional x of the grid origin (default `step / 2`)
     - starty (number) #optional y of the grid origin (default `step / 2`)
     = (array) array of rows, each an array of `[x, y]` points
    \*/
  const makeGrid = (
    width,
    height,
    step,
    angle = 0,
    padding = 0,
    type = "square",
    startx = step / 2,
    starty = step / 2,
  ) => {
    const ox = startx;
    const oy = starty;
    const dx = step;
    const dy = type == "square" ? step : (step * math.sqrt(3)) / 2;
    const lens = getLens(width, height, angle, padding, ox, oy);
    let x = ox;
    let y = oy;
    let X = 0;
    let Y = 0;
    let row = -1;
    const res = [[]];
    let rrow = res[0];
    const sin = math.sin((angle * PI) / 180);
    const cos = math.cos((angle * PI) / 180);
    const out = (px, py) =>
      px + padding < 0 ||
      py + padding < 0 ||
      px - padding > width ||
      py - padding > height;
    const turn = (tx, ty) => [
      cos * (tx - ox) - sin * (ty - oy) + ox,
      sin * (tx - ox) + cos * (ty - oy) + oy,
    ];
    const minus = [];
    let back = true;
    y -= dy;
    x = ox + (type == "square" ? 0 : (math.abs(row % 2) * dx) / 2);
    while (y > oy - lens[2]) {
      if (back) {
        x -= dx;
        if (x < ox - lens[0]) {
          back = false;
          rrow.push(...minus);
          minus.length = 0;
        }
      } else {
        x += dx;
        [X, Y] = turn(x, y);
        if (!out(X, Y)) {
          rrow.push([X, Y]);
        }
        if (x > ox + lens[1]) {
          row--;
          x = ox + (type == "square" ? 0 : (math.abs(row % 2) * dx) / 2);
          y -= dy;
          back = true;
          rrow = [];
          res.unshift(rrow);
        }
      }
    }
    minus.length = 0;
    back = true;
    row = 0;
    x = ox;
    y = oy;
    while (y < oy + lens[3]) {
      if (back) {
        x -= dx;
        if (x < ox - lens[0]) {
          back = false;
          rrow.push(...minus);
          minus.length = 0;
        }
      } else {
        x += dx;
        [X, Y] = turn(x, y);
        if (!out(X, Y)) {
          rrow.push([X, Y]);
        }
        if (x > ox + lens[1]) {
          row++;
          x = ox + (type == "square" ? 0 : ((row % 2) * dx) / 2);
          y += dy;
          back = true;
          rrow = [];
          res.push(rrow);
        }
      }
    }
    return res;
  };

  // ---- exports ------------------------------------------------------------
  Snap.path.bezierTangent = bezierTangent;
  Snap.path.bezierCurvature = bezierCurvature;
  Snap.path.bezierClosest = bezierClosest;
  Snap.path.bezierLineIntersection = bezierLineIntersection;
  Snap.path.bezierCircleIntersection = bezierCircleIntersection;
  Snap.path.bezierDistance = bezierDistance;
  Snap.path.smooth = smooth;
  Snap.path.simplify = simplify;
  Snap.grid = makeGrid;
});
