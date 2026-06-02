(function (root) {
    "use strict";
    let Snap_ia = (typeof window !== "undefined") ? window.Snap || window.Snap_ia : root.Snap;
   Snap.plugin(function (Snap, Element, Paper, global, Fragment, eve, mina) {

        //GUI-DEPENDENT INTERACTION FUNCTIONS
        //These extensions require IADesigner library


        /**
         * Registers higher-level interaction events on the element.
         * Supports click, press, hold, and longpress event types with flexible handler definitions.
         * The handler can be a direct function, a GUI operation descriptor, or an Eve event string.
         *
         * @function Snap.Element#addInteractionEvent
         * @param {("click"|"press"|"hold"|"longpress")} type Event type to attach.
         * @param {Function|Object|string|Function[]|Object[]|string[]} action_description Handler definition or array of handlers.
         * @param {Object} [other_params] Additional properties merged into the action descriptor.
         * @param {boolean} [replace=false] When true, replaces existing handlers instead of adding to them.
         * @param {Function} [local_eve] Local eve dispatcher.
         * @returns {Snap.Element} The element for chaining.
         * @example
         *  Simple function handler
         * rect.addInteractionEvent('click', () => console.log('clicked'));
         *
         *  Operation string handler
         * button.addInteractionEvent('click', 'saveDocument');
         *
         *  Multiple handlers
         * icon.addInteractionEvent('press', [handler1, handler2]);
         */
        Element.prototype.addInteractionEvent = function (
            type, action_description, other_params, replace, local_eve) {

            if (typeof other_params === "function" && other_params.isEve) {
                local_eve = other_params;
                other_params = undefined;
            } else if (typeof other_params === "object" && other_params.eve && other_params.eve.isEve) {
                local_eve = other_params.eve;
                other_params = undefined;
            }

            if (typeof replace === "function" && replace.isEve) {
                local_eve = replace;
                replace = undefined;
            } else if (typeof replace === "object" && replace.eve && replace.eve.isEve) {
                local_eve = replace.eve;
                replace = undefined;
            }

            if (Array.isArray(action_description)) {
                for (let i = 0; i < action_description.length; ++i) {
                    this.addInteractionEvent(type, action_description[i], local_eve);
                }
                return;
            }

            // let index = undefined;
            if (typeof action_description === "function") {
                const other_stored_functions = this.data("stored-function") || [];
                other_stored_functions.push(action_description);
                this.data("stored-function", other_stored_functions);
                action_description = {
                    "stored-function": other_stored_functions.length - 1,
                };
            }

            if (typeof action_description === "string") {
                action_description = {"operation": action_description}
            }

            if (action_description && action_description["message"]) {
                local_eve = local_eve || eve;
                this.addMessage(action_description["message"], local_eve, action_description["in_event"], action_description["out_event"]);

                delete action_description["message"];
            }

            if (other_params) {
                for (let key in other_params) if (other_params.hasOwnProperty(
                    key)) {
                    action_description[key] = other_params[key];
                }
            }

            const event = type + "-event";
            if (this.data(event)) {
                if (replace) {
                    if (action_description) {
                        this.data(event, [action_description]);
                    } else {
                        this.removeData(event);
                    }
                } else {
                    let actions = this.data(event);
                    actions.push(action_description);
                    this.data(event, actions);
                }
            } else {
                this.data(event, [action_description]);
            }

        };

        /**
         * Adds a click event handler to the element and sets the cursor to pointer.
         *
         * @function Snap.Element#addClickEvent
         * @param {Function|Object|string|Array} action_description Handler function, configuration object, operation string, or array of handlers.
         * @param {Object} [other_params] Additional parameters to merge into the action description.
         * @param {boolean} [replace=false] Whether to replace existing handlers or add to them.
         * @param {Object} [local_eve] localized eve event manager.
         * @returns {Snap.Element} The element itself for chaining.
         */
        Element.prototype.addClickEvent = function (
            action_description, other_params, replace, local_eve) {
            this.setCursor("pointer");
            return this.addInteractionEvent("click", action_description,
                other_params, replace, local_eve);
        };

        /**
         * Adds a press event handler (mousedown/touchdown) to the element.
         *
         * @function Snap.Element#addPressEvent
         * @param {Function|Object|string|Array} action_description Handler function, configuration object, operation string, or array of handlers.
         * @param {Object} [other_params] Additional parameters to merge into the action description.
         * @param {boolean} [replace=false] Whether to replace existing handlers or add to them.
         * @param {Object} [local_eve] localized eve event manager.
         * @returns {Snap.Element} The element itself for chaining.
         */
        Element.prototype.addPressEvent = function (
            action_description, other_params, replace, local_eve) {
            return this.addInteractionEvent("press", action_description,
                other_params, replace, local_eve);
        };

        /**
         * Adds a hold event handler that fires continuously while pressed.
         *
         * @function Snap.Element#addHoldEvent
         * @param {Function|Object|string|Array} action_description Handler function, configuration object, operation string, or array of handlers.
         * @param {Object} [other_params] Additional parameters to merge into the action description.
         * @param {boolean} [replace=false] Whether to replace existing handlers or add to them.
         * @param {Object} [local_eve] localized eve event manager.
         * @returns {Snap.Element} The element itself for chaining.
         */
        Element.prototype.addHoldEvent = function (
            action_description, other_params, replace, local_eve) {
            return this.addInteractionEvent("hold", action_description,
                other_params, replace, local_eve);
        };

        /**
         * Adds a long press event handler to the element.
         *
         * @function Snap.Element#addLongpressEvent
         * @param {Function|Object|string|Array} action_description Handler function, configuration object, operation string, or array of handlers.
         * @param {Object} [other_params] Additional parameters to merge into the action description.
         * @param {boolean} [replace=false] Whether to replace existing handlers or add to them.
         * @param {Object} [local_eve] localized eve event manager.
         * @returns {Snap.Element} The element itself for chaining.
         */
        Element.prototype.addLongpressEvent = function (
            action_description, other_params, replace, local_eve) {
            return this.addInteractionEvent("longpress", action_description,
                other_params, replace, local_eve);
        };



    });
}(window || this))