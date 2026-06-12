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

Snap.plugin((_Snap, _Element, _Paper, _glob, _Fragment) => {
  const operators = {
    "+": (x, y) => x + y,
    "-": (x, y) => x - y,
    "/": (x, y) => x / y,
    "*": (x, y) => x * y,
  };
  const Str = String;
  const reUnit = /[a-z]+$/i;
  const reAddon = /^\s*([+\-/*])\s*=\s*([\d.eE+-]+)\s*([^\d\s]+)?\s*$/;
  const getNumber = (val) => val;
  const getUnit = (unit) => (val) => +val.toFixed(3) + unit;
  eve.on("snap.util.attr", function (value) {
    let val = value;
    const plus = Str(val).match(reAddon);
    if (plus) {
      const evnt = eve.nt();
      const name = evnt.substring(evnt.lastIndexOf(".") + 1);
      let a = this.attr(name);
      const atr = {};
      eve.stop();
      const unit = plus[3] || "";
      const aUnit = a.match(reUnit);
      const op = operators[plus[1]];
      if (aUnit && aUnit == unit) {
        val = op(Number.parseFloat(a), +plus[2]);
      } else {
        a = this.asPX(name);
        val = op(this.asPX(name), this.asPX(name, plus[2] + unit));
      }
      if (Number.isNaN(+a) || Number.isNaN(+val)) {
        return;
      }
      atr[name] = val;
      this.attr(atr);
    }
  })(-10);
  eve.on("snap.util.equal", function (name, b) {
    let a = Str(this.attr(name) || "");
    const bplus = Str(b).match(reAddon);
    if (bplus) {
      eve.stop();
      const unit = bplus[3] || "";
      const aUnit = a.match(reUnit);
      const op = operators[bplus[1]];
      if (aUnit && aUnit == unit) {
        return {
          from: Number.parseFloat(a),
          to: op(Number.parseFloat(a), +bplus[2]),
          f: getUnit(aUnit),
        };
      }
      a = this.asPX(name);
      return {
        from: a,
        to: op(a, this.asPX(name, bplus[2] + unit)),
        f: getNumber,
      };
    }
  })(-10);
});
