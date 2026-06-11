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
Snap.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {
    const elproto = Element.prototype,
        has = "hasOwnProperty";
    // const supportsTouch = matchMedia('(hover: none)').matches;

    const supportsTouch = 'ontouchstart' in glob.win || (glob.win.navigator && navigator.maxTouchPoints > 0);

    const supportsPointer = false && !!glob.win.PointerEvent;
    Snap.supportsTouch = supportsTouch;
    Snap.poinertSupport = supportsPointer;
    const events = [
            "click", "dblclick", "mousedown", "mousemove", "mouseout", "mouseleave",
            "mouseover", "mouseenter", "mouseup", "touchstart", "touchmove", "touchend",
            "touchcancel"
        ],
        touchMap = {
            mousedown: "touchstart",
            mousemove: "touchmove",
            mouseup: "touchend"
        },
        pointerMap = {
            mousedown: 'pointerdown',
            mousemove: 'pointermove',
            mouseup: 'pointerup',
            mouseout: 'pointerout',
            mouseover: 'pointerover',
            mouseenter: 'pointerenter',
            mouseleave: 'pointerleave',
        },
        /**
         * Retrieves the current scroll offset for the specified axis.
         *
         * @param {"x"|"y"} xy Indicates which axis to measure.
         * @param {Element|Snap|undefined} [el] Optional element used to resolve the owning document.
         * @returns {number} The scroll offset in pixels for the requested axis.
         */
        getScroll = function (xy, el) {
            const name = xy == "y" ? "scrollTop" : "scrollLeft",
                doc = el && el.node ? el.node.ownerDocument : Snap.document();
            return doc[name in doc.documentElement ? "documentElement" : "body"][name];
        },
        preventDefault = function () {
            this.returnValue = false;
        },
        preventTouch = function () {
            console.log("prevent touch");
            return this.originalEvent.preventDefault();
        },
        stopPropagation = function () {
            this.cancelBubble = true;
        },
        stopTouch = function () {
            return this.originalEvent.stopPropagation();
        },
        /**
         * Normalises DOM, touch, and pointer events for Snap elements.
         *
         * @param {HTMLElement|Document} obj A DOM node to attach the native listener to.
         * @param {string} type The canonical mouse event name.
         * @param {Function} fn The handler invoked with normalised coordinates.
         * @param {Element} element The Snap element used as `this` when invoking the handler.
         * @returns {Function} A disposer that removes the underlying native listeners.
         */
        addEvent = function (obj, type, fn, element) {
            let realName = (supportsPointer && pointerMap[type])
                ? pointerMap[type] : (supportsTouch && touchMap[type] ? touchMap[type] : type);
            const snap = Snap(element);
            // console.log("add event", type, realName, snap && snap.id);
            const f = function (e) {
                // console.log(type, e.currentTarget.id);
                const scrollY = getScroll("y", element),
                    scrollX = getScroll("x", element);
                // if (supportsPointer && pointerMap[has](type)){
                //     //todo
                // }
                if (supportsTouch && touchMap[has](type)) {
                    for (let i = 0, ii = e.targetTouches && e.targetTouches.length; i < ii; ++i) {
                        if (e.targetTouches[i].target === obj || obj.contains(e.targetTouches[i].target)) {
                            const olde = e;
                            e = e.targetTouches[i];
                            e.originalEvent = olde;
                            e.preventDefault = preventTouch;
                            e.stopPropagation = stopTouch;
                            break;
                        }
                    }
                }
                const x = e.clientX + scrollX,
                    y = e.clientY + scrollY;
                const resutl = fn.call(element, e, x, y);
                // e.preventDefault();
                return resutl;
            };


            if (type !== realName) {
                const f_touch = function (e) {
                    // console.log(type, realName, e.currentTarget.id);
                    const scrollY = getScroll("y", element),
                        scrollX = getScroll("x", element);
                    for (let i = 0, ii = e.targetTouches && e.targetTouches.length; i < ii; ++i) {
                        if (e.targetTouches[i].target === obj || obj.contains(e.targetTouches[i].target)) {
                            const olde = e;
                            e = e.targetTouches[i];
                            e.originalEvent = olde;
                            e.preventDefault = preventTouch;
                            e.stopPropagation = stopTouch;
                            break;
                        }
                    }
                    const x = e.clientX + scrollX,
                        y = e.clientY + scrollY;
                    const result = fn.call(element, e, x, y);
                    // e.preventDefault();
                    return result;
                }
                // obj.addEventListener(type, f, false);
                obj.addEventListener(type, f_touch, false);
                // console.log("add touch event", type, realName);
            }

            obj.addEventListener(realName, f, false);

            return function () {
                // console.log("remove event", type, realName, snap && snap.id);

                if (type !== realName) {
                    obj.removeEventListener(type, f, false);
                }

                obj.removeEventListener(realName, f, false);

                return true;
            };
        };
    let drag = [];
    /**
     * Handles the active drag gesture by relaying movement coordinates to registered listeners.
     *
     * @param {MouseEvent|TouchEvent} e The original DOM event.
     */
    const dragMove = function (e) {
            let x = e.clientX,
                y = e.clientY;
            const scrollY = getScroll("y"),
                scrollX = getScroll("x");
            let dragi,
                j = drag.length;
            while (j--) {
                dragi = drag[j];
                if (supportsTouch) {
                    let i = e.touches && e.touches.length,
                        touch;
                    while (i--) {
                        touch = e.touches[i];
                        if (touch.identifier == dragi.el._drag.id || dragi.el.node.contains(touch.target)) {
                            x = touch.clientX;
                            y = touch.clientY;
                            (e.originalEvent ? e.originalEvent : e).preventDefault();
                            break;
                        }
                    }
                } else {
                    e.preventDefault();
                }
                const node = dragi.el.node;
                // let o;
                // const next = node.nextSibling,
                //     parent = node.parentNode,
                //     display = node.style.display;
                // glob.win.opera && parent.removeChild(node);
                // node.style.display = "none";
                // o = dragi.el.paper.getElementByPoint(x, y);
                // node.style.display = display;
                // glob.win.opera && (next ? parent.insertBefore(node, next) : parent.appendChild(node));
                // o && eve(["snap","drag","over",dragi.el.id], dragi.el, o);
                x += scrollX;
                y += scrollY;
                eve(["snap", "drag", "move", dragi.el.id], dragi.move_scope || dragi.el, x - dragi.el._drag.x, y - dragi.el._drag.y, x, y, e);
                // console.log("drag move", dragi.el.id, x, y);
            }
        },
        /**
         * Concludes all active drag gestures and removes the shared move/up listeners.
         *
         * @param {MouseEvent|TouchEvent} e The original DOM event that ended the drag.
         */
        dragUp = function (e) {
            Snap.unmousemove(dragMove).unmouseup(dragUp);
            let i = drag.length,
                dragi;
            while (i--) {
                dragi = drag[i];
                dragi.el._drag = {};
                eve(["snap", "drag", "end", dragi.el.id], dragi.end_scope || dragi.start_scope || dragi.move_scope || dragi.el, e);
                eve.off("snap.drag.*." + dragi.el.id);
            }
            drag = [];
        };
    /**
     * Generates pointer helper methods such as `element.click`, `element.mousemove`, and their
     * corresponding `un*` counterparts. These helpers normalise mouse, touch, and pointer events,
     * optionally invoke handlers with a custom scope, and expose the event coordinates adjusted for
     * document scroll.
     *
     * Each generated method supports two calling conventions:
     * - `element.eventName(handler, [scope], [data])` to bind a listener.
     * - `element.eventName()` to trigger previously bound listeners for the same event type.
     *
     * @param {Function} fn The event handler. When omitted the previously registered handlers are invoked.
     * @param {Object} [scope] Optional `this` context passed to the handler.
     * @param {*} [data] Arbitrary data stored alongside the handler metadata.
     * @returns {Element} The current element, allowing chaining.
     *
     * @example
     * element.click(function (event, x, y) {
     *     console.log("Clicked at", x, y);
     * });
     *
     * @example
     * element.unclick(handler);
     */
    for (var i = events.length; i--;) {
        (function (eventName) {
            Snap[eventName] = elproto[eventName] = function (fn, scope, data) {
                if (Snap.is(fn, "function")) {
                    this.events = this.events || [];
                    const remove_event_fun = addEvent(this.node || Snap.document(), eventName, fn, scope || this);
                    this.events.push({
                        name: eventName,
                        f: fn,
                        unbind: remove_event_fun,
                        scope: scope,
                        data: data
                    });
                } else {
                    let i = 0;
                    const ii = this.events.length;
                    for (; i < ii; ++i) if (this.events[i].name == eventName) {
                        try {
                            this.events[i].f.call(this);
                        } catch (e) {
                            eve("global.error", undefined, e, this.events[i].f);
                        }
                    }
                }
                return this;
            };
            Snap["un" + eventName] =
                elproto["un" + eventName] = function (fn) {
                    const events = this.events || [];
                    let l = events.length;
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
    /**
     * Adds hover-in and hover-out handlers to the element using `mouseover` and `mouseout` events.
     *
     * @param {Function} f_in Handler executed when the pointer enters the element.
     * @param {Function} f_out Handler executed when the pointer leaves the element.
     * @param {Object} [scope_in] Optional context bound to the hover-in handler.
     * @param {Object} [scope_out] Optional context bound to the hover-out handler.
     * @returns {Element} The current element for chaining.
     */
    elproto.hover = function (f_in, f_out, scope_in, scope_out) {
        return this.mouseover(f_in, scope_in).mouseout(f_out, scope_out || scope_in);
    };
    /**
     * Removes previously registered hover handlers from the element.
     *
     * @param {Function} f_in The hover-in handler to unregister.
     * @param {Function} f_out The hover-out handler to unregister.
     * @returns {Element} The current element for chaining.
     */
    elproto.unhover = function (f_in, f_out) {
        return this.unmouseover(f_in).unmouseout(f_out);
    };
    const draggable = [];
    // SIERRA unclear what _context_ refers to for starting, ending, moving the drag gesture.
    // SIERRA Element.drag(): _x position of the mouse_: Where are the x/y values offset from?
    // SIERRA Element.drag(): much of this member's doc appears to be duplicated for some reason.
    // SIERRA Unclear about this sentence: _Additionally following drag events will be triggered: drag.start.<id> on start, drag.end.<id> on end and drag.move.<id> on every move._ Is there a global _drag_ object to which you can assign handlers keyed by an element's ID?
    /**
     * Adds drag gesture handlers to the element.
     *
     * Additional `drag` events are triggered for convenience:
     * - `drag.start.<id>` when the gesture begins.
     * - `drag.move.<id>` while the pointer moves.
     * - `drag.end.<id>` when the gesture finishes.
     * - `drag.over.<id>` when the element is dragged over another element.
     *
     * Handler invocation details:
     * - The start handler receives `(x, y, event)` where `x` and `y` are the pointer coordinates.
     * - The move handler receives `(dx, dy, x, y, event)` where `dx`/`dy` are deltas from the start point.
     * - The end handler receives `(event)`.
     *
     * @param {Function} [onmove] Handler for pointer movement.
     * @param {Function} [onstart] Handler fired when the drag starts.
     * @param {Function} [onend] Handler fired when the drag ends.
     * @param {Object} [move_scope] Optional context for the move handler.
     * @param {Object} [start_scope] Optional context for the start handler.
     * @param {Object} [end_scope] Optional context for the end handler.
    * @param {AltClickEventSpecification} [alt_click_event] Optional alternate click trigger when the drag is extremely short. Accepts a timeout in milliseconds or `[event, timeout]` where `event` can be an event name or callback.
     * @returns {Element} The current element to support chaining.
     */
    elproto.drag = function (onmove, onstart, onend, move_scope, start_scope, end_scope, alt_click_event) {
        const el = this;
        if (!arguments.length) {
            let origTransform;
            return el.drag(function (dx, dy) {
                this.attr({
                    transform: origTransform + (origTransform ? "T" : "t") + [dx, dy]
                });
            }, function () {
                origTransform = this.transform().local;
            });
        }

        let time;

        function start(e, x, y) {
            // (e.originalEvent || e).preventDefault();
            if (alt_click_event) time = Date.now();
            el._drag.x = x;
            el._drag.y = y;
            el._drag.id = e.identifier;
            !drag.length && Snap.mousemove(dragMove)
                .mouseup(dragUp);
            drag.push({el: el, move_scope: move_scope, start_scope: start_scope, end_scope: end_scope});
            onstart && eve.on("snap.drag.start." + el.id, onstart);
            onmove && eve.on("snap.drag.move." + el.id, onmove);
            if (alt_click_event) {
                eve.on("snap.drag.end." + el.id, () => {
                    let cl_t = (typeof alt_click_event === "number") ? alt_click_event : 500;
                    if (Array.isArray(alt_click_event)
                        && typeof alt_click_event[1] === "number"
                        && (typeof alt_click_event[0] === "string"
                            || typeof alt_click_event[0] === "function")) {
                        [alt_click_event, cl_t] = alt_click_event;
                    }
                    if (Date.now() - time < cl_t) {
                        if (typeof alt_click_event === "string") {
                            eve(alt_click_event)
                        }
                        if (typeof alt_click_event === "function") {
                            alt_click_event()
                        } else {
                           const MouseEventCtor = glob.win && glob.win.MouseEvent
                               ? glob.win.MouseEvent
                               : (typeof MouseEvent !== "undefined" ? MouseEvent : null);
                           if (MouseEventCtor) {
                               el.node.dispatchEvent(new MouseEventCtor("click", {bubbles: true, cancelable: true}));
                           }
                        }
                        eve("snap.drag.click." + el.id)
                    }
                })
            }
            onend && eve.on("snap.drag.end." + el.id, onend);
            eve(["snap", "drag", "start", el.id], start_scope || move_scope || el, x, y, e);
        }

        function init(e, x, y) {
            // Prevent execution if more than one button or finger is pressed
            if ((e.touches && e.touches.length > 1) || (e.buttons && e.buttons > 1)) {
                return;
            }
            eve(["drag", "init", el.id], el, e, x, y);
        }

        eve.on(["drag", "init", el.id], start);
        el._drag = {};
        draggable.push({el: el, start: start, init: init});
        el.mousedown(init, undefined, {
            type: "drag",
            params: [onmove, onstart, onend, move_scope, start_scope, end_scope]
        });
        return el;
    };
    /*
     * Element.onDragOver @method
 *
     * Shortcut to assign event handler for `drag.over.<id>` event, where `id` is the element's `id` (see @Element.id)
 * @param {function} f - handler for event, first argument would be the element you are dragging over
    */
    // elproto.onDragOver = function (f) {
    //     f ? eve.on("snap.drag.over." + this.id, f) : eve.unbind("snap.drag.over." + this.id);
    // };
    /**
     * Removes all drag-related handlers from the element and detaches shared listeners when applicable.
     *
     * @returns {Element} The current element for chaining.
     */
    elproto.undrag = function () {
        let i = draggable.length;
        while (i--) if (draggable[i].el == this) {
            this.unmousedown(draggable[i].init);
            draggable.splice(i, 1);
            eve.unbind("drag.*." + this.id);
            eve.unbind("drag.init." + this.id);
        }
        !draggable.length && Snap.unmousemove(dragMove).unmouseup(dragUp);
        return this;
    };

    /**
     * Removes every registered mouse, touch, and drag listener from the element.
     *
     * @returns {Element} The current element for chaining.
     */
    elproto.removeAllMouseListeners = function () {
        const events = this.events || [];
        let l = events.length;
        while (l--) {
            const event = events[l];
            this["un" + event.name] && this["un" + event.name](event.f)
        }

        this.undrag();
        this.unhover();
        return this;
    };

    /**
     * Copies registered event listeners from another element, optionally preserving the original scopes.
     *
     * @param {Element} el Source element whose listeners should be duplicated.
     * @param {boolean} [preserveScopes=false] When `true`, retains the original listener scopes.
     * @param {boolean} [skip_drag=false] When `true`, drag handlers are ignored.
     * @returns {Element} The current element for chaining.
     */
    elproto.copyListeners = function (el, preserveScopes, skip_drag) {
        if (!el.events) return this;

        el.events.forEach((ev) => {
            if (ev.data && ev.data.type === "drag") {
                if (!skip_drag) this.drag.apply(this, ev.data.params)
            } else {
                this[ev.name](ev.f, (preserveScopes) ? ev.scope : undefined);
            }
        });

        return this;
    };
});
