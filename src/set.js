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
import mina from "./mina.js";
import { Snap } from "./svg.js";

Snap.plugin((Snap, _Element, _Paper, _glob) => {
  const mmax = Math.max;
  const mmin = Math.min;

  // Set
  class Set {
    constructor(items) {
      this.items = [];
      this.bindings = {};
      this.length = 0;
      this.type = "set";
      if (items) {
        for (let i = 0, ii = items.length; i < ii; i++) {
          if (items[i]) {
            this[this.items.length] = this.items[this.items.length] = items[i];
            this.length++;
          }
        }
      }
    }
    /*\
             * Set.push
             [ method ]
             **
             * Adds each argument to the current set
             = (object) original element
            \*/
    push(...list) {
      let item;
      let len;
      for (let i = 0, ii = list.length; i < ii; i++) {
        item = list[i];
        if (item) {
          len = this.items.length;
          this[len] = this.items[len] = item;
          this.length++;
        }
      }
      return this;
    }
    /*\
             * Set.pop
             [ method ]
             **
             * Removes last element and returns it
             = (object) element
            \*/
    pop() {
      this.length && delete this[this.length--];
      return this.items.pop();
    }
    /*\
             * Set.forEach
             [ method ]
             **
             * Executes given function for each element in the set
             *
             * If the function returns `false`, the loop stops running.
             **
             - callback (function) function to run
             - thisArg (object) context object for the callback
             = (object) Set object
            \*/
    forEach(callback, thisArg) {
      for (let i = 0, ii = this.items.length; i < ii; i++) {
        if (callback.call(thisArg, this.items[i], i) == false) {
          return this;
        }
      }
      return this;
    }
    /*\
             * Set.animate
             [ method ]
             **
             * Animates each element in set in sync.
             *
             **
             - attrs (object) key-value pairs of destination attributes
             - duration (number) duration of the animation in milliseconds
             - easing (function) #optional easing function from @mina or custom
             - callback (function) #optional callback function that executes when the animation ends
             * or
             - animation (array) array of animation parameter for each element in set in format `[attrs, duration, easing, callback]`
             > Usage
             | // animate all elements in set to radius 10
             | set.animate({r: 10}, 500, mina.easein);
             | // or
             | // animate first element to radius 10, but second to radius 20 and in different time
             | set.animate([{r: 10}, 500, mina.easein], [{r: 20}, 1500, mina.easein]);
             = (Element) the current element
            \*/
    animate(attr, time, ease, call) {
      let attrs = attr;
      let ms = time;
      let easing = ease;
      let callback = call;
      if (typeof easing == "function" && !easing.length) {
        callback = easing;
        easing = mina.linear;
      }
      if (attrs instanceof Snap._.Animation) {
        callback = attrs.callback;
        easing = attrs.easing;
        ms = easing.dur;
        attrs = attrs.attr;
      }
      const args = [attr, time, ease, call];
      let each;
      if (Snap.is(attrs, "array") && Snap.is(args[args.length - 1], "array")) {
        each = true;
      }
      let begin;
      const handler = function () {
        if (begin) {
          this.b = begin;
        } else {
          begin = this.b;
        }
      };
      let cb = 0;
      const set = this;
      const callbacker =
        callback &&
        function () {
          if (++cb == set.length) {
            callback.call(this);
          }
        };
      return this.forEach((el, i) => {
        eve.once(`snap.animcreated.${el.id}`, handler);
        if (each) {
          args[i] && el.animate.apply(el, args[i]);
        } else {
          el.animate(attrs, ms, easing, callbacker);
        }
      });
    }
    /*\
             * Set.remove
             [ method ]
             **
             * Removes all children of the set.
             *
             = (object) Set object
            \*/
    remove() {
      while (this.length) {
        this.pop().remove();
      }
      return this;
    }
    /*\
             * Set.bind
             [ method ]
             **
             * Specifies how to handle a specific attribute when applied
             * to a set.
             *
             **
             - attr (string) attribute name
             - callback (function) function to run
             * or
             - attr (string) attribute name
             - element (Element) specific element in the set to apply the attribute to
             * or
             - attr (string) attribute name
             - element (Element) specific element in the set to apply the attribute to
             - eattr (string) attribute on the element to bind the attribute to
             = (object) Set object
            \*/
    bind(attr, a, b) {
      const data = {};
      if (typeof a == "function") {
        this.bindings[attr] = a;
      } else {
        const aname = b || attr;
        this.bindings[attr] = (v) => {
          data[aname] = v;
          a.attr(data);
        };
      }
      return this;
    }
    /*\
             * Set.attr
             [ method ]
             **
             * Equivalent of @Element.attr.
             = (object) Set object
            \*/
    attr(value) {
      const unbound = {};
      for (const k in value) {
        if (this.bindings[k]) {
          this.bindings[k](value[k]);
        } else {
          unbound[k] = value[k];
        }
      }
      for (let i = 0, ii = this.items.length; i < ii; i++) {
        this.items[i].attr(unbound);
      }
      return this;
    }
    /*\
             * Set.clear
             [ method ]
             **
             * Removes all elements from the set
            \*/
    clear() {
      while (this.length) {
        this.pop();
      }
    }
    /*\
             * Set.splice
             [ method ]
             **
             * Removes range of elements from the set
             **
             - index (number) position of the deletion
             - count (number) number of element to remove
             - insertion… (object) #optional elements to insert
             = (object) set elements that were deleted
            \*/
    splice(index, count, ...args) {
      const ind = index < 0 ? mmax(this.length + index, 0) : index;
      const c = mmax(0, mmin(this.length - ind, count));
      const tail = [];
      const todel = [];
      let i;
      for (i = 0; i < c; i++) {
        todel.push(this[ind + i]);
      }
      for (; i < this.length - ind; i++) {
        tail.push(this[ind + i]);
      }
      const arglen = args.length;
      for (i = 0; i < arglen + tail.length; i++) {
        this.items[ind + i] = this[ind + i] =
          i < arglen ? args[i] : tail[i - arglen];
      }
      i = this.items.length = this.length -= c - arglen;
      while (this[i]) {
        delete this[i++];
      }
      return new Set(todel);
    }
    /*\
             * Set.exclude
             [ method ]
             **
             * Removes given element from the set
             **
             - element (object) element to remove
             = (boolean) `true` if object was found and removed from the set
            \*/
    exclude(el) {
      for (let i = 0, ii = this.length; i < ii; i++)
        if (this[i] == el) {
          this.splice(i, 1);
          return true;
        }
      return false;
    }
    /*\
             * Set.insertAfter
             [ method ]
             **
             * Inserts set elements after given element.
             **
             - element (object) set will be inserted after this element
             = (object) Set object
            \*/
    insertAfter(el) {
      let i = this.items.length;
      while (i--) {
        this.items[i].insertAfter(el);
      }
      return this;
    }
    /*\
             * Set.getBBox
             [ method ]
             **
             * Union of all bboxes of the set. See @Element.getBBox.
             = (object) bounding box descriptor. See @Element.getBBox.
            \*/
    getBBox() {
      let x = [];
      let y = [];
      let x2 = [];
      let y2 = [];
      for (let i = this.items.length; i--; )
        if (!this.items[i].removed) {
          const box = this.items[i].getBBox();
          x.push(box.x);
          y.push(box.y);
          x2.push(box.x + box.width);
          y2.push(box.y + box.height);
        }
      x = mmin.apply(0, x);
      y = mmin.apply(0, y);
      x2 = mmax.apply(0, x2);
      y2 = mmax.apply(0, y2);
      return {
        x,
        y,
        x2,
        y2,
        width: x2 - x,
        height: y2 - y,
        cx: x + (x2 - x) / 2,
        cy: y + (y2 - y) / 2,
      };
    }
    /*\
             * Set.clone
             [ method ]
             **
             * Creates a clone of the set.
             **
             = (object) New Set object
            \*/
    clone() {
      const s = new Set();
      for (let i = 0, ii = this.items.length; i < ii; i++) {
        s.push(this.items[i].clone());
      }
      return s;
    }
    toString() {
      return "Snap\u2018s set";
    }
  }
  Set.prototype.type = "set";
  // export
  /*\
     * Snap.Set
     [ property ]
     **
     * Set constructor.
    \*/
  Snap.Set = Set;
  /*\
     * Snap.set
     [ method ]
     **
     * Creates a set and fills it with list of arguments.
     **
     = (object) New Set object
     | var r = paper.rect(0, 0, 10, 10),
     |     s1 = Snap.set(), // empty set
     |     s2 = Snap.set(r, paper.circle(100, 100, 20)); // prefilled set
    \*/
  Snap.set = (...list) => {
    const set = new Set();
    if (list.length) {
      set.push(...list);
    }
    return set;
  };
});
