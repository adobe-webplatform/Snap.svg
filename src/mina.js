// Copyright (c) 2017 Adobe Systems Incorporated. All rights reserved.
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

const animations = {};
const requestAnimFrame =
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  ((callback) => {
    setTimeout(callback, 16, Date.now());
    return true;
  });
let requestID;
const isArray = Array.isArray;
let idgen = 0;
const idprefix = `M${(Date.now()).toString(36)}`;
const ID = () => idprefix + (idgen++).toString(36);
const _diff = (a, b, A, B) => {
  if (isArray(a)) {
    const res = [];
    for (let i = 0, ii = a.length; i < ii; i++) {
      res[i] = _diff(a[i], b, A[i], B);
    }
    return res;
  }
  const dif = (A - a) / (B - b);
  return (bb) => a + dif * (bb - b);
};
const timer = Date.now || (() => Date.now());
const sta = function (val) {
  if (val == null) {
    return this.s;
  }
  const ds = this.s - val;
  this.b += this.dur * ds;
  this.B += this.dur * ds;
  this.s = val;
};
const speed = function (val) {
  if (val == null) {
    return this.spd;
  }
  this.spd = val;
};
const duration = function (val) {
  if (val == null) {
    return this.dur;
  }
  this.s = (this.s * val) / this.dur;
  this.dur = val;
};
const stopit = function () {
  delete animations[this.id];
  this.update();
  eve(`mina.stop.${this.id}`, this);
};
const pause = function () {
  if (this.pdif) {
    return;
  }
  delete animations[this.id];
  this.update();
  this.pdif = this.get() - this.b;
};
const resume = function () {
  if (!this.pdif) {
    return;
  }
  this.b = this.get() - this.pdif;
  this.pdif = undefined;
  animations[this.id] = this;
  frame();
};
const update = function () {
  let res;
  if (isArray(this.start)) {
    res = [];
    for (let j = 0, jj = this.start.length; j < jj; j++) {
      res[j] =
        +this.start[j] + (this.end[j] - this.start[j]) * this.easing(this.s);
    }
  } else {
    res = +this.start + (this.end - this.start) * this.easing(this.s);
  }
  this.set(res);
};
const frame = (timeStamp) => {
  // Manual invokation?
  if (!timeStamp) {
    // Frame loop stopped?
    if (!requestID) {
      // Start frame loop...
      requestID = requestAnimFrame(frame);
    }
    return;
  }
  let len = 0;
  for (const i in animations) {
    const a = animations[i];
    const b = a.get();
    len++;
    a.s = (b - a.b) / (a.dur / a.spd);
    if (a.s >= 1) {
      delete animations[i];
      a.s = 1;
      len--;
      ((a) => {
        setTimeout(() => {
          eve(`mina.finish.${a.id}`, a);
        });
      })(a);
    }
    a.update();
  }
  requestID = len ? requestAnimFrame(frame) : false;
};
/*\
       * mina
       [ method ]
       **
       * Generic animation of numbers
       **
       - a (number) start _slave_ number
       - A (number) end _slave_ number
       - b (number) start _master_ number (start time in general case)
       - B (number) end _master_ number (end time in general case)
       - get (function) getter of _master_ number (see @mina.time)
       - set (function) setter of _slave_ number
       - easing (function) #optional easing function, default is @mina.linear
       = (object) animation descriptor
       o {
       o         id (string) animation id,
       o         start (number) start _slave_ number,
       o         end (number) end _slave_ number,
       o         b (number) start _master_ number,
       o         s (number) animation status (0..1),
       o         dur (number) animation duration,
       o         spd (number) animation speed,
       o         get (function) getter of _master_ number (see @mina.time),
       o         set (function) setter of _slave_ number,
       o         easing (function) easing function, default is @mina.linear,
       o         status (function) status getter/setter,
       o         speed (function) speed getter/setter,
       o         duration (function) duration getter/setter,
       o         stop (function) animation stopper
       o         pause (function) pauses the animation
       o         resume (function) resumes the animation
       o         update (function) calles setter with the right value of the animation
       o }
      \*/
const mina = (a, A, b, B, get, set, easing) => {
  const anim = {
    id: ID(),
    start: a,
    end: A,
    b,
    s: 0,
    dur: B - b,
    spd: 1,
    get,
    set,
    easing: easing || mina.linear,
    status: sta,
    speed,
    duration,
    stop: stopit,
    pause,
    resume,
    update,
  };
  animations[anim.id] = anim;
  let len = 0;
  let i;
  for (i in animations) {
    len++;
    if (len == 2) {
      break;
    }
  }
  len == 1 && frame();
  return anim;
};
/*\
   * mina.time
   [ method ]
   **
   * Returns the current time. Equivalent to:
   | function () {
   |     return (new Date).getTime();
   | }
  \*/
mina.time = timer;
/*\
   * mina.getById
   [ method ]
   **
   * Returns an animation by its id
   - id (string) animation's id
   = (object) See @mina
  \*/
mina.getById = (id) => animations[id] || null;

/*\
   * mina.linear
   [ method ]
   **
   * Default linear easing
   - n (number) input 0..1
   = (number) output 0..1
  \*/
mina.linear = (n) => n;
/*\
   * mina.easeout
   [ method ]
   **
   * Easeout easing
   - n (number) input 0..1
   = (number) output 0..1
  \*/
mina.easeout = (n) => n ** 1.7;
/*\
   * mina.easein
   [ method ]
   **
   * Easein easing
   - n (number) input 0..1
   = (number) output 0..1
  \*/
mina.easein = (n) => n ** 0.48;
/*\
   * mina.easeinout
   [ method ]
   **
   * Easeinout easing
   - n (number) input 0..1
   = (number) output 0..1
  \*/
mina.easeinout = (n) => {
  if (n == 1) {
    return 1;
  }
  if (n == 0) {
    return 0;
  }
  const q = 0.48 - n / 1.04;
  const Q = Math.sqrt(0.1734 + q * q);
  const x = Q - q;
  const X = Math.abs(x) ** (1 / 3) * (x < 0 ? -1 : 1);
  const y = -Q - q;
  const Y = Math.abs(y) ** (1 / 3) * (y < 0 ? -1 : 1);
  const t = X + Y + 0.5;
  return (1 - t) * 3 * t * t + t * t * t;
};
/*\
   * mina.backin
   [ method ]
   **
   * Backin easing
   - n (number) input 0..1
   = (number) output 0..1
  \*/
mina.backin = (n) => {
  if (n == 1) {
    return 1;
  }
  const s = 1.70158;
  return n * n * ((s + 1) * n - s);
};
/*\
   * mina.backout
   [ method ]
   **
   * Backout easing
   - n (number) input 0..1
   = (number) output 0..1
  \*/
mina.backout = (n) => {
  if (n == 0) {
    return 0;
  }
  const m = n - 1;
  const s = 1.70158;
  return m * m * ((s + 1) * m + s) + 1;
};
/*\
   * mina.elastic
   [ method ]
   **
   * Elastic easing
   - n (number) input 0..1
   = (number) output 0..1
  \*/
mina.elastic = (n) => {
  if (n == !!n) {
    return n;
  }
  return 2 ** (-10 * n) * Math.sin(((n - 0.075) * (2 * Math.PI)) / 0.3) + 1;
};
/*\
   * mina.bounce
   [ method ]
   **
   * Bounce easing
   - n (number) input 0..1
   = (number) output 0..1
  \*/
mina.bounce = (num) => {
  let n = num;
  const s = 7.5625;
  const p = 2.75;
  let l;
  if (n < 1 / p) {
    l = s * n * n;
  } else {
    if (n < 2 / p) {
      n -= 1.5 / p;
      l = s * n * n + 0.75;
    } else {
      if (n < 2.5 / p) {
        n -= 2.25 / p;
        l = s * n * n + 0.9375;
      } else {
        n -= 2.625 / p;
        l = s * n * n + 0.984375;
      }
    }
  }
  return l;
};
export default mina;
