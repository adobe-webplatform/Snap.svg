// Copyright (c) 2016 Adobe Systems Incorporated. All rights reserved.
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
import mina from "./mina.js";
import { Snap } from "./svg.js";

Snap.plugin((Snap, Element, _Paper, _glob, _Fragment) => {
  const elproto = Element.prototype;
  const is = Snap.is;
  const Str = String;
  const has = "hasOwnProperty";
  const slice = (from, to, f) => {
    return (arr) => {
      let res = arr.slice(from, to);
      if (res.length == 1) {
        res = res[0];
      }
      let out = f ? f(res) : res;
      if (f && out == "r") {
        out = f([res]);
      }
      return out;
    };
  };
  const Animation = function (attr, ms, easing2, callback2) {
    let easing = easing2;
    let callback = callback2;
    if (typeof easing == "function" && !easing.length) {
      callback = easing;
      easing = mina.linear;
    }
    this.attr = attr;
    this.dur = ms;
    if (easing) {
      this.easing = easing;
    }
    if (callback) {
      this.callback = callback;
    }
  };
  Snap._.Animation = Animation;
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
  Snap.animation = (attr, ms, easing, callback) =>
    new Animation(attr, ms, easing, callback);
  /*\
     * Element.inAnim
     [ method ]
     **
     * Returns a set of animations that may be able to manipulate the current element
     **
     = (object) in format:
     o {
     o     anim (object) animation object,
     o     mina (object) @mina object,
     o     curStatus (number) 0..1 — status of the animation: 0 — just started, 1 — just finished,
     o     status (function) gets or sets the status of the animation,
     o     stop (function) stops the animation
     o }
    \*/
  elproto.inAnim = function () {
    const res = [];
    for (const id in this.anims)
      if (this.anims[has](id)) {
        ((a) => {
          res.push({
            anim: new Animation(a._attrs, a.dur, a.easing, a._callback),
            mina: a,
            curStatus: a.status(),
            status: (val) => a.status(val),
            stop: () => a.stop(),
          });
        })(this.anims[id]);
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
  Snap.animate = (from, to, setter, ms, easing2, callback2) => {
    let easing = easing2;
    let callback = callback2;
    if (typeof easing == "function" && !easing.length) {
      callback = easing;
      easing = mina.linear;
    }
    const now = mina.time();
    const anim = mina(from, to, now, now + ms, mina.time, setter, easing);
    callback && eve.once(`mina.finish.${anim.id}`, callback);
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
    const anims = this.inAnim();
    for (let i = 0, ii = anims.length; i < ii; i++) {
      anims[i].stop();
    }
    return this;
  };
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
  elproto.animate = function (attrs2, ms2, easing2, callback2) {
    let attrs = attrs2;
    let ms = ms2;
    let easing = easing2;
    let callback = callback2;
    if (typeof easing == "function" && !easing.length) {
      callback = easing;
      easing = mina.linear;
    }
    if (attrs instanceof Animation) {
      callback = attrs.callback;
      easing = attrs.easing;
      ms = attrs.dur;
      attrs = attrs.attr;
    }
    let fkeys = [];
    let tkeys = [];
    const keys = {};
    let from;
    let to;
    let f;
    let eq;
    for (const key in attrs)
      if (attrs[has](key)) {
        if (this.equal) {
          eq = this.equal(key, Str(attrs[key]));
          from = eq.from;
          to = eq.to;
          f = eq.f;
        } else {
          from = +this.attr(key);
          to = +attrs[key];
        }
        const len = is(from, "array") ? from.length : 1;
        keys[key] = slice(fkeys.length, fkeys.length + len, f);
        fkeys = fkeys.concat(from);
        tkeys = tkeys.concat(to);
      }
    const now = mina.time();
    const anim = mina(
      fkeys,
      tkeys,
      now,
      now + ms,
      mina.time,
      (val) => {
        const attr = {};
        for (const key in keys)
          if (keys[has](key)) {
            attr[key] = keys[key](val);
          }
        this.attr(attr);
      },
      easing,
    );
    this.anims[anim.id] = anim;
    anim._attrs = attrs;
    anim._callback = callback;
    eve(`snap.animcreated.${this.id}`, anim);
    eve.once(`mina.finish.${anim.id}`, () => {
      eve.off(`mina.*.${anim.id}`);
      delete this.anims[anim.id];
      callback?.call(this);
    });
    eve.once(`mina.stop.${anim.id}`, () => {
      eve.off(`mina.*.${anim.id}`);
      delete this.anims[anim.id];
    });
    return this;
  };
});
