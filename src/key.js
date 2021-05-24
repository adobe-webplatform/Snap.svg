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
      "keydown", "keyup", "keypress"
    ],
    addEvent = function (obj, type, fn, element) {
      var f = function (e) {
        return fn.call(element, e);
      };

      obj.addEventListener(type, f, false);

      return function () {
        obj.removeEventListener(type, f, false);
        return true;
      };
    };

  /*\
   * Element.keydown
   [ method ]
   **
   * Adds a keydown event handler to the element.
   - handler (function) handler for the event
   = (object) @Element
  \*/
  /*\
   * Element.unkeydown
   [ method ]
   **
   * Removes a keydown event handler from the element
   - handler (function) handler for the event
   = (object) @Element
  \*/

  /*\
   * Element.keyup
   [ method ]
   **
   * Adds a keyup event handler to the element.
   - handler (function) handler for the event
   = (object) @Element
  \*/
  /*\
   * Element.unkeyup
   [ method ]
   **
   * Removes a keyup event handler from the element
   - handler (function) handler for the event
   = (object) @Element
  \*/

  /*\
   * Element.keypress
   [ method ]
   **
   * Adds a keypress event handler to the element.
   - handler (function) handler for the event
   = (object) @Element
  \*/
  /*\
   * Element.unkeypress
   [ method ]
   **
   * Removes a keypress event handler from the element
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