// Copyright (c) 2025 Adobe Systems Incorporated. All rights reserved.
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
// ┌────────────────────────────────────────────────────────────┐ \\
// │ Eve 1.0.0 - JavaScript Events Library                               │ \\
// ├────────────────────────────────────────────────────────────┤ \\
// │ Author Dmitry Baranovskiy (http://dmitry.baranovskiy.com/)          │ \\
// └────────────────────────────────────────────────────────────┘ \\

const version = "1.0.0";
const has = "hasOwnProperty";
let separator = /[./]/;
const comaseparator = /\s*,\s*/;
const wildcard = "*";
const numsort = (a, b) => a - b;
let current_event;
let stop;
let events = { n: {} };
const firstDefined = function () {
  for (let i = 0, ii = this.length; i < ii; i++) {
    if (typeof this[i] != "undefined") {
      return this[i];
    }
  }
};
const lastDefined = function () {
  let i = this.length;
  while (--i) {
    if (typeof this[i] != "undefined") {
      return this[i];
    }
  }
};
const objtos = Object.prototype.toString;
const Str = String;
const isArray =
  Array.isArray ||
  ((ar) => Array.isArray(ar) || objtos.call(ar) == "[object Array]");
/*\
   * eve
   [ method ]

   * Fires event with given `name`, given scope and other parameters.

   - name (string) name of the *event*, dot (`.`) or slash (`/`) separated
   - scope (object) context for the event handlers
   - varargs (...) the rest of arguments will be sent to event handlers

   = (object) array of returned values from the listeners. Array has two methods `.firstDefined()` and `.lastDefined()` to get first or last not `undefined` value.
  \*/
const eve = (name, scope, ...args) => {
  const oldstop = stop;
  const listeners = eve.listeners(name);
  let z = 0;
  let l;
  const indexed = [];
  const queue = {};
  const out = [];
  const ce = current_event;
  out.firstDefined = firstDefined;
  out.lastDefined = lastDefined;
  current_event = name;
  stop = 0;
  const ii = listeners.length;
  for (let i = 0; i < ii; i++)
    if ("zIndex" in listeners[i]) {
      indexed.push(listeners[i].zIndex);
      if (listeners[i].zIndex < 0) {
        queue[listeners[i].zIndex] = listeners[i];
      }
    }
  indexed.sort(numsort);
  while (indexed[z] < 0) {
    l = queue[indexed[z++]];
    out.push(l.apply(scope, args));
    if (stop) {
      stop = oldstop;
      return out;
    }
  }
  for (let i = 0; i < ii; i++) {
    l = listeners[i];
    if ("zIndex" in l) {
      if (l.zIndex == indexed[z]) {
        out.push(l.apply(scope, args));
        if (stop) {
          break;
        }
        do {
          z++;
          l = queue[indexed[z]];
          l && out.push(l.apply(scope, args));
          if (stop) {
            break;
          }
        } while (l);
      } else {
        queue[l.zIndex] = l;
      }
    } else {
      out.push(l.apply(scope, args));
      if (stop) {
        break;
      }
    }
  }
  stop = oldstop;
  current_event = ce;
  return out;
};
// Undocumented. Debug only.
eve._events = events;
/*\
   * eve.listeners
   [ method ]

   * Internal method which gives you array of all event handlers that will be triggered by the given `name`.

   - name (string) name of the event, dot (`.`) or slash (`/`) separated

   = (array) array of event handlers
  \*/
eve.listeners = (name) => {
  const names = isArray(name) ? name : name.split(separator);
  let e = events;
  let item;
  let items;
  let k;
  let i;
  let ii;
  let j;
  let jj;
  let nes;
  let es = [e];
  const out = [];
  for (i = 0, ii = names.length; i < ii; i++) {
    nes = [];
    for (j = 0, jj = es.length; j < jj; j++) {
      e = es[j].n;
      items = [e[names[i]], e[wildcard]];
      k = 2;
      while (k--) {
        item = items[k];
        if (item) {
          nes.push(item);
          if (item.f) {
            out.push(...item.f);
          }
        }
      }
    }
    es = nes;
  }
  return out;
};
/*\
   * eve.separator
   [ method ]

   * If for some reasons you don’t like default separators (`.` or `/`) you can specify yours
   * here. Be aware that if you pass a string longer than one character it will be treated as
   * a list of characters.

   - separator (string) new separator. Empty string resets to default: `.` or `/`.
  \*/
eve.separator = (separ) => {
  let sep = separ;
  if (sep) {
    sep = Str(sep).replace(/(?=[.^\][-])/g, "\\");
    sep = `[${sep}]`;
    separator = new RegExp(sep);
  } else {
    separator = /[./]/;
  }
};
/*\
   * eve.on
   [ method ]
   **
   * Binds given event handler with a given name. You can use wildcards “`*`” for the names:
   | eve.on("*.under.*", f);
   | eve("mouse.under.floor"); // triggers f
   * Use @eve to trigger the listener.
   **
   - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
   - f (function) event handler function
   **
   - name (array) if you don’t want to use separators, you can use array of strings
   - f (function) event handler function
   **
   = (function) returned function accepts a single numeric parameter that represents z-index of the handler. It is an optional feature and only used when you need to ensure that some subset of handlers will be invoked in a given order, despite of the order of assignment.
   > Example:
   | eve.on("mouse", eatIt)(2);
   | eve.on("mouse", scream);
   | eve.on("mouse", catchIt)(1);
   * This will ensure that `catchIt` function will be called before `eatIt`.
   *
   * If you want to put your handler before non-indexed handlers, specify a negative value.
   * Note: I assume most of the time you don’t need to worry about z-index, but it’s nice to have this feature “just in case”.
  \*/
eve.on = (name, f) => {
  if (typeof f != "function") {
    return () => {};
  }
  const names = isArray(name)
    ? isArray(name[0])
      ? name
      : [name]
    : Str(name).split(comaseparator);
  for (let i = 0, ii = names.length; i < ii; i++) {
    ((name) => {
      const names = isArray(name) ? name : Str(name).split(separator);
      let e = events;
      let exist;
      for (let i = 0, ii = names.length; i < ii; i++) {
        e = e.n;
        if (!e[names[i]]) {
          e[names[i]] = { n: {} };
        }
        e = e[names[i]];
      }
      e.f = e.f || [];
      for (let i = 0, ii = e.f.length; i < ii; i++)
        if (e.f[i] == f) {
          exist = true;
          break;
        }
      !exist && e.f.push(f);
    })(names[i]);
  }
  return (zIndex) => {
    if (+zIndex == +zIndex) {
      f.zIndex = +zIndex;
    }
  };
};
/*\
   * eve.f
   [ method ]
   **
   * Returns function that will fire given event with optional arguments.
   * Arguments that will be passed to the result function will be also
   * concated to the list of final arguments.
   | el.onclick = eve.f("click", 1, 2);
   | eve.on("click", function (a, b, c) {
   |     console.log(a, b, c); // 1, 2, [event object]
   | });
   - event (string) event name
   - varargs (…) and any other arguments
   = (function) possible event handler function
  \*/
eve.f = (event, ...attrs) => {
  return () => {
    eve(event, null, ...attrs, event, ...attrs);
  };
};
/*\
   * eve.stop
   [ method ]
   **
   * Is used inside an event handler to stop the event, preventing any subsequent listeners from firing.
  \*/
eve.stop = () => {
  stop = 1;
};
/*\
   * eve.nt
   [ method ]
   **
   * Could be used inside event handler to figure out actual name of the event.
   **
   - subname (string) #optional subname of the event
   **
   = (string) name of the event, if `subname` is not specified
   * or
   = (boolean) `true`, if current event’s name contains `subname`
  \*/
eve.nt = (subname) => {
  const cur = isArray(current_event) ? current_event.join(".") : current_event;
  if (subname) {
    return new RegExp(`(?:\\.|\\/|^)${subname}(?:\\.|\\/|$)`).test(cur);
  }
  return cur;
};
/*\
   * eve.nts
   [ method ]
   **
   * Could be used inside event handler to figure out actual name of the event.
   **
   **
   = (array) names of the event
  \*/
eve.nts = () =>
  isArray(current_event) ? current_event : current_event.split(separator);
/*\
   * eve.off
   [ method ]
   **
   * Removes given function from the list of event listeners assigned to given name.
   * If no arguments specified all the events will be cleared.
   **
   - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
   - f (function) event handler function
  \*/
/*\
   * eve.unbind
   [ method ]
   **
   * See @eve.off
  \*/
eve.off = eve.unbind = (name, f) => {
  if (!name) {
    events = { n: {} };
    eve._events = events;
    return;
  }
  let names = isArray(name)
    ? isArray(name[0])
      ? name
      : [name]
    : Str(name).split(comaseparator);
  if (names.length > 1) {
    for (let i = 0, ii = names.length; i < ii; i++) {
      eve.off(names[i], f);
    }
    return;
  }
  names = isArray(name) ? name : Str(name).split(separator);
  let e;
  let key;
  let splice;
  let i;
  let ii;
  let j;
  let jj;
  const cur = [events];
  const inodes = [];
  for (i = 0, ii = names.length; i < ii; i++) {
    for (j = 0; j < cur.length; j += splice.length - 2) {
      splice = [j, 1];
      e = cur[j].n;
      if (names[i] != wildcard) {
        if (e[names[i]]) {
          splice.push(e[names[i]]);
          inodes.unshift({
            n: e,
            name: names[i],
          });
        }
      } else {
        for (key in e)
          if (e[has](key)) {
            splice.push(e[key]);
            inodes.unshift({
              n: e,
              name: key,
            });
          }
      }
      cur.splice.apply(cur, splice);
    }
  }
  for (i = 0, ii = cur.length; i < ii; i++) {
    e = cur[i];
    while (e.n) {
      if (f) {
        if (e.f) {
          for (j = 0, jj = e.f.length; j < jj; j++)
            if (e.f[j] == f) {
              e.f.splice(j, 1);
              break;
            }
          if (!e.f.length) {
            e.f = undefined;
          }
        }
        for (key in e.n)
          if (e.n[has](key) && e.n[key].f) {
            const funcs = e.n[key].f;
            for (j = 0, jj = funcs.length; j < jj; j++)
              if (funcs[j] == f) {
                funcs.splice(j, 1);
                break;
              }
            if (!funcs.length) {
              e.n[key].f = undefined;
            }
          }
      } else {
        e.f = undefined;
        for (key in e.n)
          if (e.n[has](key) && e.n[key].f) {
            e.n[key].f = undefined;
          }
      }
      e = e.n;
    }
  }
  // prune inner nodes in path
  prune: for (i = 0, ii = inodes.length; i < ii; i++) {
    e = inodes[i];
    for (key in e.n[e.name].f) {
      // not empty (has listeners)
      continue prune;
    }
    for (key in e.n[e.name].n) {
      // not empty (has children)
      continue prune;
    }
    // is empty
    delete e.n[e.name];
  }
};
/*\
   * eve.once
   [ method ]
   **
   * Binds given event handler with a given name to only run once then unbind itself.
   | eve.once("login", f);
   | eve("login"); // triggers f
   | eve("login"); // no listeners
   * Use @eve to trigger the listener.
   **
   - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
   - f (function) event handler function
   **
   = (function) same return function as @eve.on
  \*/
eve.once = (name, f) => {
  const f2 = function (...args) {
    eve.off(name, f2);
    return f.apply(this, args);
  };
  return eve.on(name, f2);
};
/*\
   * eve.version
   [ property (string) ]
   **
   * Current version of the library.
  \*/
eve.version = version;
eve.toString = () => `You are running Eve ${version}`;
export default eve;
