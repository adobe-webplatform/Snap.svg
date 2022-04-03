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
Snap.plugin(function (Snap, Element, Paper, glob) {
  var elproto = Element.prototype,
    events = [
      "focus", "blur"
    ],
    addEvent = function (obj, type, fn, element) {
      var f = function (e) {
        return fn.call(element, e);
      };

      obj.addEventListener(type, f, true);

      return function () {
        obj.removeEventListener(type, f, true);
        return true;
      };
    };

  /*\
   * Element.focus
   [ method ]
   **
   * When called with a method property, adds a focus event handler to the element.
   * When called without a method property, sets focus to the element node.
   - handler (function) handler for the event
   = (object) @Element
  \*/
  /*\
   * Element.unfocus
   [ method ]
   **
   * Removes a focus event handler from the element
   - handler (function) handler for the event
   = (object) @Element
  \*/

  /*\
   * Element.blur
   [ method ]
   **
   * When called with a method property, adds a blur event handler to the element.
   * When called without a method property, blurs the element node.
   - handler (function) handler for the event
   = (object) @Element
  \*/
  /*\
   * Element.unblur
   [ method ]
   **
   * Removes a blur event handler from the element
   - handler (function) handler for the event
   = (object) @Element
  \*/
  for (var i = events.length; i--;) {
    (function (eventName) {
      Snap[eventName] = elproto[eventName] = function (fn, scope) {
        if (Snap.is(fn, "function")) {
          this.events = this.events || [];
          this.events.push({
            name: eventName,
            f: fn,
            unbind: addEvent(this.node || document, eventName, fn, scope || this)
          });
        } else if (this.node && Snap.is(this.node[eventName], "function")) {
          this.node[eventName]();
        } else {
          for (var i = 0, ii = this.events.length; i < ii; i++) {
            if (this.events[i].name == eventName) {
              try {
                this.events[i].f.call(this);
              } catch (e) { }
            }
          }
        }
        return this;
      };
      Snap["un" + eventName] =
        elproto["un" + eventName] = function (fn) {
          var events = this.events || [],
            l = events.length;
          while (l--) if (events[l].name == eventName &&
            (events[l].f == fn || !fn)) {
            events[l].unbind();
            events.splice(l, 1);
            !events.length && delete this.events;
            return this;
          }
          return this;
        };
    })(events[i]);
  }
});