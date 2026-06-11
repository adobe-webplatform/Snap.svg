// Snap.svg 1.0,1
//
// Copyright (c) 2013 – 2017 Adobe Systems Incorporated. All rights reserved.
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
//
// build: 2026-06-11

import eve from "./eve.esm.mjs";

const __minaGlobal = typeof globalThis !== "undefined" ? globalThis :
    (typeof self !== "undefined" ? self :
        (typeof window !== "undefined" ? window :
            (typeof global !== "undefined" ? global : Function("return this")())));

if (typeof global === "undefined") {
    // eslint-disable-next-line no-var
    var global = __minaGlobal;
}

if (!__minaGlobal.eve_ia) {
    __minaGlobal.eve_ia = eve;
}

if (!__minaGlobal.eve) {
    __minaGlobal.eve = eve;
}

// @ts-nocheck
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


(function (glob, factory) {
    // AMD support
    if (typeof define == "function" && define.amd) {
        // Define as an anonymous module that depends on eve
        define(["eve"], function (eve) {
            return factory(glob, eve);
        });
    } else if (typeof exports != "undefined") {
        // Next for Node.js or CommonJS
        const eve = require("eve");
        module.exports = factory(glob, eve);
    } else {
        // Browser globals (glob is window)
        // Snap adds itself to window
        glob.mina = factory(glob, glob.eve_ia || glob.eve);
    }
}(typeof window !== "undefined" ? window : (global || this), function (window, eve) {
    "use strict";
    let requestID;
    const isArray = Array.isArray || function (a) {
        return a instanceof Array || Object.prototype.toString.call(a) == "[object Array]";
    };
    let idgen = 0;
    const idprefix = "M" + (+new Date).toString(36);
    const _2PI = Math.PI * 2;
    const animations = {};
    let last = undefined;
    let global_speed = 1;
    let global_skip = 0;
    let expectedFrameDuration = 0;
    const requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
        return setTimeout(callback, 16);
    };
    const cancelAnimFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.oCancelAnimationFrame || window.msCancelAnimationFrame || function (id) {
        return clearTimeout(id);
    };
    let lastTimeStamp;
    const nativeSetTimeout = window.setTimeout ? window.setTimeout.bind(window) : function (callback) {
            if (typeof callback === "function") {
                callback();
            }
            return null;
        };
    const nativeClearTimeout = window.clearTimeout ? window.clearTimeout.bind(window) : function () {
        };
    const nativeSetInterval = window.setInterval ? window.setInterval.bind(window) : function (callback) {
            if (typeof callback === "function") {
                callback();
            }
            return null;
        };
    const nativeClearInterval = window.clearInterval ? window.clearInterval.bind(window) : function () {
        };
    const managedTimeouts = new Map();
    const managedIntervals = new Map();
    let timeoutCounter = 0;
    let intervalCounter = 0;
    let isGlobalPaused = false;
    const pausedAnimations = new Map();
    let timerOverridesInstalled = false;

    /**
     * @typedef {(number|number[])} AnimationValue
     * @description Numeric value (or array of numeric values) animated by mina.
     */

    /**
     * @callback MinaGetter
     * @returns {number} Current master value that drives the animation timeline.
     */

    /**
     * @callback MinaSetter
     * @param {AnimationValue} value The interpolated value to apply.
     * @param {boolean} [done] True when the animation reaches its end value.
     * @returns {void}
     */

    /**
     * @callback MinaEasing
     * @param {number} t Normalized progress in the `[0, 1]` range.
     * @returns {number} Eased progress value in the `[0, 1]` range.
     */

    /**
     * Drives the global animation loop and updates all registered animations.
     *
     * @param {number} [timeStamp] High-resolution timestamp provided by `requestAnimationFrame`.
     * @returns {void}
     */
    function frame(timeStamp) {
        // Manual invokation?
        if (!timeStamp) {
            // Frame loop stopped?
            if (!requestID) {
                // Start frame loop...
                requestID = requestAnimFrame(frame);
                lastTimeStamp = 0;
            }
            return;
        }


        if (expectedFrameDuration) { // Detect skipped frames
            const lapsed = timeStamp - lastTimeStamp;
            if (lastTimeStamp && lapsed > expectedFrameDuration) {
                console.warn("Skipped frames detected", lapsed);
            }
            lastTimeStamp = timeStamp;
        }

        let len = 0;
        for (const i in animations) if (animations.hasOwnProperty(i)) {
            const a = animations[i], b = a.get();
            len++;
            const d = a.dur / a.spd;
            a.s = (b - a.b) / d;
            const isDone = a.s >= 1;
            if (a.s >= 1) {
                delete animations[i];
                if (last === a) last = undefined;
                a.s = 1;
                len--;
                (function (a) {
                    setTimeout(function () {
                        eve(["snap", "mina", "finish", a.id], a);
                    });
                }(a));
                if (a._finish) {
                    a._finish.forEach((f) => f(a));
                    a._finish = undefined;
                }
            } else if (a.skip) {
                a._skip_step = a._skip_step || 0;
                if (a._skip_step) {
                    a._skip_step--;
                    continue;
                }
                a._skip_step = a.skip;
            }
            a.update(isDone);
        }
        requestID = len ? requestAnimFrame(frame) : false;
    }

    /**
     * Generates a unique animation identifier.
     *
     * @returns {string}
     */
    function ID() {
        return idprefix + (idgen++).toString(36);
    }

    /**
     * Computes a linear interpolation function for the supplied values.
     *
     * @param {AnimationValue} a Start value(s).
     * @param {number} b Start timestamp.
     * @param {AnimationValue} A End value(s).
     * @param {number} B End timestamp.
     * @returns {function(number): AnimationValue}
     */
    function diff(a, b, A, B) {
        if (isArray(a)) {
            const res = [];
            let i = 0;
            const ii = a.length;
            for (; i < ii; ++i) {
                res[i] = diff(a[i], b, A[i], B);
            }
            return res;
        }
        const dif = (A - a) / (B - b);
        return function (bb) {
            return a + dif * (bb - b);
        };
    }


    const timer = Date.now || function () {
        return +new Date;
    };

    const TIMEOUT_PREFIX = "mina-t-";
    const INTERVAL_PREFIX = "mina-i-";

    function installTimerOverrides() {
        if (timerOverridesInstalled || typeof window === "undefined") {
            return;
        }
        timerOverridesInstalled = true;
        window.clearTimeout = function (id) {
            if (!handleManagedTimeoutClear(id)) {
                return nativeClearTimeout(id);
            }
        };
        window.clearInterval = function (id) {
            if (!handleManagedIntervalClear(id)) {
                return nativeClearInterval(id);
            }
        };
    }

    function createTimeoutEntry(callback, delay, args, useAnimationFrame) {
        const id = TIMEOUT_PREFIX + (++timeoutCounter);
        const entry = {
            id,
            callback,
            args,
            start: null,
            remaining: Math.max(0, delay || 0),
            nativeHandle: null,
            rafHandle: null,
            useAnimationFrame: !!useAnimationFrame,
            paused: isGlobalPaused,
            cleared: false,
        };
        managedTimeouts.set(id, entry);
        if (!isGlobalPaused) {
            armTimeout(entry, entry.remaining);
        }
        return id;
    }

    function clearManagedTimeoutHandles(entry) {
        if (!entry) {
            return;
        }
        if (entry.nativeHandle != null) {
            nativeClearTimeout(entry.nativeHandle);
            entry.nativeHandle = null;
        }
        if (entry.rafHandle != null) {
            cancelAnimFrame(entry.rafHandle);
            entry.rafHandle = null;
        }
    }

    function armTimeoutWithAnimationFrame(entry) {
        const tick = function () {
            const current = managedTimeouts.get(entry.id);
            if (!current || current.cleared || current.paused) {
                return;
            }
            const elapsed = current.start != null ? (timer() - current.start) : current.remaining;
            if (elapsed >= current.remaining) {
                runManagedTimeout(current.id, "raf");
                return;
            }
            current.rafHandle = requestAnimFrame(tick);
        };
        entry.rafHandle = requestAnimFrame(tick);
    }

    function armTimeout(entry, wait) {
        entry.remaining = Math.max(0, wait || 0);
        entry.start = timer();
        entry.nativeHandle = nativeSetTimeout(function () {
            runManagedTimeout(entry.id, "native");
        }, entry.remaining);
        if (entry.useAnimationFrame) {
            armTimeoutWithAnimationFrame(entry);
        }
        entry.paused = false;
    }

    function runManagedTimeout(id, source) {
        const entry = managedTimeouts.get(id);
        if (!entry || entry.cleared) {
            return;
        }
        clearManagedTimeoutHandles(entry);
        if (isGlobalPaused) {
            entry.paused = true;
            entry.remaining = 0;
            return;
        }
        entry.cleared = true;
        managedTimeouts.delete(id);
        // if (source === "raf") {
        //     console.log("[mina.setTimeoutAmin] timeout executed via requestAnimationFrame", id);
        // } else if (source === "native"){
        //     console.log("[mina.setTimeoutAmin] timeout executed via regular", id);
        // }
        try{
            entry.callback && entry.callback.apply(undefined, entry.args);
        } catch (e){
            console.error(e);
        }

    }

    function pauseManagedTimeout(entry) {
        if (!entry || entry.cleared || entry.paused) {
            return;
        }
        const elapsed = entry.start != null ? (timer() - entry.start) : 0;
        entry.remaining = Math.max(0, entry.remaining - elapsed);
        clearManagedTimeoutHandles(entry);
        entry.paused = true;
    }

    function resumeManagedTimeout(entry) {
        if (!entry || entry.cleared || !entry.paused) {
            return;
        }
        armTimeout(entry, entry.remaining);
    }

    function cancelManagedTimeout(id) {
        const entry = managedTimeouts.get(id);
        if (!entry) {
            return false;
        }
        entry.cleared = true;
        entry.paused = false;
        clearManagedTimeoutHandles(entry);
        managedTimeouts.delete(id);
        return true;
    }

    function handleManagedTimeoutClear(id) {
        if (!isManagedTimeoutId(id)) {
            return false;
        }
        return cancelManagedTimeout(id);
    }

    function isManagedTimeoutId(id) {
        return typeof id === "string" && id.indexOf(TIMEOUT_PREFIX) === 0;
    }

    function createIntervalEntry(callback, interval, args) {
        const id = INTERVAL_PREFIX + (++intervalCounter);
        const entry = {
            id,
            callback,
            args,
            interval: Math.max(0, interval || 0),
            remaining: Math.max(0, interval || 0),
            start: null,
            nativeHandle: null,
            paused: isGlobalPaused,
            cleared: false,
        };
        managedIntervals.set(id, entry);
        if (!isGlobalPaused) {
            armInterval(entry, entry.interval);
        }
        return id;
    }

    function armInterval(entry, wait) {
        entry.remaining = Math.max(0, wait || 0);
        entry.start = timer();
        entry.nativeHandle = nativeSetTimeout(function () {
            runManagedInterval(entry.id);
        }, entry.remaining);
        entry.paused = false;
    }

    function runManagedInterval(id) {
        const entry = managedIntervals.get(id);
        if (!entry || entry.cleared) {
            return;
        }
        entry.nativeHandle = null;
        if (isGlobalPaused) {
            entry.paused = true;
            return;
        }
        entry.callback && entry.callback.apply(undefined, entry.args);
        if (entry.cleared) {
            managedIntervals.delete(id);
            return;
        }
        if (!isGlobalPaused) {
            armInterval(entry, entry.interval);
        } else {
            entry.paused = true;
        }
    }

    function pauseManagedInterval(entry) {
        if (!entry || entry.cleared || entry.paused) {
            return;
        }
        if (entry.nativeHandle != null) {
            nativeClearTimeout(entry.nativeHandle);
            const elapsed = entry.start != null ? (timer() - entry.start) : 0;
            entry.remaining = Math.max(0, entry.remaining - elapsed);
        } else {
            entry.remaining = entry.interval;
        }
        entry.nativeHandle = null;
        entry.paused = true;
    }

    function resumeManagedInterval(entry) {
        if (!entry || entry.cleared || !entry.paused) {
            return;
        }
        const wait = entry.remaining > 0 ? entry.remaining : entry.interval;
        armInterval(entry, wait);
    }

    function cancelManagedInterval(id) {
        const entry = managedIntervals.get(id);
        if (!entry) {
            return false;
        }
        entry.cleared = true;
        entry.paused = false;
        if (entry.nativeHandle != null) {
            nativeClearTimeout(entry.nativeHandle);
        }
        managedIntervals.delete(id);
        return true;
    }

    function handleManagedIntervalClear(id) {
        if (!isManagedIntervalId(id)) {
            return false;
        }
        return cancelManagedInterval(id);
    }

    function isManagedIntervalId(id) {
        return typeof id === "string" && id.indexOf(INTERVAL_PREFIX) === 0;
    }

    function pauseAllTimers() {
        managedTimeouts.forEach(pauseManagedTimeout);
        managedIntervals.forEach(pauseManagedInterval);
    }

    function resumeAllTimers() {
        managedTimeouts.forEach(resumeManagedTimeout);
        managedIntervals.forEach(resumeManagedInterval);
    }

    function stopAllTimers() {
        const timeoutIds = Array.from(managedTimeouts.keys());
        timeoutIds.forEach(cancelManagedTimeout);
        const intervalIds = Array.from(managedIntervals.keys());
        intervalIds.forEach(cancelManagedInterval);
    }

    installTimerOverrides();

    /**
     * Gets or sets the current status of an animation.
     *
     * @this {Animation}
     * @param {number} [val] New normalized progress in the `[0, 1]` range.
     * @returns {number|void}
     */
    function sta(val) {
        if (val == null) {
            return this.s;
        }
        const ds = this.s - val;
        this.b += this.dur * ds;
        this.B += this.dur * ds;
        this.s = val;
    }

    /**
     * Gets or sets the playback speed of an animation.
     *
     * @this {Animation}
     * @param {number} [val] New speed multiplier.
     * @returns {number|void}
     */
    function speed(val) {
        if (val == null) {
            return this.spd;
        }
        this.spd = val;
    }

    /**
     * Gets or sets the duration of an animation.
     *
     * @this {Animation}
     * @param {number} [val] New duration in timeline units.
     * @returns {number|void}
     */
    function duration(val) {
        if (val == null) {
            return this.dur;
        }
        this.s = this.s * val / this.dur;
        this.dur = val;
    }

    /**
     * Stops the animation immediately and emits the appropriate event.
     *
     * @this {Animation}
     * @returns {void}
     */
    function stopit() {
        delete animations[this.id];
        this.update();
        eve(["snap", "mina", "stop", this.id], this);
    }

    /**
     * Pauses the animation, preserving the current timeline offset.
     *
     * @this {Animation}
     * @returns {void}
     */
    function pause() {
        if (this.pdif) {
            return;
        }
        delete animations[this.id];
        this.update();
        this.pdif = this.get() - this.b;
    }

    /**
     * Resumes a paused animation from its preserved timeline offset.
     *
     * @this {Animation}
     * @returns {void}
     */
    function resume() {
        if (!this.pdif) {
            return;
        }
        this.b = this.get() - this.pdif;
        delete this.pdif;
        animations[this.id] = this;
        (Array.isArray(last)) ? last.push(this) : last = this;
        frame();
    }

    // const update = function () {
    //     let res;
    //     if (isArray(this.start)) {
    //         res = [];
    //         let j = 0;
    //         const jj = this.start.length;
    //         for (; j < jj; j++) {
    //             res[j] = this.rev
    //                 ? +this.end[j] + (this.start[j] - this.end[j]) * this.easing(1 - this.s)
    //                 : +this.start[j] + (this.end[j] - this.start[j]) * this.easing(this.s);
    //         }
    //     } else {
    //         res = this.rev
    //             ? +this.end + (this.start - this.end) * this.easing(1 - this.s)
    //             : +this.start + (this.end - this.start) * this.easing(this.s);
    //     }
    //     this.set(res);
    // };

    /**
     * Applies the easing function and updates the animated value.
     *
     * @this {Animation}
     * @param {boolean} [isDone=false] True when the animation reaches its end value.
     * @returns {void}
     */
    function update(isDone) {
        let chng = false;
        if (this._lastRev !== undefined && this._lastRev !== this.rev) {
            chng = true;
            if (this.rev_fast && 1 - this.s > this.s) this.status(1 - this.s);
            this._s = this.s;
        }
        let t = this._s ? (this.s - this._s) / (1 - this._s) : this.s;
        const is_arr = isArray(this.start);
        const start = is_arr ? this.start : [this.start];
        const end = is_arr ? this.end : [this.end];
        let res = [];

        for (let j = 0; j < start.length; j++) {
            if (chng) {
                this._tmpStart = this._tmpStart || [];
                this._tmpEnd = this._tmpEnd || [];
                this._tmpStart[j] = this._lastRes[j];
                if (this.rev) {
                    this._tmpEnd[j] = +start[j];
                } else {
                    this._tmpEnd[j] = +end[j];
                }
            }

            let s = (this._tmpStart) ? this._tmpStart[j] : +start[j];
            let e = (this._tmpEnd) ? this._tmpEnd[j] : +end[j];

            res[j] = s + (e - s) * this.easing(t);
        }

        this.set(is_arr ? res : res[0], !!isDone);
        this._lastRes = res;
        this._lastRev = this.rev;

        if (!is_arr) {
            this.start = start[0];
            this.end = end[0];
        }
    }

    /**
     * Toggles the playback direction of the animation.
     *
     * @this {Animation}
     * @param {boolean} [fast=false] When `true`, the animation attempts to reuse the current eased position for a smoother reversal.
     * @returns {void}
     */
    function reverse(fast) {
        this.rev = !this.rev;
        this.rev_fast = !!fast;
    }

    /**
     * Registers a callback that resolves once the animation reaches completion.
     *
     * @this {Animation}
     * @param {function(Animation): void} [callback] Invoked with the animation when it finishes.
     * @returns {Promise<void>} Promise that resolves when the animation finishes.
     */
    function then(callback) {
        return new Promise((resolve, reject) => {
            if (typeof callback === "function") {
                if (!this._finish) {
                    this._finish = [];
                }
                this._finish.push((a) => {
                    callback(a);
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * Descriptor returned by {@link mina} that encapsulates an active animation.
     *
     * @class Animation
     * @param {AnimationValue} a Starting value(s).
     * @param {AnimationValue} A Ending value(s).
     * @param {number} b Starting master value (typically, start time).
     * @param {number} B Ending master value (typically, end time).
     * @param {MinaGetter} get Retrieves the current master value.
     * @param {MinaSetter} set Applies the interpolated slave value.
     * @param {MinaEasing} [easing=mina.linear] Easing function that transforms progress.
     */
    class Animation {
        constructor(a, A, b, B, get, set, easing) {
            this.id = ID();
            this.start = a;
            this.end = A;
            this.b = b;
            this.s = 0;
            this.dur = B - b;
            this.get = get;
            this.set = set;
            this.easing = easing || mina.linear;
            this.spd = global_speed;
            this.skip = global_skip;
            this.rev = false;
            this.status = sta;
            this.speed = speed;
            this.duration = duration;
            this.stop = stopit;
            this.pause = pause;
            this.resume = resume;
            this.update = update;
            this.reverse = reverse;
            this.then = then;
            /**
             * Indicates whether the animation has finished.
             *
             * @returns {boolean}
             */
            this.done = function () {
                return this.status() === 1
            };
        }
    }

    /**
     * Creates a new animation descriptor and schedules it on the shared timeline.
     *
     * @param {AnimationValue} a Starting value(s).
     * @param {AnimationValue} A Ending value(s).
     * @param {number} b Start time or master value.
     * @param {number} B End time or master value.
     * @param {MinaGetter} get Getter invoked to retrieve the current master value.
     * @param {MinaSetter} set Setter invoked with the interpolated value during updates.
     * @param {MinaEasing} [easing=mina.linear] Optional easing function.
     * @returns {Animation}
     */
    function mina(a, A, b, B, get, set, easing) {
        const anim = new Animation(a, A, b, B, get, set, easing);
        animations[anim.id] = anim;
        (Array.isArray(last)) ? last.push(anim) : last = anim;
        if (isGlobalPaused) {
            if (!pausedAnimations.has(anim.id)) {
                pausedAnimations.set(anim.id, anim);
            }
            anim.pause();
            return anim;
        }
        let len = 0;
        for (const key of Object.keys(animations)) {
            len++;
            if (len === 2) {
                break;
            }
        }
        if (len === 1) {
            frame();
        }
        return anim;
    }

    /**
     * Exposes the `Animation` constructor for advanced use cases.
     * @type {Function}
     */
    mina.Animation = Animation;

    /**
     * Returns the current timestamp in milliseconds.
     * Mirrors `Date.now()` and is primarily used as the default master getter.
     *
     * @returns {number}
     */
    mina.time = timer;
    /**
     * Retrieves an animation descriptor by its identifier.
     *
     * @param {string} id Animation identifier generated by {@link mina}.
     * @returns {Animation|null} Registered animation or `null` if not found.
     */
    mina.getById = function (id) {
        return animations[id] || null;
    };

    /**
     * Default linear easing.
     *
     * @param {number} n Normalized progress in the `[0, 1]` range.
     * @returns {number}
     */
    mina.linear = function (n) {
        return n;
    };
    /**
     * Exponential ease-out easing.
     *
     * @param {number} n Normalized progress in the `[0, 1]` range.
     * @returns {number}
     */
    mina.easeout = function (n) {
        return Math.pow(n, 1.7);
    };
    /**
     * Exponential ease-in easing.
     *
     * @param {number} n Normalized progress in the `[0, 1]` range.
     * @returns {number}
     */
    mina.easein = function (n) {
        return Math.pow(n, .48);
    };
    /**
     * Smooth ease-in-out easing.
     *
     * @param {number} n Normalized progress in the `[0, 1]` range.
     * @returns {number}
     */
    mina.easeinout = function (n) {
        if (n == 1) {
            return 1;
        }
        if (n == 0) {
            return 0;
        }
        const q = .48 - n / 1.04, Q = Math.sqrt(.1734 + q * q), x = Q - q,
            X = Math.pow(Math.abs(x), 1 / 3) * (x < 0 ? -1 : 1), y = -Q - q,
            Y = Math.pow(Math.abs(y), 1 / 3) * (y < 0 ? -1 : 1), t = X + Y + .5;
        return (1 - t) * 3 * t * t + t * t * t;
    };
    /**
     * Back-in easing that overshoots slightly before accelerating.
     *
     * @param {number} [s_param=1.70158] Overshoot amount.
     * @param {number} n Normalized progress in the `[0, 1]` range.
     * @returns {number}
     */
    mina.backin = function (s_param, n) {
        if (n === undefined) {
            n = s_param;
            s_param = undefined;
        }
        if (n == 1) {
            return 1;
        }
        const s = s_param !== undefined ? +s_param : 1.70158;
        return n * n * ((s + 1) * n - s);
    };

    mina.backin.withParams = function (s_param) {
        return function (n) {
            return mina.backin(s_param, n);
        };
    };
    /**
     * Back-out easing that overshoots the end value before settling.
     *
     * @param {number} [s_param=1.70158] Overshoot amount.
     * @param {number} n Normalized progress in the `[0, 1]` range.
     * @returns {number}
     */
    mina.backout = function (s_param, n) {
        if (n === undefined) {
            n = s_param;
            s_param = undefined;
        }
        if (n == 0) {
            return 0;
        }
        n = n - 1;
        const s = s_param !== undefined ? +s_param : 1.70158;
        return n * n * ((s + 1) * n + s) + 1;
    };

    mina.backout.withParams = function (s_param) {
        return function (n) {
            return mina.backout(s_param, n);
        };
    };
    /**
     * Symmetric back-both easing combining easeInBack and easeOutBack behaviors.
     * Starts with a dip backward, crosses midway, and overshoots before stopping.
     *
     * @param {number} [s_param=1.70158] Overshoot amount (multiplied internally).
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.backInOut = function (s_param, n) {
        if (n === undefined) {
            n = s_param;
            s_param = undefined;
        }
        const s = (s_param !== undefined ? +s_param : 1.70158) * 1.525;
        n *= 2;
        if (n < 1) {
            return 0.5 * (n * n * ((s + 1) * n - s));
        }
        n -= 2;
        return 0.5 * (n * n * ((s + 1) * n + s) + 2);
    };

    mina.backInOut.withParams = function (s_param) {
        return function (n) {
            return mina.backInOut(s_param, n);
        };
    };
    /**
     * Elastic easing with optional amplitude and period customization.
     *
     * @param {number} [amp=1] Amplitude of the overshoot.
     * @param {number} [per=0.3] Period of oscillation.
     * @param {number} n Normalized progress in the `[0, 1]` range.
     * @returns {number}
     */
    mina.elastic = function (amp, per, n) {
        if (per === undefined) {
            n = amp;
            amp = 1;
        }

        if (n === undefined) {
            n = per;
            per = undefined;
        }

        if (n === !!n) {
            return n;
        }

        amp = amp || 1;

        const a = (amp >= 1) ? amp : 1;
        per = (per || .3) / (amp < 1 ? amp : 1);
        const f = per / _2PI * (Math.asin(1 / a) || 0);

        return a * (2 ** (-10 * n)) * Math.sin((n - f) * (_2PI / per)) + 1;

        // var k = _2PI / .3;
        // var ret = amp * Math.pow(2, -10 * n) * Math.sin((n - .075) * k) + 1;
    };
    /**
     * Creates a reusable elastic easing function with predefined parameters.
     *
     * @param {number} amp Amplitude passed to {@link mina.elastic}.
     * @param {number} per Period passed to {@link mina.elastic}.
     * @returns {MinaEasing}
     */
    mina.elastic.withParams = function (amp, per) {
        return mina.elastic.bind(undefined, amp, per);
    };

    const defaultElastic = mina.elastic.withParams(1, 0.3);
    const HALF_PI = Math.PI / 2;

    /**
     * Bounce easing that simulates a ball dropping and settling.
     *
     * @param {number} n Normalized progress in the `[0, 1]` range.
     * @returns {number}
     */
    mina.bounce = function (n) {
        const s = 7.5625, p = 2.75;

        if (n < 1 / p) {
            return s * n * n;
        } else if (n < 2 / p) {
            n -= 1.5 / p;
            return s * n * n + .75;
        } else if (n < 2.5 / p) {
            n -= 2.25 / p;
            return s * n * n + .9375;
        }
        n -= 2.625 / p;
        return s * n * n + .984375;
    };

    /**
     * Bounce easing with configurable rebound count and first rebound height.
     *
     * @param {number} b Number of bounces after the initial impact.
     * @param {number} h Height of the first bounce expressed as fraction `[0, 1]`. Default is b/(b+1)
     * @param {number} n Normalized progress in the `[0, 1]` range.
     * @returns {number}
     */
    mina.bounceGen = function (b, h, n) {

        if (h === undefined && n === undefined) return mina.bounce(b);

        b = Math.max(1, Math.floor(+b || 0));
        h = Math.max(0, Math.min(1, +h || b / (b + 1)));
        n = Math.max(0, Math.min(1, +n || 0));

        if (n === 0) {
            return 0;
        }
        if (n === 1) {
            return 1;
        }

        const amplitudeBase = 1 - h;
        const timeDecay = amplitudeBase > 0 ? Math.sqrt(amplitudeBase) : 0;

        const weights = [1];
        let weight = 1;
        for (let i = 0; i < b; i++) {
            if (i > 0) {
                weight *= timeDecay;
            }
            weights.push(weight);
        }

        const weightSum = weights.reduce((sum, w) => sum + w, 0);
        const baseDuration = 1 / weightSum;
        const freeDuration = baseDuration * weights[0];

        if (n <= freeDuration) {
            const local = n / freeDuration;
            const result = local * local;
            return Math.max(0, Math.min(1, result));
        }

        let cursor = freeDuration;
        let drop = amplitudeBase;

        for (let i = 0; i < b && cursor < 1; i++) {
            const segmentWeight = weights[i + 1];
            if (!segmentWeight) {
                drop *= amplitudeBase;
                continue;
            }
            const duration = baseDuration * segmentWeight;
            if (n <= cursor + duration) {
                const local = (n - cursor) / duration;
                const value = 1 - drop * 4 * local * (1 - local);
                return Math.max(0, Math.min(1, value));
            }
            cursor += duration;
            drop *= amplitudeBase;
        }

        return 1;
    };

    mina.bounceGen.withParams = function (b, h) {
        return mina.bounceGen.bind(undefined, b, h);
    }

    /**
     * Normalizes the arguments used by the pulse easing helpers.
     * Allows calling pattern where only progress is supplied.
     *
     * @param {number} [max_val=1]
     * @param {number} [mid_point=0.5]
     * @param {number} [repeat=1]
     * @param {number} n
     * @returns {{maxVal: number, midPoint: number, repeatCount: number, local: number, progress: number}}
     */
    function resolvePulseArgs(max_val, mid_point, repeat, n) {
        if (mid_point === undefined && repeat === undefined && n === undefined) {
            n = max_val;
            max_val = undefined;
        }

        const maxVal = (max_val === undefined ? 1 : +max_val) || 0;
        let midPoint = mid_point === undefined ? 0.5 : +mid_point;
        midPoint = Math.min(0.9999, Math.max(0.0001, isFinite(midPoint) ? midPoint : 0.5));
        const repeatCount = Math.max(0.0001, Math.abs(repeat === undefined ? 1 : +repeat) || 1);
        const progress = Math.max(0, Math.min(1, isFinite(+n) ? +n : 0));

        const fullCycles = progress * repeatCount;
        const cycleIndex = Math.floor(fullCycles);
        let local = fullCycles - cycleIndex;
        if (progress === 1) {
            local = 1;
        }

        return {maxVal, midPoint, repeatCount, local, progress};
    }

    function normalizePulseBaseInputs(max_val, mid_point) {
        const defaults = resolvePulseArgs(max_val, mid_point, 1, 0);
        return {
            maxVal: defaults.maxVal,
            midPoint: defaults.midPoint,
        };
    }

    /**
     * Core pulse computation shared by the linear and eased variants.
     *
     * @param {number} max_val
     * @param {number} mid_point
     * @param {number} repeat
     * @param {number} n
    * @param {function(number): number} [shaper]
     * @returns {number}
     */
    function pulseValue(max_val, mid_point, repeat, n, shaper) {
        const {maxVal, midPoint, local, progress} = resolvePulseArgs(max_val, mid_point, repeat, n);
        if (progress === 0 || progress === 1 && local === 1) {
            return 0;
        }

        const ascending = local <= midPoint;
        const segmentSpan = ascending ? midPoint : (1 - midPoint);
        const raw = segmentSpan ? (ascending ? local / midPoint : (local - midPoint) / (1 - midPoint)) : 0;
        const shaped = shaper ? shaper(Math.max(0, Math.min(1, raw))) : raw;
        const value = ascending ? shaped : 1 - shaped;
        return Math.max(0, Math.min(maxVal, value * maxVal));
    }

    /**
     * Linear pulse that rises from 0 to `max_val` at `mid_point` and returns to 0.
     *
     * @param {number} [max_val=1]
     * @param {number} [mid_point=0.5]
     * @param {number} [repeat=1]
     * @param {number} n Progress value `[0, 1]`.
     * @returns {number}
     */
    mina.pulseLinear = function (max_val, mid_point, repeat, n) {
        return pulseValue(max_val, mid_point, repeat, n);
    };

    mina.pulseLinear.withParams = function (max_val, mid_point, repeat) {
        return function (n) {
            return mina.pulseLinear(max_val, mid_point, repeat, n);
        };
    };

    // Backwards-compatible alias for legacy callers.
    mina.pulse = mina.pulseLinear;

    /**
     * Ease-in-out pulse that eases into the peak and eases back to zero.
     *
     * @param {number} [max_val=1]
     * @param {number} [mid_point=0.5]
     * @param {number} [repeat=1]
     * @param {number} n Progress value `[0, 1]`.
     * @returns {number}
     */
    mina.pulseEaseInOut = function (max_val, mid_point, repeat, n) {
        return pulseValue(max_val, mid_point, repeat, n, mina.easeInOutSine);
    };

    mina.pulseEaseInOut.withParams = function (max_val, mid_point, repeat) {
        return function (n) {
            return mina.pulseEaseInOut(max_val, mid_point, repeat, n);
        };
    };

    function normalizePulseDecayRepeat(repeat) {
        const numeric = repeat === undefined ? 1 : +repeat;
        if (!isFinite(numeric) || numeric <= 0) {
            return 1;
        }
        return numeric;
    }

    function normalizePulseDecayTimeline(n) {
        const numeric = isFinite(+n) ? +n : 0;
        const timeline = Math.max(0, numeric);
        const cycleIndex = Math.floor(timeline);
        const local = timeline - cycleIndex;
        return {cycleIndex, local};
    }

    function pulseDecayEnvelope(cycleIndex, decayFactor) {
        if (cycleIndex <= 0) {
            return 1;
        }
        const ratio = cycleIndex / (cycleIndex + decayFactor);
        const envelopeInput = Math.max(0, Math.min(1, 1 - ratio));
        return mina.easeOutQuad(envelopeInput);
    }

    /**
     * Repeating pulse that accepts `n > 1` and applies time decay across cycles.
     * The `repeat` parameter acts as the decay constant: larger values keep the
     * envelope higher for more cycles, smaller values fade faster.
     *
     * @param {number} [max_val=1]
     * @param {number} [mid_point=0.5]
     * @param {number} [repeat=1]
     * @param {number} n Timeline progress where each whole number represents a full pulse.
     * @returns {number}
     */
    mina.pulseDecay = function (max_val, mid_point, repeat, n) {
        if (mid_point === undefined && repeat === undefined && n === undefined) {
            n = max_val;
            max_val = undefined;
        }

        const {cycleIndex, local} = normalizePulseDecayTimeline(n);
        const decayFactor = normalizePulseDecayRepeat(repeat);
        const envelope = pulseDecayEnvelope(cycleIndex, decayFactor);
        if (envelope <= 0) {
            return 0;
        }

        const numericMax = max_val === undefined ? 1 : +max_val;
        const safeMax = isFinite(numericMax) ? numericMax : 0;
        const amplitude = safeMax * envelope;
        return pulseValue(amplitude, mid_point, 1, local);
    };

    mina.pulseDecay.withParams = function (max_val, mid_point, repeat) {
        const {maxVal, midPoint} = normalizePulseBaseInputs(max_val, mid_point);
        const decayFactor = normalizePulseDecayRepeat(repeat);
        return function (n) {
            const {cycleIndex, local} = normalizePulseDecayTimeline(n);
            const envelope = pulseDecayEnvelope(cycleIndex, decayFactor);
            if (envelope <= 0) {
                return 0;
            }
            return pulseValue(maxVal * envelope, midPoint, 1, local);
        };
    };

    const PROJECTILE_DEFAULT_MID = 0.5;
    const PROJECTILE_MIN_MID = 0.0001;
    const PROJECTILE_MAX_MID = 0.9999;
    const PROJECTILE_MID_EPS = 1e-7;

    function clampUnitInterval(value) {
        if (value <= 0) {
            return 0;
        }
        if (value >= 1) {
            return 1;
        }
        return value;
    }

    function coerceProgress(value) {
        const numeric = isFinite(+value) ? +value : 0;
        return clampUnitInterval(numeric);
    }

    function normalizeStepCount(count) {
        const numeric = Math.floor(isFinite(+count) ? +count : 0);
        return Math.max(1, numeric || 1);
    }

    function normalizeStepPosition(position) {
        if (typeof position === "string") {
            const token = position.toLowerCase();
            if (token === "start" || token === "leading") {
                return "start";
            }
            if (token === "end" || token === "trailing") {
                return "end";
            }
        }
        if (position === 0 || position === "0") {
            return "start";
        }
        return "end";
    }

    function evaluateSteps(count, position, progress) {
        const t = clampUnitInterval(isFinite(+progress) ? +progress : 0);
        const steps = normalizeStepCount(count);
        const mode = normalizeStepPosition(position);
        if (mode === "start") {
            return Math.min(1, Math.max(0, Math.ceil(t * steps) / steps));
        }
        return Math.min(1, Math.max(0, Math.floor(t * steps) / steps));
    }

    function pseudoNoise(progress, octaves, frequency, seed, amplitude) {
        const t = clampUnitInterval(isFinite(+progress) ? +progress : 0);
        const octaveCount = Math.max(1, Math.floor(isFinite(+octaves) ? +octaves : 3));
        const baseFrequency = Math.max(1, isFinite(+frequency) ? +frequency : 4);
        const amp = Math.max(0, isFinite(+amplitude) ? +amplitude : 0.08);
        const seedVal = isFinite(+seed) ? +seed : 0;
        let total = 0;
        let weight = 0;
        let currentAmp = 1;
        for (let i = 0; i < octaveCount; i++) {
            const freq = baseFrequency * Math.pow(2, i);
            const phase = seedVal * (i + 1) * 1.37;
            total += Math.sin((t * Math.PI * freq) + phase) * currentAmp;
            weight += currentAmp;
            currentAmp *= 0.5;
        }
        const normalized = weight ? total / weight : 0;
        const jitter = clampUnitInterval((normalized * amp) + 0.5);
        const blended = clampUnitInterval((jitter - 0.5) + t);
        return blended;
    }

    function springDampedValue(progress, frequency, damping) {
        const t = coerceProgress(progress);
        const freq = Math.max(0.1, isFinite(+frequency) ? +frequency : 8);
        const damp = Math.max(0, isFinite(+damping) ? +damping : 1.1);
        const envelope = Math.exp(-damp * t);
        const value = 1 - envelope * Math.cos(freq * t);
        return clampUnitInterval(value);
    }

    function rubberBandValue(progress, tightness) {
        const t = coerceProgress(progress);
        const stiffness = Math.max(0.01, isFinite(+tightness) ? +tightness : 0.75);
        const centered = (t - 0.5) * 2;
        const sign = centered >= 0 ? 1 : -1;
        const distance = Math.abs(centered);
        const eased = 1 - Math.exp(-distance / stiffness);
        return clampUnitInterval(0.5 + sign * eased * 0.5);
    }

    function createOutInEasing(outFn, inFn) {
        const easeOut = typeof outFn === "function" ? outFn : mina.linear;
        const easeIn = typeof inFn === "function" ? inFn : mina.linear;
        return function (n) {
            const t = coerceProgress(n);
            if (t < 0.5) {
                return 0.5 * easeOut(t * 2);
            }
            return 0.5 * easeIn((t - 0.5) * 2) + 0.5;
        };
    }

    const ANTICIPATE_DEFAULT_TENSION = 1.5;
    const ANTICIPATE_OVERSHOOT_SCALE = 1.5;

    function anticipateValue(t, tension) {
        return t * t * ((tension + 1) * t - tension);
    }

    function overshootValue(t, tension) {
        return t * t * ((tension + 1) * t + tension);
    }

    function flattenEasingInputs(input, target) {
        if (!target) {
            target = [];
        }
        if (input == null) {
            return target;
        }
        if (Array.isArray(input)) {
            for (let i = 0; i < input.length; i++) {
                flattenEasingInputs(input[i], target);
            }
            return target;
        }
        target.push(input);
        return target;
    }

    function resolveEasingReference(ref) {
        if (typeof ref === "function") {
            return ref;
        }
        if (typeof ref === "string" && typeof mina[ref] === "function") {
            return mina[ref];
        }
        if (ref == null) {
            return null;
        }
        if (typeof console !== "undefined" && console.warn) {
            console.warn("[mina] Unknown easing reference", ref, "- falling back to linear");
        }
        return null;
    }

    function normalizeEasingList(inputs) {
        const flattened = flattenEasingInputs(inputs, []);
        if (!flattened.length) {
            return [];
        }
        return flattened.map((item) => resolveEasingReference(item) || mina.linear);
    }

    function normalizeProjectileMidpoint(mid_point) {
        let mid = mid_point === undefined ? PROJECTILE_DEFAULT_MID : +mid_point;
        if (!isFinite(mid)) {
            mid = PROJECTILE_DEFAULT_MID;
        }
        if (mid <= PROJECTILE_MIN_MID) {
            return PROJECTILE_MIN_MID;
        }
        if (mid >= PROJECTILE_MAX_MID) {
            return PROJECTILE_MAX_MID;
        }
        return mid;
    }

    function normalizeProjectileProgress(n) {
        const numeric = isFinite(+n) ? +n : 0;
        return clampUnitInterval(numeric);
    }

    function buildProjectileCoefficients(mid) {
        const ascendA = -1 / (mid * mid);
        const ascendB = 2 / mid;
        const inv = 1 - mid;
        const descendA = -1 / (inv * inv);
        const descendB = 2 * mid / (inv * inv);
        const descendC = 1 - (mid * mid) / (inv * inv);
        return {mid, ascendA, ascendB, descendA, descendB, descendC};
    }

    const PROJECTILE_DEFAULT_COEFFS = buildProjectileCoefficients(PROJECTILE_DEFAULT_MID);

    function getProjectileCoefficients(mid_point) {
        const mid = normalizeProjectileMidpoint(mid_point);
        if (Math.abs(mid - PROJECTILE_DEFAULT_MID) < PROJECTILE_MID_EPS) {
            return PROJECTILE_DEFAULT_COEFFS;
        }
        return buildProjectileCoefficients(mid);
    }

    function evaluateProjectile(progress, coeffs) {
        if (progress <= coeffs.mid) {
            const value = coeffs.ascendA * progress * progress + coeffs.ascendB * progress;
            return clampUnitInterval(value);
        }
        const value = coeffs.descendA * progress * progress + coeffs.descendB * progress + coeffs.descendC;
        return clampUnitInterval(value);
    }

    /**
     * Projectile-inspired easing that mimics upward deceleration and downward acceleration.
     *
     * @param {number} [mid_point=0.5] Normalized time at which the apex (value = 1) occurs.
     * @param {number} n Progress value `[0, 1]`.
     * @returns {number}
     */
    mina.projectile = function (mid_point, n) {
        if (n === undefined) {
            n = mid_point;
            mid_point = undefined;
        }
        const progress = normalizeProjectileProgress(n);
        const coeffs = (mid_point === undefined)
            ? PROJECTILE_DEFAULT_COEFFS
            : getProjectileCoefficients(mid_point);
        return evaluateProjectile(progress, coeffs);
    };

    mina.projectile.withParams = function (mid_point) {
        const coeffs = getProjectileCoefficients(mid_point);
        return function (n) {
            return evaluateProjectile(normalizeProjectileProgress(n), coeffs);
        };
    };

    function applyComposeStages(stages, n) {
        let value = coerceProgress(n);
        if (!stages || !stages.length) {
            return value;
        }
        for (let i = 0; i < stages.length; i++) {
            value = stages[i](value);
        }
        return clampUnitInterval(value);
    }

    mina.compose = function () {
        if (!arguments.length) {
            return 0;
        }
        const inputArgs = Array.prototype.slice.call(arguments);
        const progress = inputArgs.pop();
        const stageInputs = (inputArgs.length === 1 && Array.isArray(inputArgs[0]))
            ? inputArgs[0]
            : inputArgs;
        const stages = normalizeEasingList(stageInputs);
        return applyComposeStages(stages, progress);
    };

    mina.compose.withParams = function () {
        const inputArgs = Array.prototype.slice.call(arguments);
        const stageInputs = (inputArgs.length === 1 && Array.isArray(inputArgs[0]))
            ? inputArgs[0]
            : inputArgs;
        const stages = normalizeEasingList(stageInputs);
        return function (n) {
            return applyComposeStages(stages, n);
        };
    };


    mina.delay = function () {
        if (!arguments.length) {
            return 0;
        }
        const inputArgs = Array.prototype.slice.call(arguments);
        const progress = inputArgs.pop();
        let easingCandidate;
        if (inputArgs.length > 1) {
            easingCandidate = inputArgs.pop();
        }
        const delayAmount = inputArgs.length ? inputArgs[0] : 0;
        const easingFn = resolveEasingReference(easingCandidate) || mina.linear;
        return applyDelayEasing(delayAmount, easingFn, progress);
    };

    mina.delay.withParams = function (delayAmount, easingCandidate) {
        const safeDelay = clampUnitInterval(isFinite(+delayAmount) ? +delayAmount : 0);
        const easingFn = resolveEasingReference(easingCandidate) || mina.linear;
        return function (n) {
            return applyDelayEasing(safeDelay, easingFn, n);
        };
    };

    mina.delayHalf = mina.delay.withParams(0.5);
    mina.delayQuarter = mina.delay.withParams(0.25);

    /**
     * Preset: anticipatory pull followed by a bounce settle.
     * @type {MinaEasing}
     */
    mina.anticipateBounce = mina.compose.withParams(mina.easeInBack, mina.bounceOut);

    /**
     * Preset: hold the start for 25% of the timeline, then snap out exponentially.
     * @type {MinaEasing}
     */
    mina.delayedSnap = mina.compose.withParams(mina.delayQuarter, mina.easeOutExpo);

    /**
     * Preset: punchy pulse that eases the return curve.
     * @type {MinaEasing}
     */
    mina.pulseIntro = mina.compose.withParams(
        mina.pulseLinear.withParams(1, 0.35, 1),
        mina.easeOutQuart
    );

    /**
     * Preset: dual spring response with a delayed secondary wobble.
     * @type {MinaEasing}
     */
    mina.doubleSpring = mina.compose.withParams(
        mina.springOut,
        mina.delay.withParams(0.4, mina.springIn)
    );

    function applyDelayEasing(delayAmount, easingFn, progress) {
        const delayRatio = clampUnitInterval(isFinite(+delayAmount) ? +delayAmount : 0);
        const easedProgress = coerceProgress(progress);
        const easing = easingFn || mina.linear;
        if (delayRatio >= 1) {
            return 0;
        }
        if (easedProgress <= delayRatio) {
            return 0;
        }
        const span = 1 - delayRatio;
        const local = clampUnitInterval((easedProgress - delayRatio) / span);
        return clampUnitInterval(easing(local));
    }


    /**
     * Discrete steps easing, equivalent to CSS `steps(count, position)`.
     * Great for sprite-sheet animations, pagination dots, or counters that must snap between integers.
     * @param {number} [count=4] Number of discrete segments.
     * @param {"start"|"end"} [position="end"] Whether the first jump occurs immediately (`start`) or after the first interval (`end`).
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.steps = function (count, position, n) {
        if (n === undefined) {
            if (position === undefined) {
                n = count;
                count = undefined;
            } else {
                n = position;
                position = undefined;
            }
        }
        const stepCount = normalizeStepCount(count === undefined ? 4 : count);
        const mode = normalizeStepPosition(position);
        return evaluateSteps(stepCount, mode, n);
    };

    mina.steps.withParams = function (count, position) {
        const stepCount = normalizeStepCount(count === undefined ? 4 : count);
        const mode = normalizeStepPosition(position);
        return function (n) {
            return evaluateSteps(stepCount, mode, n);
        };
    };

    /**
     * Deterministic noise-based easing that introduces subtle organic jitter while remaining bounded.
     * Perfect for shimmer, breathing indicators, or making robotic tweens feel alive.
     * Arguments mirror `(octaves, frequency, seed, amplitude, progress)` but only progress is required.
     * @returns {number}
     */
    mina.noise = function () {
        if (!arguments.length) {
            return 0;
        }
        const args = Array.prototype.slice.call(arguments);
        const progress = args.pop();
        const octaves = args.length ? args.shift() : undefined;
        const frequency = args.length ? args.shift() : undefined;
        const seed = args.length ? args.shift() : undefined;
        const amplitude = args.length ? args.shift() : undefined;
        return pseudoNoise(progress, octaves, frequency, seed, amplitude);
    };

    mina.noise.withParams = function (octaves, frequency, seed, amplitude) {
        return function (n) {
            return pseudoNoise(n, octaves, frequency, seed, amplitude);
        };
    };

    /**
     * Creates a timing function equivalent to CSS `cubic-bezier(p1x, p1y, p2x, p2y)`.
     * Start and end points are fixed at `(0, 0)` and `(1, 1)`; `p1`/`p2` describe the tangent handles.
     *
     * @param {number} p1x X coordinate of the first control point.
     * @param {number} p1y Y coordinate of the first control point.
     * @param {number} p2x X coordinate of the second control point.
     * @param {number} p2y Y coordinate of the second control point.
     * @returns {MinaEasing} Callable easing function that maps `[0, 1]` → `[0, 1]`.
     */
    function cubic_bezier(p1x, p1y, p2x, p2y) {
        if (p1x === p1y && p2x === p2y) {
            return function (n) {
                return n;
            };
        }

        const sampleCount = 11;
        const sampleStep = 1 / (sampleCount - 1);
        const samples = new Array(sampleCount);

        function calcBezier(t, a1, a2) {
            return ((1 - 3 * a2 + 3 * a1) * t + (3 * a2 - 6 * a1)) * t * t + 3 * a1 * t;
        }

        function slope(t, a1, a2) {
            return 3 * ((1 - 3 * a2 + 3 * a1) * t * t + 2 * (3 * a2 - 6 * a1) * t + (3 * a1));
        }

        for (let i = 0; i < sampleCount; i++) {
            samples[i] = calcBezier(i * sampleStep, p1x, p2x);
        }

        function getTForX(x) {
            let intervalStart = 0;
            let currentSample = 1;
            const lastSample = sampleCount - 1;

            for (; currentSample !== lastSample && samples[currentSample] <= x; currentSample++) {
                intervalStart += sampleStep;
            }
            currentSample -= 1;

            const segment = samples[currentSample + 1] - samples[currentSample];
            let guess = intervalStart;
            if (segment) {
                guess += ((x - samples[currentSample]) / segment) * sampleStep;
            }

            for (let i = 0; i < 4; i++) {
                const currentSlope = slope(guess, p1x, p2x);
                if (currentSlope === 0) {
                    return guess;
                }
                const currentX = calcBezier(guess, p1x, p2x) - x;
                guess -= currentX / currentSlope;
            }
            return guess;
        }

        return function (n) {
            if (n <= 0) {
                return 0;
            }
            if (n >= 1) {
                return 1;
            }
            const t = getTForX(n);
            return calcBezier(t, p1y, p2y);
        };
    }


    /**
     * Creates a cubic bezier easing function or applies it directly to a value.
     * If no parameters are provided, defaults to the ease timing function.
     *
     * @function
     * @param {number} [p1x] - The x-coordinate of the first control point (0-1)
     * @param {number} [p1y] - The y-coordinate of the first control point
     * @param {number} [p2x] - The x-coordinate of the second control point (0-1)
     * @param {number} [p2y] - The y-coordinate of the second control point
     * @param {number} n - The progress value (0-1) to evaluate the easing function at
     * @returns {number} The eased value
     * @example
     * // Using default ease timing
     * mina.cubicBezier(undefined, undefined, undefined, undefined, 0.5);
     *
     * @example
     * // Custom cubic bezier
     * mina.cubicBezier(0.42, 0, 0.58, 1, 0.5);
     */
    mina.cubicBezier = function (p1x, p1y, p2x, p2y, n) {
        if (n === undefined && p1y === undefined && p2x === undefined && p2y === undefined) {
            return mina.ease(p1x);
        }

        return cubic_bezier(p1x, p1y, p2x, p2y)(n);
    };

    /**
     * Creates and returns a reusable cubic bezier easing function with the specified control points.
     * This is useful when you need to apply the same easing function multiple times, for example whey passing to an
     * animation function.
     *
     * @function
     * @param {number} p1x - The x-coordinate of the first control point (0-1)
     * @param {number} p1y - The y-coordinate of the first control point
     * @param {number} p2x - The x-coordinate of the second control point (0-1)
     * @param {number} p2y - The y-coordinate of the second control point
     * @returns {function(number): number} A function that takes a progress value (0-1) and returns the eased value
     * @example
     * // Create a custom easing function
     * const myEasing = mina.cubicBezier.withParams(0.42, 0, 0.58, 1);
     * const easedValue = myEasing(0.5);
     */
    mina.cubicBezier.withParams = function (p1x, p1y, p2x, p2y) {
        return cubic_bezier(p1x, p1y, p2x, p2y)
    };

    /**
     * Equivalent to CSS `ease` timing function (cubic-bezier(0.25, 0.1, 0.25, 1)).
     * @type {MinaEasing}
     */
    mina.ease = cubic_bezier(0.25, 0.1, 0.25, 1);
    /**
     * Equivalent to CSS `ease-in` timing function (cubic-bezier(0.42, 0, 1, 1)).
     * @type {MinaEasing}
     */
    mina.easeIn = cubic_bezier(0.42, 0, 1, 1);
    /**
     * Equivalent to CSS `ease-out` timing function (cubic-bezier(0, 0, 0.58, 1)).
     * @type {MinaEasing}
     */
    mina.easeOut = cubic_bezier(0, 0, 0.58, 1);
    /**
     * Equivalent to CSS `ease-in-out` timing function (cubic-bezier(0.42, 0, 0.58, 1)).
     * @type {MinaEasing}
     */
    mina.easeInOut = cubic_bezier(0.42, 0, 0.58, 1);

    /**
     * CSS `ease-in-sine` implementation.
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.easeInSine = function (n) {
        return 1 - Math.cos(n * HALF_PI);
    };
    /**
     * CSS `ease-out-sine` implementation.
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.easeOutSine = function (n) {
        return Math.sin(n * HALF_PI);
    };
    /**
     * CSS `ease-in-out-sine` implementation.
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.easeInOutSine = function (n) {
        return -(Math.cos(Math.PI * n) - 1) / 2;
    };

    /**
     * Classic smoothstep easing (`3t^2 - 2t^3`).
     * Handy for shader-style fades or camera moves that must start/stop gently.
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.smoothStep = function (n) {
        const t = coerceProgress(n);
        return t * t * (3 - 2 * t);
    };

    /**
     * Five-term smootherstep easing (`6t^5 - 15t^4 + 10t^3`).
     * Use for camera or gradient transitions that need zero velocity and acceleration at the endpoints.
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.smootherStep = function (n) {
        const t = coerceProgress(n);
        return t * t * t * (t * (t * 6 - 15) + 10);
    };

    // Lowercase aliases for familiarity with shader-style naming.
    mina.smoothstep = mina.smoothStep;
    mina.smootherstep = mina.smootherStep;

    /**
     * Sine ease that decelerates then accelerates; great for looping UI where the midpoint should feel like a breath.
     * @type {MinaEasing}
     */
    mina.easeOutInSine = createOutInEasing(mina.easeOutSine, mina.easeInSine);

    /**
     * Quadratic ease-in curve (`t^2`).
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.easeInQuad = function (n) {
        return n * n;
    };
    /**
     * Quadratic ease-out curve (`1 - (1 - t)^2`).
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.easeOutQuad = function (n) {
        return n * (2 - n);
    };
    /**
     * Quadratic ease-in-out curve composed of two mirrored `t^2` segments.
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.easeInOutQuad = function (n) {
        return n < 0.5 ? 2 * n * n : 1 - Math.pow(-2 * n + 2, 2) / 2;
    };
    /**
     * Quadratic ease that decelerates then accelerates; useful for slider handles moving between two resting states.
     * @type {MinaEasing}
     */
    mina.easeOutInQuad = createOutInEasing(mina.easeOutQuad, mina.easeInQuad);

    /**
     * Cubic ease-in curve (`t^3`).
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.easeInCubic = function (n) {
        return n * n * n;
    };
    /**
     * Cubic ease-out curve (`(t-1)^3 + 1`).
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.easeOutCubic = function (n) {
        const t = n - 1;
        return t * t * t + 1;
    };
    /**
     * Cubic ease-in-out curve (`t^3` for first half, mirrored second half).
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.easeInOutCubic = function (n) {
        return n < 0.5 ? 4 * Math.pow(n, 3) : 1 - Math.pow(-2 * n + 2, 3) / 2;
    };
    /**
     * Cubic ease that performs an out-then-in transition; adds drama to hero animations without overshoot.
     * @type {MinaEasing}
     */
    mina.easeOutInCubic = createOutInEasing(mina.easeOutCubic, mina.easeInCubic);

    /**
     * Quartic ease-in curve (`t^4`).
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.easeInQuart = function (n) {
        return n * n * n * n;
    };
    /**
     * Quartic ease-out curve (`1 - (1 - t)^4`).
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.easeOutQuart = function (n) {
        const t = n - 1;
        return 1 - t * t * t * t;
    };
    /**
     * Quartic ease-in-out curve.
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.easeInOutQuart = function (n) {
        return n < 0.5 ? 8 * Math.pow(n, 4) : 1 - Math.pow(-2 * n + 2, 4) / 2;
    };
    /**
     * Quartic ease with out-then-in profile; nice for modals that settle halfway through a timeline sync.
     * @type {MinaEasing}
     */
    mina.easeOutInQuart = createOutInEasing(mina.easeOutQuart, mina.easeInQuart);

    /**
     * Quintic ease-in curve (`t^5`).
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.easeInQuint = function (n) {
        return Math.pow(n, 5);
    };
    /**
     * Quintic ease-out curve (`1 - (1 - t)^5`).
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.easeOutQuint = function (n) {
        return 1 - Math.pow(1 - n, 5);
    };
    /**
     * Quintic ease-in-out curve.
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.easeInOutQuint = function (n) {
        return n < 0.5 ? 16 * Math.pow(n, 5) : 1 - Math.pow(-2 * n + 2, 5) / 2;
    };
    /**
     * Quintic out-then-in curve for fast-moving elements that must pause mid-flight before accelerating again.
     * @type {MinaEasing}
     */
    mina.easeOutInQuint = createOutInEasing(mina.easeOutQuint, mina.easeInQuint);

    /**
     * Exponential ease-in that ramps quickly after a slow start.
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.easeInExpo = function (n) {
        return n === 0 ? 0 : Math.pow(2, 10 * (n - 1));
    };
    /**
     * Exponential ease-out that decelerates rapidly toward the end.
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.easeOutExpo = function (n) {
        return n === 1 ? 1 : 1 - Math.pow(2, -10 * n);
    };
    /**
     * Exponential ease-in-out: steep acceleration and deceleration.
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.easeInOutExpo = function (n) {
        if (n === 0 || n === 1) {
            return n;
        }
        return n < 0.5 ? Math.pow(2, 20 * n - 10) / 2 : (2 - Math.pow(2, -20 * n + 10)) / 2;
    };
    /**
     * Exponential out-then-in easing; ideal for chunky scrolling cards that want a sudden release then refocus.
     * @type {MinaEasing}
     */
    mina.easeOutInExpo = createOutInEasing(mina.easeOutExpo, mina.easeInExpo);

    /**
     * Circular ease-in curve that emulates the start of a circle arc.
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.easeInCirc = function (n) {
        return 1 - Math.sqrt(1 - n * n);
    };
    /**
     * Circular ease-out curve that mirrors the end of a circle arc.
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.easeOutCirc = function (n) {
        return Math.sqrt(1 - Math.pow(n - 1, 2));
    };
    /**
     * Circular ease-in-out curve combining the two halves of an arc.
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.easeInOutCirc = function (n) {
        return n < 0.5
            ? (1 - Math.sqrt(1 - 4 * n * n)) / 2
            : (Math.sqrt(1 - Math.pow(-2 * n + 2, 2)) + 1) / 2;
    };
    /**
     * Circular out-then-in easing, useful for focus rings or clip-path reveals that should feel orbital.
     * @type {MinaEasing}
     */
    mina.easeOutInCirc = createOutInEasing(mina.easeOutCirc, mina.easeInCirc);

    /**
     * Elastic ease-out wrapper using the default amplitude/period.
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.elasticOut = function (n) {
        return defaultElastic(n);
    };
    /**
     * Elastic ease-in wrapper using the default amplitude/period.
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.elasticIn = function (n) {
        return 1 - defaultElastic(1 - n);
    };
    /**
     * Elastic ease-in-out wrapper using the default amplitude/period.
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.elasticInOut = function (n) {
        if (n < 0.5) {
            return (1 - defaultElastic(1 - 2 * n)) * 0.5;
        }
        return 0.5 + defaultElastic(2 * n - 1) * 0.5;
    };
    /**
     * Alias for {@link mina.elasticIn}.
     * @type {MinaEasing}
     */
    mina.easeInElastic = mina.elasticIn;
    /**
     * Alias for {@link mina.elasticOut}.
     * @type {MinaEasing}
     */
    mina.easeOutElastic = mina.elasticOut;
    /**
     * Alias for {@link mina.elasticInOut}.
     * @type {MinaEasing}
     */
    mina.easeInOutElastic = mina.elasticInOut;

    /**
     * Back ease-in-out with overshoot on both ends.
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.backInOut = function (s_param, n) {
        if (n === undefined) {
            n = s_param;
            s_param = undefined;
        }
        const s = (s_param !== undefined ? +s_param : 1.70158) * 1.525;
        n *= 2;
        if (n < 1) {
            return 0.5 * (n * n * ((s + 1) * n - s));
        }
        n -= 2;
        return 0.5 * (n * n * ((s + 1) * n + s) + 2);
    };
    /**
     * Alias for {@link mina.backin}.
     * @type {MinaEasing}
     */
    mina.easeInBack = mina.backin;
    /**
     * Alias for {@link mina.backout}.
     * @type {MinaEasing}
     */
    mina.easeOutBack = mina.backout;
    /**
     * Alias for {@link mina.backInOut}.
     * @type {MinaEasing}
     */
    mina.easeInOutBack = mina.backInOut;

    /**
     * Android-style anticipate easing that dips below 0 before accelerating forward.
     * Perfect for swipe-to-dismiss or catapult effects where motion "winds up" before release.
     * @param {number} [tension=1.5] Controls the amount of backwards pull.
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.anticipate = function (tension, n) {
        if (n === undefined) {
            n = tension;
            tension = undefined;
        }
        const t = coerceProgress(n);
        const tightness = isFinite(+tension) ? +tension : ANTICIPATE_DEFAULT_TENSION;
        return anticipateValue(t, tightness);
    };

    mina.anticipate.withParams = function (tension) {
        const tightness = isFinite(+tension) ? +tension : ANTICIPATE_DEFAULT_TENSION;
        return function (n) {
            return anticipateValue(coerceProgress(n), tightness);
        };
    };

    /**
     * Anticipate + overshoot easing used by Android's AnticipateOvershootInterpolator.
     * Works well for onboarding arrows, expanding FABs, or any element that should tease before settling.
     * @param {number} [tension=1.5] Adjusts both anticipate and overshoot strength.
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.anticipateOvershoot = function (tension, n) {
        if (n === undefined) {
            n = tension;
            tension = undefined;
        }
        const tightness = (isFinite(+tension) ? +tension : ANTICIPATE_DEFAULT_TENSION) * ANTICIPATE_OVERSHOOT_SCALE;
        let t = coerceProgress(n) * 2;
        if (t < 1) {
            return 0.5 * anticipateValue(t, tightness);
        }
        t -= 1;
        return 0.5 * (overshootValue(t, tightness) + 1);
    };

    mina.anticipateOvershoot.withParams = function (tension) {
        const tightness = (isFinite(+tension) ? +tension : ANTICIPATE_DEFAULT_TENSION) * ANTICIPATE_OVERSHOOT_SCALE;
        return function (n) {
            let t = coerceProgress(n) * 2;
            if (t < 1) {
                return 0.5 * anticipateValue(t, tightness);
            }
            t -= 1;
            return 0.5 * (overshootValue(t, tightness) + 1);
        };
    };

    /**
     * Bounce ease-in derived from {@link mina.bounce}.
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.bounceIn = function (n) {
        return 1 - mina.bounce(1 - n);
    };
    /**
     * Bounce ease-out (alias of {@link mina.bounce}).
     * @type {MinaEasing}
     */
    mina.bounceOut = mina.bounce;
    /**
     * Bounce ease-in-out composed from `bounceIn` and `bounceOut`.
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.bounceInOut = function (n) {
        if (n < 0.5) {
            return (1 - mina.bounce(1 - 2 * n)) * 0.5;
        }
        return mina.bounce(2 * n - 1) * 0.5 + 0.5;
    };
    /**
     * Alias for {@link mina.bounceIn}.
     * @type {MinaEasing}
     */
    mina.easeInBounce = mina.bounceIn;
    /**
     * Alias for {@link mina.bounceOut}.
     * @type {MinaEasing}
     */
    mina.easeOutBounce = mina.bounceOut;
    /**
     * Alias for {@link mina.bounceInOut}.
     * @type {MinaEasing}
     */
    mina.easeInOutBounce = mina.bounceInOut;

    /**
     * Critically damped spring ease-out that clamps overshoot into `[0, 1]`.
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.spring = function (n) {
        const damping = Math.exp(-6 * n);
        const value = 1 - damping * Math.cos((6 - 1.5) * n);
        return Math.max(0, Math.min(1, value));
    };
    /**
     * Spring ease-in derived from {@link mina.spring}.
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.springIn = function (n) {
        return 1 - mina.spring(1 - n);
    };
    /**
     * Spring ease-out alias.
     * @type {MinaEasing}
     */
    mina.springOut = mina.spring;
    /**
     * Spring ease-in-out composed from `springIn`/`springOut`.
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.springInOut = function (n) {
        if (n < 0.5) {
            return (1 - mina.spring(1 - 2 * n)) * 0.5;
        }
        return mina.spring(2 * n - 1) * 0.5 + 0.5;
    };

    /**
     * Configurable spring easing with adjustable oscillation frequency and damping.
     * Use for pull-to-refresh, switches, or physics-inspired controls needing fine-tuned wobble.
     * @param {number} [frequency=8] Angular frequency of the oscillation.
     * @param {number} [damping=1.1] Damping factor; higher values settle faster.
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.springDamped = function (frequency, damping, n) {
        if (n === undefined) {
            if (damping !== undefined) {
                n = damping;
                damping = undefined;
            } else {
                n = frequency;
                frequency = undefined;
            }
        }
        return springDampedValue(n, frequency, damping);
    };

    mina.springDamped.withParams = function (frequency, damping) {
        return function (n) {
            return springDampedValue(n, frequency, damping);
        };
    };

    /**
     * Rubber-band easing inspired by iOS overscroll curves.
     * Ideal for edge-gesture resistance, overscroll glow, or elastic tooltips.
     * The curve is centered at 0.5, so real implementations usually map it back to
     * a signed displacement, e.g. `offset = base + range * (mina.rubber(p) - 0.5) * 2`,
     * which keeps the motion symmetric while preventing the value from hitting hard bounds.
     * @param {number} [tightness=0.75] Lower values feel stretchier, higher values stiffer.
     * @param {number} n Normalized progress `[0, 1]`.
     * @returns {number}
     */
    mina.rubber = function (tightness, n) {
        if (n === undefined) {
            n = tightness;
            tightness = undefined;
        }
        return rubberBandValue(n, tightness);
    };

    mina.rubber.withParams = function (tightness) {
        return function (n) {
            return rubberBandValue(n, tightness);
        };
    };

    /**
     * Alias for {@link mina.rubber}.
     * @type {MinaEasing}
     */
    mina.rubberBand = mina.rubber;

    /**
     * Preset: anticipatory pull followed by a bounce settle—designed for swipe cards or draggable tiles that snap home.
     * @type {MinaEasing}
     */
    mina.anticipateBounce = mina.compose.withParams(mina.easeInBack, mina.bounceOut);

    /**
     * Preset: hold the start for 25% of the timeline, then snap out exponentially; great for delayed emphasis reveals.
     * @type {MinaEasing}
     */
    mina.delayedSnap = mina.compose.withParams(mina.delayQuarter, mina.easeOutExpo);

    /**
     * Preset: punchy pulse that eases the return curve—nice for recording LEDs or attention pings.
     * @type {MinaEasing}
     */
    mina.pulseIntro = mina.compose.withParams(
        mina.pulseLinear.withParams(1, 0.35, 1),
        mina.easeOutQuart
    );

    /**
     * Preset: dual spring response with a delayed secondary wobble, suited for toggles or UI knobs that should bounce twice.
     * @type {MinaEasing}
     */
    mina.doubleSpring = mina.compose.withParams(
        mina.springOut,
        mina.delay.withParams(0.4, mina.springIn)
    );

    // ========================================================================
    // Lowercase aliases for CSS-equivalent camelCase easing functions
    // ========================================================================
    // Note: The old lowercase functions (easein, easeout, easeinout) are custom
    // implementations, so CSS equivalents use 'css' suffix to avoid conflicts.

    /**
     * Lowercase alias for CSS ease timing function.
     * @type {MinaEasing}
     * @see {@link mina.ease}
     */
    mina.easecss = mina.ease;

    /**
     * Lowercase alias for CSS ease-in timing function.
     * @type {MinaEasing}
     * @see {@link mina.easeIn}
     */
    mina.easeincss = mina.easeIn;

    /**
     * Lowercase alias for CSS ease-out timing function.
     * @type {MinaEasing}
     * @see {@link mina.easeOut}
     */
    mina.easeoutcss = mina.easeOut;

    /**
     * Lowercase alias for CSS ease-in-out timing function.
     * @type {MinaEasing}
     * @see {@link mina.easeInOut}
     */
    mina.easeinoutcss = mina.easeInOut;

    /**
     * Lowercase alias for easeInSine.
     * @type {MinaEasing}
     * @see {@link mina.easeInSine}
     */
    mina.easeinsine = mina.easeInSine;

    /**
     * Lowercase alias for easeOutSine.
     * @type {MinaEasing}
     * @see {@link mina.easeOutSine}
     */
    mina.easeoutsine = mina.easeOutSine;

    /**
     * Lowercase alias for easeInOutSine.
     * @type {MinaEasing}
     * @see {@link mina.easeInOutSine}
     */
    mina.easeinoutsine = mina.easeInOutSine;
    /**
     * Lowercase alias for easeOutInSine.
     * @type {MinaEasing}
     * @see {@link mina.easeOutInSine}
     */
    mina.easeoutinsine = mina.easeOutInSine;

    /**
     * Lowercase alias for easeInQuad.
     * @type {MinaEasing}
     * @see {@link mina.easeInQuad}
     */
    mina.easeinquad = mina.easeInQuad;

    /**
     * Lowercase alias for easeOutQuad.
     * @type {MinaEasing}
     * @see {@link mina.easeOutQuad}
     */
    mina.easeoutquad = mina.easeOutQuad;

    /**
     * Lowercase alias for easeInOutQuad.
     * @type {MinaEasing}
     * @see {@link mina.easeInOutQuad}
     */
    mina.easeinoutquad = mina.easeInOutQuad;
    /**
     * Lowercase alias for easeOutInQuad.
     * @type {MinaEasing}
     * @see {@link mina.easeOutInQuad}
     */
    mina.easeoutinquad = mina.easeOutInQuad;

    /**
     * Lowercase alias for easeInCubic.
     * @type {MinaEasing}
     * @see {@link mina.easeInCubic}
     */
    mina.easeincubic = mina.easeInCubic;

    /**
     * Lowercase alias for easeOutCubic.
     * @type {MinaEasing}
     * @see {@link mina.easeOutCubic}
     */
    mina.easeoutcubic = mina.easeOutCubic;

    /**
     * Lowercase alias for easeInOutCubic.
     * @type {MinaEasing}
     * @see {@link mina.easeInOutCubic}
     */
    mina.easeinoutcubic = mina.easeInOutCubic;
    /**
     * Lowercase alias for easeOutInCubic.
     * @type {MinaEasing}
     * @see {@link mina.easeOutInCubic}
     */
    mina.easeoutincubic = mina.easeOutInCubic;

    /**
     * Lowercase alias for easeInQuart.
     * @type {MinaEasing}
     * @see {@link mina.easeInQuart}
     */
    mina.easeinquart = mina.easeInQuart;

    /**
     * Lowercase alias for easeOutQuart.
     * @type {MinaEasing}
     * @see {@link mina.easeOutQuart}
     */
    mina.easeoutquart = mina.easeOutQuart;

    /**
     * Lowercase alias for easeInOutQuart.
     * @type {MinaEasing}
     * @see {@link mina.easeInOutQuart}
     */
    mina.easeinoutquart = mina.easeInOutQuart;
    /**
     * Lowercase alias for easeOutInQuart.
     * @type {MinaEasing}
     * @see {@link mina.easeOutInQuart}
     */
    mina.easeoutinquart = mina.easeOutInQuart;

    /**
     * Lowercase alias for easeInQuint.
     * @type {MinaEasing}
     * @see {@link mina.easeInQuint}
     */
    mina.easeinquint = mina.easeInQuint;

    /**
     * Lowercase alias for easeOutQuint.
     * @type {MinaEasing}
     * @see {@link mina.easeOutQuint}
     */
    mina.easeoutquint = mina.easeOutQuint;

    /**
     * Lowercase alias for easeInOutQuint.
     * @type {MinaEasing}
     * @see {@link mina.easeInOutQuint}
     */
    mina.easeinoutquint = mina.easeInOutQuint;
    /**
     * Lowercase alias for easeOutInQuint.
     * @type {MinaEasing}
     * @see {@link mina.easeOutInQuint}
     */
    mina.easeoutinquint = mina.easeOutInQuint;

    /**
     * Lowercase alias for easeInExpo.
     * @type {MinaEasing}
     * @see {@link mina.easeInExpo}
     */
    mina.easeinexpo = mina.easeInExpo;

    /**
     * Lowercase alias for easeOutExpo.
     * @type {MinaEasing}
     * @see {@link mina.easeOutExpo}
     */
    mina.easeoutexpo = mina.easeOutExpo;

    /**
     * Lowercase alias for easeInOutExpo.
     * @type {MinaEasing}
     * @see {@link mina.easeInOutExpo}
     */
    mina.easeinoutexpo = mina.easeInOutExpo;
    /**
     * Lowercase alias for easeOutInExpo.
     * @type {MinaEasing}
     * @see {@link mina.easeOutInExpo}
     */
    mina.easeoutinexpo = mina.easeOutInExpo;

    /**
     * Lowercase alias for easeInCirc.
     * @type {MinaEasing}
     * @see {@link mina.easeInCirc}
     */
    mina.easeincirc = mina.easeInCirc;

    /**
     * Lowercase alias for easeOutCirc.
     * @type {MinaEasing}
     * @see {@link mina.easeOutCirc}
     */
    mina.easeoutcirc = mina.easeOutCirc;

    /**
     * Lowercase alias for easeInOutCirc.
     * @type {MinaEasing}
     * @see {@link mina.easeInOutCirc}
     */
    mina.easeinoutcirc = mina.easeInOutCirc;
    /**
     * Lowercase alias for easeOutInCirc.
     * @type {MinaEasing}
     * @see {@link mina.easeOutInCirc}
     */
    mina.easeoutincirc = mina.easeOutInCirc;

    /**
     * Lowercase alias for easeInElastic.
     * @type {MinaEasing}
     * @see {@link mina.easeInElastic}
     */
    mina.easeinelastic = mina.easeInElastic;

    /**
     * Lowercase alias for easeOutElastic.
     * @type {MinaEasing}
     * @see {@link mina.easeOutElastic}
     */
    mina.easeoutelastic = mina.easeOutElastic;

    /**
     * Lowercase alias for easeInOutElastic.
     * @type {MinaEasing}
     * @see {@link mina.easeInOutElastic}
     */
    mina.easeinoutelastic = mina.easeInOutElastic;

    /**
     * Lowercase alias for easeInBack.
     * @type {MinaEasing}
     * @see {@link mina.easeInBack}
     */
    mina.easeinback = mina.easeInBack;

    /**
     * Lowercase alias for easeOutBack.
     * @type {MinaEasing}
     * @see {@link mina.easeOutBack}
     */
    mina.easeoutback = mina.easeOutBack;

    /**
     * Lowercase alias for easeInOutBack.
     * @type {MinaEasing}
     * @see {@link mina.easeInOutBack}
     */
    mina.easeinoutback = mina.easeInOutBack;

    /**
     * Lowercase alias for easeInBounce.
     * @type {MinaEasing}
     * @see {@link mina.easeInBounce}
     */
    mina.easeinbounce = mina.easeInBounce;

    /**
     * Lowercase alias for easeOutBounce.
     * @type {MinaEasing}
     * @see {@link mina.easeOutBounce}
     */
    mina.easeoutbounce = mina.easeOutBounce;

    /**
     * Lowercase alias for easeInOutBounce.
     * @type {MinaEasing}
     * @see {@link mina.easeInOutBounce}
     */
    mina.easeinoutbounce = mina.easeInOutBounce;

    /**
     * Flags functions that are not easing helpers so they are excluded from {@link mina.isEasing} checks.
     * @type {Record<string, boolean>}
     */
    const non_easing_functions = {
        Animation: true,
        getById: true,
        getEasings: true,
        isEasing: true,
        anim: true,
        time: true,
        setSpeed: true,
        setSkip: true,
        setTimeout: true,
        setTimeoutAmin: true,
        setTimeoutNow: true,
        setInterval: true,
        pauseAll: true,
        resumeAll: true,
        stopAll: true,
        clearTimeout: true,
        clearInterval: true,
        trakSkippedFrames: true,
        cubic_bezier: true,
        getLast: true
    };
    /**
     * Determines whether the provided key refers to a registered easing function.
     *
     * @param {string} name Property name on the mina namespace.
     * @returns {boolean}
     */
    mina.isEasing = function (name) {
        return mina.hasOwnProperty(name) && !non_easing_functions[name]
    };

    const get_easings_excluded_names = {
        compose: true,
        delay: true
    };

    /**
     * Returns easing function names registered on the mina namespace.
     *
     * @param {boolean} [unique=false] When `true`, only returns one name per unique function reference.
     * @returns {string[]}
     */
    mina.getEasings = function (unique) {
        const names = Object.keys(mina).filter(function (name) {
            return mina.isEasing(name)
                && !get_easings_excluded_names[name]
                && typeof mina[name] === "function";
        });

        if (!unique) {
            return names;
        }

        const seen = new Set();
        return names.filter(function (name) {
            const fn = mina[name];
            if (seen.has(fn)) {
                return false;
            }
            seen.add(fn);
            return true;
        });
    };

    /**
     * Updates the global speed multiplier applied to all running animations.
     *
     * @param {number} [speed=1] Speed multiplier; values greater than `1` speed up animations.
     * @param {number} [skip] Optional skip interval forwarded to {@link mina.setSkip}.
     * @returns {void}
     */
    mina.setSpeed = function (speed, skip) {
        if (speed) {
            global_speed = speed;
        } else {
            global_speed = 1;
        }
        Object.values(animations).forEach(function (anim) {
            anim.speed(speed);
        });
        if (skip) this.setSkip(skip);
    };

    /**
     * Sets the global step-skipping interval for all animations.
     *
     * @param {number} skip Number of frames to skip between updates.
     * @returns {void}
     */
    mina.setSkip = function (skip) {
        global_skip = Math.floor(+skip);
        Object.values(animations).forEach(function (anim) {
            anim.skip = global_skip;
        });
    }

    /**
     * Pauses every running animation and managed timer, freezing global time.
     * @returns {void}
     */
    mina.pauseAll = function () {
        if (isGlobalPaused) {
            return;
        }
        isGlobalPaused = true;
        const ids = Object.keys(animations);
        ids.forEach(function (key) {
            const anim = animations[key];
            if (!anim || anim.pdif) {
                return;
            }
            pausedAnimations.set(anim.id, anim);
            anim.pause();
        });
        pauseAllTimers();
    };

    /**
     * Resumes animations and timers that were paused with {@link mina.pauseAll}.
     * @returns {void}
     */
    mina.resumeAll = function () {
        if (!isGlobalPaused) {
            return;
        }
        isGlobalPaused = false;
        const toResume = Array.from(pausedAnimations.values());
        pausedAnimations.clear();
        toResume.forEach(function (anim) {
            if (anim && anim.pdif) {
                anim.resume();
            }
        });
        resumeAllTimers();
    };

    /**
     * Stops all animations and timers, clearing any paused state.
     * @returns {void}
     */
    mina.stopAll = function () {
        const processed = new Set();
        const ids = Object.keys(animations);
        ids.forEach(function (key) {
            const anim = animations[key];
            if (anim && typeof anim.stop === "function") {
                processed.add(anim.id);
                anim.stop();
            }
        });
        pausedAnimations.forEach(function (anim) {
            if (!anim || processed.has(anim.id)) {
                return;
            }
            if (typeof anim.stop === "function") {
                anim.stop();
            }
        });
        pausedAnimations.clear();
        isGlobalPaused = false;
        stopAllTimers();
        last = undefined;
    };

    /**
     * Schedules a timeout that respects the global mina speed multiplier.
     *
     * @param {Function} callback Handler to invoke.
     * @param {number} deley Delay in milliseconds (affected by `setSpeed`).
     * @param {...any} args Optional arguments forwarded to the callback.
     * @returns {number}
     */
    mina.setTimeout = function (callback, deley, ...args) {
        const delay = Math.max(0, (+deley || 0) * global_speed);
        return createTimeoutEntry(callback, delay, args, false);
    }

    /**
     * Schedules a timeout that races native timeout and animation-frame polling,
     * executing whichever path reaches the target delay first.
     *
     * @param {Function} callback Handler to invoke.
     * @param {number} deley Delay in milliseconds (affected by `setSpeed`).
     * @param {...any} args Optional arguments forwarded to the callback.
     * @returns {number}
     */
    mina.setTimeoutAmin = function (callback, deley, ...args) {
        const delay = Math.max(0, (+deley || 0) * global_speed);
        return createTimeoutEntry(callback, delay, args, true);
    }

    /**
     * Schedules an immediate or delayed callback aligned with the global speed multiplier.
     *
     * @param {Function} callback Handler to invoke.
     * @param {number} deley Delay in milliseconds before execution.
     * @param {...any} args Optional arguments forwarded to the callback.
     * @returns {number|void}
     */
    mina.setTimeoutNow = function (callback, deley, ...args) {
        const delay = Math.max(0, (+deley || 0) * global_speed);
        return delay ? createTimeoutEntry(callback, delay, args) : callback(...args);
    }

    /**
     * Registers an interval timer that honors the global speed multiplier.
     *
     * @param {Function} callback Handler to invoke on each tick.
     * @param {number} interval Interval duration in milliseconds.
     * @param {...any} args Optional arguments forwarded to the callback.
     * @returns {number}
     */
    mina.setInterval = function (callback, interval, ...args) {
        const duration = Math.max(0, (+interval || 0) * global_speed);
        return createIntervalEntry(callback, duration, args);
    };

    /**
     * Clears a timeout created via {@link mina.setTimeout}.
     * @param {string|number} id Timeout identifier returned by `mina.setTimeout`.
     * @returns {void}
     */
    mina.clearTimeout = function (id) {
        if (!handleManagedTimeoutClear(id)) {
            return nativeClearTimeout(id);
        }
    };

    /**
     * Clears an interval created via {@link mina.setInterval}.
     * @param {string|number} id Interval identifier returned by `mina.setInterval`.
     * @returns {void}
     */
    mina.clearInterval = function (id) {
        if (!handleManagedIntervalClear(id)) {
            return nativeClearInterval(id);
        }
    };

    /**
     * Enables detection of skipped frames by providing an expected frame duration.
     *
     * @param {number} [frame_time=18] Expected duration of each frame in milliseconds.
     * @returns {void}
     */
    mina.trakSkippedFrames = function (frame_time) {
        expectedFrameDuration = (frame_time === undefined) ? 18 // a bit longer than 60fps frame
            : +(frame_time || 0)
    }

    /**
     * Returns the last animation(s) registered or starts collecting the next batch.
     *
     * @param {boolean} [start_collecting=false] When `true`, clears the stored reference and begins collecting anew.
     * @returns {Animation|Animation[]|undefined}
     */
    mina.getLast = function (start_collecting) {
        if (start_collecting) {
            last = [];
            return;
        }
        if (Array.isArray(last)) {
            let l = last;
            last = undefined;
            return l;
        }
        return last;
    }

    window.mina = mina;
    return mina;
}));
// ((typeof window.eve == "undefined" && window.eve_ia == "undefined")
//     ? function () {}
// : window.eve || window.eve_ia);

const mina = __minaGlobal.mina;

if (!mina) {
    throw new Error("mina failed to initialize");
}

export { mina as default, mina };

//# sourceMappingURL=mina.esm.mjs.map