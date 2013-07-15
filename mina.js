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
window.mina = (function () {
    var animations = [],
    requestAnimFrame = window.requestAnimationFrame       ||
                       window.webkitRequestAnimationFrame ||
                       window.mozRequestAnimationFrame    ||
                       window.oRequestAnimationFrame      ||
                       window.msRequestAnimationFrame     ||
                       function (callback) {
                           setTimeout(callback, 16);
                       },
    isArray = Array.isArray || function (a) {
        return a instanceof Array ||
            Object.prototype.toString.call(a) == "[object Array]";
    },
    diff = function (a, b, A, B) {
        if (isArray(a)) {
            res = [];
            for (var i = 0, ii = a.length; i < ii; i++) {
                res[i] = diff(a[i], b, A[i], B);
            }
            return res;
        }
        var dif = (A - a) / (B - b);
        return function (bb) {
            return a + dif * (bb - b);
        };
    },
    timer = function () {
        return +new Date;
    },
    frame = function () {
        var value, one;
        for (var i = 0; i < animations.length; i++) {
            var a = animations[i],
                gen = a.b + (a.gen() - a.b) * a["*"] + a["+"];
            if (isArray(a.a)) {
                value = [];
                for (var j = 0, jj = a.a.length; j < jj; j++) {
                    value[j] = a.dif[j](gen);
                    one = a.A[j] - a.a[j];
                    value[j] = one ?
                        a.a[j] + a.easing((value[j] - a.a[j]) / one) * one :
                        a.a[j];
                }
            } else {
                value = a.dif(gen);
                one = a.A - a.a;
                value = a.a + a.easing((value - a.a) / one) * one;
            }
            try {
                if (a.stopper(gen)) {
                    if (--a.iterations) {
                        a["+"] += a.b - a.B; // -dur
                    } else {
                        animations.splice(i--, 1);
                        a.framer(a.A);
                        a.callback && a.callback();
                    }
                } else {
                    a.framer(value);
                }
            } catch (e) {
                console.error(e);
                // swallow
            }
        }
        animations.length && requestAnimFrame(frame);
    },
    setSpeed = function (speed) {
        this["*"] = Math.abs(speed);
        this.speed = speed;
        if (speed < 0) {
            var t = this.a;
            this.a = this.A;
            this.A = t;
            this.dif = diff(this.a, this.b, this.A, this.B);
            // TODO remove?
            this.stopper = stopperEnd(this.b, this.B);
        }
    },
    stopme = function () {
        for (var i = 0, ii = animations.length; i < ii; i++) {
            if (animations[i] == this) {
                animations.splice(i, 1);
                return;
            }
        }
    },
    queue = function (a, A, b, B, framer, callback, gen, stopper) {
        var anim = {
            framer: framer,
            callback: callback,
            dif: diff(a, b, A, B),
            easing: mina.linear,
            "+": 0,
            "*": 1,
            gen: gen,
            speed: 1,
            iterations: 1,
            stopper: stopper,
            a: a,
            b: b,
            A: A,
            B: B,
            setSpeed: setSpeed,
            stop: stopme
        };
        animations.push(anim);
        animations.length == 1 && requestAnimFrame(frame);
        return anim;
    },
    stopperEnd = function (a, A) {
        return function (value) {
            return a < A ? value >= A : value <= A;
        };
    },
    stopperStart = function (a, A) {
        return function (value) {
            return a < A ? value <= a : value >= a;
        };
    },
    mina = function (a, A, ms, frameHandler, callback) {
        var b = timer(),
            B = b + ms;
        frameHandler(a);
        return queue(a, A, b, B, frameHandler, callback, timer, stopperEnd(b, B));
    };
    mina.linear = function (n) {
        return n;
    };
    mina.easeout = function (n) {
        return Math.pow(n, 1.7);
    };
    mina.easein =  function (n) {
        return Math.pow(n, .48);
    };
    mina.easeinout = function (n) {
        var q = .48 - n / 1.04,
            Q = Math.sqrt(.1734 + q * q),
            x = Q - q,
            X = Math.pow(Math.abs(x), 1 / 3) * (x < 0 ? -1 : 1),
            y = -Q - q,
            Y = Math.pow(Math.abs(y), 1 / 3) * (y < 0 ? -1 : 1),
            t = X + Y + .5;
        return (1 - t) * 3 * t * t + t * t * t;
    };
    mina.backin = function (n) {
        var s = 1.70158;
        return n * n * ((s + 1) * n - s);
    };
    mina.backout = function (n) {
        n = n - 1;
        var s = 1.70158;
        return n * n * ((s + 1) * n + s) + 1;
    };
    mina.elastic = function (n) {
        if (n == !!n) {
            return n;
        }
        return Math.pow(2, -10 * n) * Math.sin((n - .075) * (2 * Math.PI) / .3) + 1;
    };
    mina.bounce = function (n) {
        var s = 7.5625,
            p = 2.75,
            l;
        if (n < (1 / p)) {
            l = s * n * n;
        } else {
            if (n < (2 / p)) {
                n -= (1.5 / p);
                l = s * n * n + .75;
            } else {
                if (n < (2.5 / p)) {
                    n -= (2.25 / p);
                    l = s * n * n + .9375;
                } else {
                    n -= (2.625 / p);
                    l = s * n * n + .984375;
                }
            }
        }
        return l;
    };
    
    return mina;
})();