// Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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

Snap.plugin((_Snap, Element, _Paper, _glob, _Fragment) => {
  const rgNotSpace = /\S+/g;
  const Str = String;
  const elproto = Element.prototype;
  /*\
     * Element.addClass
     [ method ]
     **
     * Adds given class name or list of class names to the element.
     - value (string) class name or space separated list of class names
     **
     = (Element) original element.
    \*/
  elproto.addClass = function (value) {
    const classes = Str(value || "").match(rgNotSpace) || [];
    const elem = this.node;
    const className = elem.className.baseVal;
    const curClasses = className.match(rgNotSpace) || [];
    let j;
    let pos;
    let clazz;
    let finalValue;

    if (classes.length) {
      j = 0;
      clazz = classes[j++];
      while (clazz) {
        pos = curClasses.indexOf(clazz);
        if (!~pos) {
          curClasses.push(clazz);
        }
        clazz = classes[j++];
      }

      finalValue = curClasses.join(" ");
      if (className != finalValue) {
        elem.className.baseVal = finalValue;
      }
    }
    return this;
  };
  /*\
     * Element.removeClass
     [ method ]
     **
     * Removes given class name or list of class names from the element.
     - value (string) class name or space separated list of class names
     **
     = (Element) original element.
    \*/
  elproto.removeClass = function (value) {
    const classes = Str(value || "").match(rgNotSpace) || [];
    const elem = this.node;
    const className = elem.className.baseVal;
    const curClasses = className.match(rgNotSpace) || [];
    let j;
    let pos;
    let clazz;
    let finalValue;
    if (curClasses.length) {
      j = 0;
      clazz = classes[j++];
      while (clazz) {
        pos = curClasses.indexOf(clazz);
        if (~pos) {
          curClasses.splice(pos, 1);
        }
        clazz = classes[j++];
      }

      finalValue = curClasses.join(" ");
      if (className != finalValue) {
        elem.className.baseVal = finalValue;
      }
    }
    return this;
  };
  /*\
     * Element.hasClass
     [ method ]
     **
     * Checks if the element has a given class name in the list of class names applied to it.
     - value (string) class name
     **
     = (boolean) `true` if the element has given class
    \*/
  elproto.hasClass = function (value) {
    const elem = this.node;
    const className = elem.className.baseVal;
    const curClasses = className.match(rgNotSpace) || [];
    return !!~curClasses.indexOf(value);
  };
  /*\
     * Element.toggleClass
     [ method ]
     **
     * Add or remove one or more classes from the element, depending on either
     * the class’s presence or the value of the `flag` argument.
     - value (string) class name or space separated list of class names
     - flag (boolean) value to determine whether the class should be added or removed
     **
     = (Element) original element.
    \*/
  elproto.toggleClass = function (value, flag) {
    if (flag != null) {
      if (flag) {
        return this.addClass(value);
      }
      return this.removeClass(value);
    }
    const classes = (value || "").match(rgNotSpace) || [];
    const elem = this.node;
    const className = elem.className.baseVal;
    const curClasses = className.match(rgNotSpace) || [];
    let j;
    let pos;
    let clazz;
    let finalValue;
    j = 0;
    clazz = classes[j++];
    while (clazz) {
      pos = curClasses.indexOf(clazz);
      if (~pos) {
        curClasses.splice(pos, 1);
      } else {
        curClasses.push(clazz);
      }
      clazz = classes[j++];
    }

    finalValue = curClasses.join(" ");
    if (className != finalValue) {
      elem.className.baseVal = finalValue;
    }
    return this;
  };
});
