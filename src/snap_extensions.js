(function (root) {
    let Snap_ia = root.Snap_ia || root.Snap;

    //Global Snap Plugin
    Snap.plugin(function (Snap, Element, Paper, global, Fragment, eve) {

        const STRICT_MODE = true;
        //Snap Constants
        /**
         * If placed as the first argument for an element constructor function called on a element, the new element is
         * placed after current. This overrides the behaviour where the new element will be added inside of grouplike elements.
         * @type {string}
         */
        Snap.FORCE_AFTER = '__force_after';

        /**
         * Returns a bitmap position indicator of two elements. As follows:
         * Bits    Number    Meaning
         * 000000    0    Elements are identical.
         * 000001    1    The nodes are in different documents (or one is outside of a document).
         * 000010    2    Node B precedes Node A.
         * 000100    4    Node A precedes Node B.
         * 001000    8    Node B contains Node A.
         * 010000    16    Node A contains Node B.
         * Based on code from: Compare Position - MIT Licensed, John Resig.
         * @param {Snap.Element|Node} a The first element.
         * @param {Snap.Element|Node} b The second element (or this element).
         * @returns {number} Bitmask describing the positional relationship.
         */
        Snap._compareDomPosition = function (a, b) {
            a = a.node || a;
            b = b.node || b;

            return a.compareDocumentPosition ?
                a.compareDocumentPosition(b) :
                a.contains ?
                    (a != b && a.contains(b) && 16) +
                    (a != b && b.contains(a) && 8) +
                    (a.sourceIndex >= 0 && b.sourceIndex >= 0 ?
                        (a.sourceIndex < b.sourceIndex && 4) +
                        (a.sourceIndex > b.sourceIndex && 2) :
                        1)
                    + 0 : 0;
        };

        /**
         * Compares the observable position of two elements (above or below). Note that the observable position is opposite to the DOM order.
         * Care should be used when comparing an element to any parent group, because any element will be counted as
         * below the group.
         * @param {Snap.Element} a The first element.
         * @param {Snap.Element} b The second element.
         * @returns {number} -1 if {@link a} is below {@link b}, 1 if above, and 0 if equal.
         */
        Snap.positionComparator = function (a, b) {
            const comp = Snap._compareDomPosition(a, b);
            // console.log("A: " + a.getId(), "B: " + b.getId(), comp, "B<A " + (comp & 2), "A<B " + (comp & 4), "BcA " + (comp & 8), "AcB " + (comp & 16));
            if (comp & 8) {
                return -1;
            }
            if (comp & 16) {
                return 1;
            }
            return (comp & 4) ? -1 :
                (comp & 2) ? 1 : 0;
        };

        /**
         * Inverse comparator helper that swaps the operands of {@link Snap.positionComparator}.
         * @param {Snap.Element} a The first element.
         * @param {Snap.Element} b The second element.
         * @returns {number} Comparator result for {@link b} against {@link a}.
         */
        Snap.positionComparator.inverse = function (a, b) {
            return Snap.positionComparator(b, a);
        };

        /**
         * Converts polar coordinates to their Cartesian representation.
         * @param {number} r Radius of the vector.
         * @param {number} phi Angle in radians.
         * @returns {{x:number,y:number}} Cartesian point derived from the polar input.
         */
        Snap.fromPolar = function (r, phi) {
            return {x: r * Math.cos(phi), y: r * Math.sin(phi)};
        };

        /**
         * Converts Cartesian coordinates to polar form.
         * @param {number} x X component of the vector.
         * @param {number} y Y component of the vector.
         * @returns {{phi:number,r:number}} Polar representation where {@link phi} is in radians.
         */
        Snap.toPolar = function (x, y) {
            return {
                phi: (Math.atan2(y, x) + 2 * Math.PI) % 2 * Math.PI,
                r: Snap.len(x, y, 0, 0),
            };
        };

        /**
         * Converts polar coordinates expressed in degrees to a Cartesian vector.
         * @param {number} r Radius of the vector.
         * @param {number} phi Angle in degrees.
         * @returns {{x:number,y:number}} Cartesian coordinates corresponding to the polar input.
         */
        Snap.fromPolar_deg = function (r, phi) {
            let rad = Snap.rad(phi);
            return {x: r * Math.cos(rad), y: r * Math.sin(rad)};
        };

        /**
         * Converts Cartesian coordinates to polar form expressed in degrees.
         * @param {number} x X component of the vector.
         * @param {number} y Y component of the vector.
         * @returns {{phi:number,r:number}} Polar representation where {@link phi} is in degrees.
         */
        Snap.toPolar_deg = function (x, y) {
            return {
                phi: Snap.deg(((Math.atan2(y, x) + 2 * Math.PI) % 2 * Math.PI)),
                r: Snap.len(x, y, 0, 0),
            };
        };

        /**
         * Converts spherical coordinates (3D) to Cartesian representation.
         * Uses physics convention: r (radius), theta (polar/zenith angle from z-axis), phi (azimuthal angle in xy-plane from x-axis).
         * @param {number} r Radius of the vector.
         * @param {number} theta Polar angle from z-axis in radians (0 to π).
         * @param {number} phi Azimuthal angle in xy-plane in radians (0 to 2π).
         * @returns {{x:number,y:number,z:number}} Cartesian coordinates.
         */
        Snap.fromSpherical = function (r, theta, phi) {
            const sinTheta = Math.sin(theta);
            return {
                x: r * sinTheta * Math.cos(phi),
                y: r * sinTheta * Math.sin(phi),
                z: r * Math.cos(theta)
            };
        };

        /**
         * Converts Cartesian coordinates to spherical form.
         * Uses physics convention: r (radius), theta (polar/zenith angle from z-axis), phi (azimuthal angle in xy-plane from x-axis).
         * @param {number} x X component of the vector.
         * @param {number} y Y component of the vector.
         * @param {number} z Z component of the vector.
         * @returns {{r:number,theta:number,phi:number}} Spherical representation where angles are in radians.
         */
        Snap.toSpherical = function (x, y, z) {
            const r = Math.sqrt(x * x + y * y + z * z);
            return {
                r: r,
                theta: r === 0 ? 0 : Math.acos(z / r),  // Polar angle from z-axis
                phi: Math.atan2(y, x)  // Azimuthal angle in xy-plane
            };
        };

        /**
         * Converts spherical coordinates expressed in degrees to Cartesian representation.
         * @param {number} r Radius of the vector.
         * @param {number} theta Polar angle from z-axis in degrees (0 to 180).
         * @param {number} phi Azimuthal angle in xy-plane in degrees (0 to 360).
         * @returns {{x:number,y:number,z:number}} Cartesian coordinates.
         */
        Snap.fromSpherical_deg = function (r, theta, phi) {
            const thetaRad = Snap.rad(theta);
            const phiRad = Snap.rad(phi);
            return Snap.fromSpherical(r, thetaRad, phiRad);
        };

        /**
         * Converts Cartesian coordinates to spherical form expressed in degrees.
         * @param {number} x X component of the vector.
         * @param {number} y Y component of the vector.
         * @param {number} z Z component of the vector.
         * @returns {{r:number,theta:number,phi:number}} Spherical representation where angles are in degrees.
         */
        Snap.toSpherical_deg = function (x, y, z) {
            const spherical = Snap.toSpherical(x, y, z);
            return {
                r: spherical.r,
                theta: Snap.deg(spherical.theta),
                phi: Snap.deg(spherical.phi)
            };
        };

        /**
         * Helper function to normalize vector input to components.
         * Handles 2D and 3D vectors in object, array, or component form.
         * @private
         * @param {number|{x:number,y:number,z:(number|undefined)}|number[]} v1 Vector or first component.
         * @param {number} [v2] Second component.
         * @param {number} [v3] Third component (for 3D).
         * @returns {{x:number,y:number,z:number}} Normalized components with z=0 for 2D.
         */
        Snap._normalizeVectorInput = function (v1, v2, v3) {
            let x, y, z = 0;

            if (typeof v1 === 'object') {
                x = v1.x ?? v1[0] ?? 0;
                y = v1.y ?? v1[1] ?? 0;
                z = v1.z ?? v1[2] ?? 0;
            } else {
                x = v1 ?? 0;
                y = v2 ?? 0;
                z = v3 ?? 0;
            }

            return {x, y, z};
        };

        /**
         * Normalizes the supplied vector (2D or 3D).
         * @param {number|{x:number,y:number,z:(number|undefined)}|number[]} x Either the X component or a vector object.
         * @param {number} [y] Optional Y component when {@link x} is numeric.
         * @param {number} [z] Optional Z component for 3D vectors.
         * @returns {{x:number,y:number,z:(number|undefined)}} Unit vector pointing in the same direction; zero vector if magnitude is zero.
         */
        Snap.normalize = function (x, y, z) {
            const v = Snap._normalizeVectorInput(x, y, z);
            const is3D = v.z !== 0 || (typeof z !== 'undefined' && z !== null);

            // Fast path for 2D using native Snap.len
            if (!is3D) {
                const l = Snap.len(v.x, v.y, 0, 0);
                if (l === 0) return Snap.zero();
                return {x: v.x / l, y: v.y / l};
            }

            // 3D magnitude calculation
            const l = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
            if (l === 0) return Snap.zero(true);

            return {x: v.x / l, y: v.y / l, z: v.z / l};
        };

        /**
         * Returns an orthogonal vector for a given input vector.
         * For 2D: rotates 90 degrees.
         * For 3D: computes cross product with reference vector (default: z-axis if possible, else x-axis).
         * @param {number|{x:number,y:number,z:(number|undefined)}|number[]} x Either the X component or a vector object.
         * @param {number} [y] Optional Y component when {@link x} is numeric.
         * @param {number|boolean} [z_or_lefthand] For 2D: lefthand boolean. For 3D: Z component.
         * @param {boolean} [lefthand] For 3D: whether to use left-hand rule.
         * @param {{x:number,y:number,z:number}} [refVector] Reference vector for 3D (default: smart selection).
         * @returns {{x:number,y:number,z:(number|undefined)}} Orthogonal vector.
         */
        Snap.orthogonal = function (x, y, z_or_lefthand, lefthand, refVector) {
            const v = Snap._normalizeVectorInput(x, y, typeof z_or_lefthand === 'number' ? z_or_lefthand : undefined);
            const is3D = v.z !== 0 || (typeof z_or_lefthand === 'number');

            if (!is3D) {
                // 2D orthogonal (rotate 90 degrees)
                const lh = typeof z_or_lefthand === 'boolean' ? z_or_lefthand : false;
                return lh ? {x: v.y, y: -v.x} : {x: -v.y, y: v.x};
            }

            // 3D orthogonal using cross product
            // Choose reference vector smartly to avoid parallel vectors
            let ref = refVector;
            if (!ref) {
                const absX = Math.abs(v.x);
                const absY = Math.abs(v.y);
                const absZ = Math.abs(v.z);

                // Use axis that's least aligned with input vector
                if (absZ < absX && absZ < absY) {
                    ref = {x: 0, y: 0, z: 1};
                } else if (absX < absY) {
                    ref = {x: 1, y: 0, z: 0};
                } else {
                    ref = {x: 0, y: 1, z: 0};
                }
            }

            const result = Snap.cross(lefthand ? ref : v, lefthand ? v : ref);
            return result;
        };

        /**
         * Multiplies a vector by a scalar (2D or 3D).
         * @param {number} c Scalar value to multiply.
         * @param {number|{x:number,y:number,z:(number|undefined)}|number[]} x X component or vector object/array.
         * @param {number} [y] Optional Y component if x is a number.
         * @param {number} [z] Optional Z component for 3D vectors.
         * @returns {{x:number,y:number,z:(number|undefined)}} Scaled vector.
         */
        Snap.v_c_mult = function (c, x, y, z) {
            const v = Snap._normalizeVectorInput(x, y, z);
            const is3D = v.z !== 0 || (typeof z !== 'undefined' && z !== null);

            return is3D
                ? {x: c * v.x, y: c * v.y, z: c * v.z}
                : {x: c * v.x, y: c * v.y};
        }

        /**
         * Adds two vectors together (2D or 3D).
         * @param {number|{x:number,y:number,z:(number|undefined)}|number[]} x1 X component or first vector.
         * @param {number|{x:number,y:number,z:(number|undefined)}|number[]} y1 Y component or second vector when {@link x1} is an object.
         * @param {number} [x2] Optional X component of the second vector.
         * @param {number} [y2] Optional Y component of the second vector.
         * @param {number} [z1] Optional Z component of the first vector.
         * @param {number} [z2] Optional Z component of the second vector.
         * @returns {{x:number,y:number,z:(number|undefined)}} Vector sum of the inputs.
         */
        Snap.v_add = function (x1, y1, x2, y2, z1, z2) {
            let v1, v2;

            if (typeof y1 === 'object') {
                // v_add(vec1, vec2)
                v1 = Snap._normalizeVectorInput(x1);
                v2 = Snap._normalizeVectorInput(y1);
            } else if (typeof x1 === 'object') {
                // v_add(vec1, x2, y2, z2)
                v1 = Snap._normalizeVectorInput(x1);
                v2 = Snap._normalizeVectorInput(y1, x2, y2);
            } else {
                // v_add(x1, y1, x2, y2) or v_add(x1, y1, z1, x2, y2, z2)
                v1 = Snap._normalizeVectorInput(x1, y1, z1);
                v2 = Snap._normalizeVectorInput(x2, y2, z2);
            }

            const is3D = v1.z !== 0 || v2.z !== 0;
            return is3D
                ? {x: v1.x + v2.x, y: v1.y + v2.y, z: v1.z + v2.z}
                : {x: v1.x + v2.x, y: v1.y + v2.y};
        }

        /**
         * Subtracts one vector from another (2D or 3D).
         * @param {number|{x:number,y:number,z:(number|undefined)}|number[]} x1 X component or minuend vector.
         * @param {number|{x:number,y:number,z:(number|undefined)}|number[]} y1 Y component or subtrahend vector when {@link x1} is an object.
         * @param {number} [x2] Optional X component of the subtrahend.
         * @param {number} [y2] Optional Y component of the subtrahend.
         * @param {number} [z1] Optional Z component of the first vector.
         * @param {number} [z2] Optional Z component of the second vector.
         * @returns {{x:number,y:number,z:(number|undefined)}} Difference of the vectors (v1 - v2).
         */
        Snap.v_subtract = function (x1, y1, x2, y2, z1, z2) {
            let v1, v2;

            if (typeof y1 === 'object') {
                // v_subtract(vec1, vec2)
                v1 = Snap._normalizeVectorInput(x1);
                v2 = Snap._normalizeVectorInput(y1);
            } else if (typeof x1 === 'object') {
                // v_subtract(vec1, x2, y2, z2)
                v1 = Snap._normalizeVectorInput(x1);
                v2 = Snap._normalizeVectorInput(y1, x2, y2);
            } else {
                // v_subtract(x1, y1, x2, y2) or v_subtract(x1, y1, z1, x2, y2, z2)
                v1 = Snap._normalizeVectorInput(x1, y1, z1);
                v2 = Snap._normalizeVectorInput(x2, y2, z2);
            }

            const is3D = v1.z !== 0 || v2.z !== 0;
            return is3D
                ? {x: v1.x - v2.x, y: v1.y - v2.y, z: v1.z - v2.z}
                : {x: v1.x - v2.x, y: v1.y - v2.y};
        }

        /**
         * Calculates the midpoint between two vectors (2D or 3D).
         * @param {number|{x:number,y:number,z:(number|undefined)}|number[]} x1 X component or first vector.
         * @param {number|{x:number,y:number,z:(number|undefined)}|number[]} y1 Y component or second vector when {@link x1} is an object.
         * @param {number} [x2] Optional X component of the second vector.
         * @param {number} [y2] Optional Y component of the second vector.
         * @param {number} [z1] Optional Z component of the first vector.
         * @param {number} [z2] Optional Z component of the second vector.
         * @returns {{x:number,y:number,z:(number|undefined)}} Midpoint vector.
         */
        Snap.v_mid = function (x1, y1, x2, y2, z1, z2) {
            let v1, v2;

            if (typeof y1 === 'object') {
                // v_mid(vec1, vec2)
                v1 = Snap._normalizeVectorInput(x1);
                v2 = Snap._normalizeVectorInput(y1);
            } else if (typeof x1 === 'object') {
                // v_mid(vec1, x2, y2, z2)
                v1 = Snap._normalizeVectorInput(x1);
                v2 = Snap._normalizeVectorInput(y1, x2, y2);
            } else {
                // v_mid(x1, y1, x2, y2) or v_mid(x1, y1, z1, x2, y2, z2)
                v1 = Snap._normalizeVectorInput(x1, y1, z1);
                v2 = Snap._normalizeVectorInput(x2, y2, z2);
            }

            const is3D = v1.z !== 0 || v2.z !== 0;
            return is3D
                ? {x: (v1.x + v2.x) / 2, y: (v1.y + v2.y) / 2, z: (v1.z + v2.z) / 2}
                : {x: (v1.x + v2.x) / 2, y: (v1.y + v2.y) / 2};
        }

        /**
         * Linear interpolation between two vectors (2D or 3D).
         * Highly optimized for animation frames.
         * @param {number|{x:number,y:number,z:(number|undefined)}|number[]} x1 X component or first vector.
         * @param {number|{x:number,y:number,z:(number|undefined)}|number[]} y1 Y component or second vector when {@link x1} is an object, or t value.
         * @param {number|{x:number,y:number,z:(number|undefined)}|number[]} [x2_or_t] X component of second vector or interpolation value t.
         * @param {number} [y2] Optional Y component of the second vector.
         * @param {number} [z1_or_t] Optional Z component of first vector or t value.
         * @param {number} [z2] Optional Z component of the second vector.
         * @param {number} [t] Interpolation value (0 to 1, where 0 returns v1 and 1 returns v2).
         * @returns {{x:number,y:number,z:(number|undefined)}} Interpolated vector.
         */
        Snap.v_lerp = function (x1, y1, x2_or_t, y2, z1_or_t, z2, t) {
            let v1, v2, t_val;

            if (typeof y1 === 'object') {
                // v_lerp(vec1, vec2, t)
                v1 = Snap._normalizeVectorInput(x1);
                v2 = Snap._normalizeVectorInput(y1);
                t_val = x2_or_t;
            } else if (typeof x1 === 'object' && typeof x2_or_t === 'object') {
                // v_lerp(vec1, vec2, t)
                v1 = Snap._normalizeVectorInput(x1);
                v2 = Snap._normalizeVectorInput(x2_or_t);
                t_val = y1;
            } else if (typeof x1 === 'object') {
                // v_lerp(vec1, x2, y2, z2, t)
                v1 = Snap._normalizeVectorInput(x1);
                v2 = Snap._normalizeVectorInput(y1, x2_or_t, y2);
                t_val = z1_or_t;
            } else {
                // v_lerp(x1, y1, z1, x2, y2, z2, t) or v_lerp(x1, y1, x2, y2, t)
                if (typeof t !== 'undefined') {
                    v1 = Snap._normalizeVectorInput(x1, y1, x2_or_t);
                    v2 = Snap._normalizeVectorInput(y2, z1_or_t, z2);
                    t_val = t;
                } else {
                    v1 = Snap._normalizeVectorInput(x1, y1, 0);
                    v2 = Snap._normalizeVectorInput(x2_or_t, y2, 0);
                    t_val = z1_or_t;
                }
            }

            // Clamp t to [0, 1] for safety
            t_val = Math.max(0, Math.min(1, t_val));

            const is3D = v1.z !== 0 || v2.z !== 0;

            // Optimized calculation: v1 + t * (v2 - v1) = v1 * (1 - t) + v2 * t
            const oneMinusT = 1 - t_val;

            return is3D
                ? {
                    x: v1.x * oneMinusT + v2.x * t_val,
                    y: v1.y * oneMinusT + v2.y * t_val,
                    z: v1.z * oneMinusT + v2.z * t_val
                }
                : {
                    x: v1.x * oneMinusT + v2.x * t_val,
                    y: v1.y * oneMinusT + v2.y * t_val
                };
        }

        /**
         * Computes the dot product between two vectors (2D or 3D).
         * @param {number|{x:number,y:number,z:(number|undefined)}|number[]} x1 X component or first vector.
         * @param {number|{x:number,y:number,z:(number|undefined)}|number[]} y1 Y component or second vector when {@link x1} is an object.
         * @param {number} [x2] Optional X component of the second vector.
         * @param {number} [y2] Optional Y component of the second vector.
         * @param {number} [z1] Optional Z component of the first vector.
         * @param {number} [z2] Optional Z component of the second vector.
         * @returns {number} Dot product result.
         */
        Snap.dot = function (x1, y1, x2, y2, z1, z2) {
            let v1, v2;

            if (typeof y1 === 'object') {
                // dot(vec1, vec2)
                v1 = Snap._normalizeVectorInput(x1);
                v2 = Snap._normalizeVectorInput(y1);
            } else if (typeof x1 === 'object') {
                // dot(vec1, x2, y2, z2)
                v1 = Snap._normalizeVectorInput(x1);
                v2 = Snap._normalizeVectorInput(y1, x2, y2);
            } else {
                // dot(x1, y1, x2, y2) or dot(x1, y1, z1, x2, y2, z2)
                v1 = Snap._normalizeVectorInput(x1, y1, z1);
                v2 = Snap._normalizeVectorInput(x2, y2, z2);
            }

            return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
        }


        /**
         * Round a number to a given number of decimal places.
         * @param {number} num
         * @param {number} [pos] Number of decimal places (defaults to 0).
         * @returns {number}
         */
        Snap.round = function (num, pos) {
            if (!pos) return Math.round(num);
            const pow = Math.pow(10, pos);
            return Math.round(num * pow) / (pow);
        };

        /**
         * Remove non-printable characters (keeps ASCII 32–126 and 128–255).
         * @param {string} str
         * @returns {string}
         */
        Snap.removeNonPrintable = function (str) {
            let ret = '';
            for (let x = 0; x < str.length; x++) {
                if (str.charCodeAt(x) >= 32 && str.charCodeAt(x) <= 126 ||
                    str.charCodeAt(x) >= 128 && str.charCodeAt(x) <= 255) {
                    ret += str.charAt(x);
                }
            }
            return ret;
        };

        /**
         * Compare arrays for equality; optionally deep-compare nested arrays.
         * @param {Array} a
         * @param {Array} b
         * @param {boolean} [deep=false] When true, recursively compares nested arrays.
         * @returns {boolean}
         */
        Snap.array_equal = function (a, b, deep) {
            if (a === b) return true;
            if (a == null || b == null) return false;
            if (a.length !== b.length) return false;

            // If you don't care about the order of the elements inside
            // the array, you should sort both arrays here.
            // Please note that calling sort on an array will modify that array.
            // you might want to clone your array first.

            for (let i = 0; i < a.length; ++i) {
                if (a[i] !== b[i]) {
                    if (deep && Array.isArray(a[i]) && Array.isArray(b[i])) {
                        if (!Snap.array_equal(a[i], b[i], deep)) return false;
                    } else {
                        return false;
                    }
                }
            }
            return true;
        };

        /**
         * Convert a string to Title Case by capitalizing each word.
         * @param {string} str
         * @returns {string}
         */
        Snap.titleCase = function (str) {
            const splitStr = str.toLowerCase().split(' ');
            for (let i = 0; i < splitStr.length; ++i) {
                // You do not need to check if i is larger than splitStr length, as your for does that for you
                // Assign it back to the array
                splitStr[i] = splitStr[i].charAt(0).toUpperCase() +
                    splitStr[i].substring(1);
            }
            // Directly return the joined string
            return splitStr.join(' ');
        };

        /**
         * Computes the cross product between two vectors.
         * For 2D vectors: returns scalar (z-component of 3D cross product).
         * For 3D vectors: returns the perpendicular vector.
         * @param {number|{x:number,y:number,z:(number|undefined)}|number[]} x1 X component or first vector.
         * @param {number|{x:number,y:number,z:(number|undefined)}|number[]} y1 Y component or second vector when {@link x1} is an object.
         * @param {number} [x2] Optional X component of the second vector.
         * @param {number} [y2] Optional Y component of the second vector.
         * @param {number} [z1] Optional Z component of the first vector.
         * @param {number} [z2] Optional Z component of the second vector.
         * @returns {number|{x:number,y:number,z:number}} Scalar for 2D, vector for 3D.
         */
        Snap.cross = function (x1, y1, x2, y2, z1, z2) {
            let v1, v2;

            if (typeof y1 === 'object') {
                // cross(vec1, vec2)
                v1 = Snap._normalizeVectorInput(x1);
                v2 = Snap._normalizeVectorInput(y1);
            } else if (typeof x1 === 'object') {
                // cross(vec1, x2, y2, z2)
                v1 = Snap._normalizeVectorInput(x1);
                v2 = Snap._normalizeVectorInput(y1, x2, y2);
            } else {
                // cross(x1, y1, x2, y2) or cross(x1, y1, z1, x2, y2, z2)
                v1 = Snap._normalizeVectorInput(x1, y1, z1);
                v2 = Snap._normalizeVectorInput(x2, y2, z2);
            }

            const is3D = v1.z !== 0 || v2.z !== 0;

            if (!is3D) {
                // 2D cross product returns scalar (z-component)
                return v1.x * v2.y - v2.x * v1.y;
            }

            // 3D cross product returns vector
            return {
                x: v1.y * v2.z - v1.z * v2.y,
                y: v1.z * v2.x - v1.x * v2.z,
                z: v1.x * v2.y - v1.y * v2.x
            };
        }

        /**
         * Projects one vector onto another (2D or 3D).
         * @param {number|{x:number,y:number,z:(number|undefined)}|number[]} x1 X component or source vector.
         * @param {number|{x:number,y:number,z:(number|undefined)}|number[]} y1 Y component or target vector when {@link x1} is an object.
         * @param {number} [x2] Optional X component of the target vector.
         * @param {number} [y2] Optional Y component of the target vector.
         * @param {number} [z1] Optional Z component of the first vector.
         * @param {number} [z2] Optional Z component of the second vector.
         * @returns {{x:number,y:number,z:(number|undefined)}} Projection of the first vector onto the second.
         */
        Snap.project = function (x1, y1, x2, y2, z1, z2) {
            let v1, v2;

            if (typeof y1 === 'object') {
                // project(vec1, vec2)
                v1 = Snap._normalizeVectorInput(x1);
                v2 = Snap._normalizeVectorInput(y1);
            } else if (typeof x1 === 'object') {
                // project(vec1, x2, y2, z2)
                v1 = Snap._normalizeVectorInput(x1);
                v2 = Snap._normalizeVectorInput(y1, x2, y2);
            } else {
                // project(x1, y1, x2, y2) or project(x1, y1, z1, x2, y2, z2)
                v1 = Snap._normalizeVectorInput(x1, y1, z1);
                v2 = Snap._normalizeVectorInput(x2, y2, z2);
            }

            const is3D = v1.z !== 0 || v2.z !== 0;
            const dotProduct = Snap.dot(v1, v2);

            // Calculate length squared efficiently
            let lengthSquared;
            if (!is3D && typeof Snap.len2 === 'function') {
                lengthSquared = Snap.len2(v2.x, v2.y);
            } else {
                lengthSquared = v2.x * v2.x + v2.y * v2.y + v2.z * v2.z;
            }

            const scalar = lengthSquared ? dotProduct / lengthSquared : 0;

            return is3D
                ? {x: scalar * v2.x, y: scalar * v2.y, z: scalar * v2.z}
                : {x: scalar * v2.x, y: scalar * v2.y};
        }

        /**
         * Reflects a vector across a surface defined by its normal vector (2D or 3D).
         * Useful for physics simulations and bounce effects.
         * @param {number|{x:number,y:number,z:(number|undefined)}|number[]} x1 X component or incident vector.
         * @param {number|{x:number,y:number,z:(number|undefined)}|number[]} y1 Y component or normal vector when {@link x1} is an object.
         * @param {number} [x2] Optional X component of the normal vector.
         * @param {number} [y2] Optional Y component of the normal vector.
         * @param {number} [z1] Optional Z component of the incident vector.
         * @param {number} [z2] Optional Z component of the normal vector.
         * @returns {{x:number,y:number,z:(number|undefined)}} Reflected vector.
         */
        Snap.v_reflect = function (x1, y1, x2, y2, z1, z2) {
            let incident, normal;

            if (typeof y1 === 'object') {
                // v_reflect(incident, normal)
                incident = Snap._normalizeVectorInput(x1);
                normal = Snap._normalizeVectorInput(y1);
            } else if (typeof x1 === 'object') {
                // v_reflect(incident, nx, ny, nz)
                incident = Snap._normalizeVectorInput(x1);
                normal = Snap._normalizeVectorInput(y1, x2, y2);
            } else {
                // v_reflect(ix, iy, iz, nx, ny, nz) or v_reflect(ix, iy, nx, ny)
                incident = Snap._normalizeVectorInput(x1, y1, z1);
                normal = Snap._normalizeVectorInput(x2, y2, z2);
            }

            const is3D = incident.z !== 0 || normal.z !== 0;

            // Reflection formula: v - 2 * (v · n) * n
            const dotProduct = Snap.dot(incident, normal);
            const factor = 2 * dotProduct;

            return is3D
                ? {
                    x: incident.x - factor * normal.x,
                    y: incident.y - factor * normal.y,
                    z: incident.z - factor * normal.z
                }
                : {
                    x: incident.x - factor * normal.x,
                    y: incident.y - factor * normal.y
                };
        }

        /**
         * Rotates a 3D vector around an arbitrary axis by a given angle.
         * Uses Rodrigues' rotation formula for efficiency.
         * @param {{x:number,y:number,z:number}|number[]} vector Vector to rotate.
         * @param {{x:number,y:number,z:number}|number[]} axis Rotation axis (will be normalized).
         * @param {number} angle Rotation angle in radians.
         * @returns {{x:number,y:number,z:number}} Rotated vector.
         */
        Snap.v_rotate3D = function (vector, axis, angle) {
            const v = Snap._normalizeVectorInput(vector);
            const k = Snap.normalize(axis);

            const cosTheta = Math.cos(angle);
            const sinTheta = Math.sin(angle);
            const oneMinusCos = 1 - cosTheta;

            // Rodrigues' rotation formula: v_rot = v*cos(θ) + (k×v)*sin(θ) + k*(k·v)*(1-cos(θ))
            const kDotV = k.x * v.x + k.y * v.y + k.z * v.z;

            // k × v
            const kCrossV = {
                x: k.y * v.z - k.z * v.y,
                y: k.z * v.x - k.x * v.z,
                z: k.x * v.y - k.y * v.x
            };

            return {
                x: v.x * cosTheta + kCrossV.x * sinTheta + k.x * kDotV * oneMinusCos,
                y: v.y * cosTheta + kCrossV.y * sinTheta + k.y * kDotV * oneMinusCos,
                z: v.z * cosTheta + kCrossV.z * sinTheta + k.z * kDotV * oneMinusCos
            };
        }

        /**
         * Returns a zero vector (2D or 3D).
         * @param {boolean} [is3D=false] Whether to return a 3D zero vector.
         * @returns {{x:number,y:number,z:(number|undefined)}} A vector with all coordinates equal to zero.
         */
        Snap.zero = function (is3D) {
            return is3D ? {x: 0, y: 0, z: 0} : {x: 0, y: 0};
        }

        /**
         * Clamps the magnitude of a vector to a maximum length (2D or 3D).
         * Useful for limiting velocities in animations.
         * @param {number|{x:number,y:number,z:(number|undefined)}|number[]} x X component or vector object.
         * @param {number} [y] Y component or max length when x is a vector.
         * @param {number} [z_or_max] Z component or max length.
         * @param {number} [max] Maximum length when all components provided.
         * @returns {{x:number,y:number,z:(number|undefined)}} Clamped vector.
         */
        Snap.v_clamp = function (x, y, z_or_max, max) {
            let v, maxLength;

            if (typeof x === 'object') {
                v = Snap._normalizeVectorInput(x);
                maxLength = y;
            } else if (typeof max !== 'undefined') {
                v = Snap._normalizeVectorInput(x, y, z_or_max);
                maxLength = max;
            } else {
                v = Snap._normalizeVectorInput(x, y, 0);
                maxLength = z_or_max;
            }

            const is3D = v.z !== 0;
            const magSq = v.x * v.x + v.y * v.y + v.z * v.z;
            const maxSq = maxLength * maxLength;

            if (magSq <= maxSq) {
                return is3D ? {x: v.x, y: v.y, z: v.z} : {x: v.x, y: v.y};
            }

            const scale = maxLength / Math.sqrt(magSq);

            return is3D
                ? {x: v.x * scale, y: v.y * scale, z: v.z * scale}
                : {x: v.x * scale, y: v.y * scale};
        }

        /**
         * Calculates the angle between two vectors in radians (2D or 3D).
         * Returns value in range [0, π].
         * @param {number|{x:number,y:number,z:(number|undefined)}|number[]} x1 X component or first vector.
         * @param {number|{x:number,y:number,z:(number|undefined)}|number[]} y1 Y component or second vector when {@link x1} is an object.
         * @param {number} [x2] Optional X component of the second vector.
         * @param {number} [y2] Optional Y component of the second vector.
         * @param {number} [z1] Optional Z component of the first vector.
         * @param {number} [z2] Optional Z component of the second vector.
         * @returns {number} Angle in radians.
         */
        Snap.v_angle = function (x1, y1, x2, y2, z1, z2) {
            let v1, v2;

            if (typeof y1 === 'object') {
                v1 = Snap._normalizeVectorInput(x1);
                v2 = Snap._normalizeVectorInput(y1);
            } else if (typeof x1 === 'object') {
                v1 = Snap._normalizeVectorInput(x1);
                v2 = Snap._normalizeVectorInput(y1, x2, y2);
            } else {
                v1 = Snap._normalizeVectorInput(x1, y1, z1);
                v2 = Snap._normalizeVectorInput(x2, y2, z2);
            }

            const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
            const mag1Sq = v1.x * v1.x + v1.y * v1.y + v1.z * v1.z;
            const mag2Sq = v2.x * v2.x + v2.y * v2.y + v2.z * v2.z;

            if (mag1Sq === 0 || mag2Sq === 0) return 0;

            const cosAngle = dot / Math.sqrt(mag1Sq * mag2Sq);
            // Clamp to [-1, 1] to avoid numerical errors with acos
            return Math.acos(Math.max(-1, Math.min(1, cosAngle)));
        }

        /**
         * Calculates the signed angle between two 2D vectors in radians.
         * Returns value in range [-π, π]. Positive for counter-clockwise, negative for clockwise.
         * @param {number|{x:number,y:number}|number[]} x1 X component or first vector.
         * @param {number|{x:number,y:number}|number[]} y1 Y component or second vector when {@link x1} is an object.
         * @param {number} [x2] Optional X component of the second vector.
         * @param {number} [y2] Optional Y component of the second vector.
         * @returns {number} Signed angle in radians.
         */
        Snap.v_angle_signed = function (x1, y1, x2, y2) {
            let v1, v2;

            if (typeof y1 === 'object') {
                v1 = Snap._normalizeVectorInput(x1);
                v2 = Snap._normalizeVectorInput(y1);
            } else if (typeof x1 === 'object') {
                v1 = Snap._normalizeVectorInput(x1);
                v2 = Snap._normalizeVectorInput(y1, x2);
            } else {
                v1 = Snap._normalizeVectorInput(x1, y1);
                v2 = Snap._normalizeVectorInput(x2, y2);
            }

            return Math.atan2(v2.y, v2.x) - Math.atan2(v1.y, v1.x);
        }

        /**
         * Computes the vector from a point to the closest point on a line segment.
         * @param {{x:number,y:number}|number[]} p The source point.
         * @param {{x:number,y:number}|number[]} lp1 First point of the line segment.
         * @param {{x:number,y:number}|number[]} lp2 Second point of the line segment.
         * @param {boolean} [normalize=false] Whether to normalize the resulting vector.
         * @param {number} [sq_error=1e-5] Squared error tolerance used when the segment length is negligible.
         * @returns {{x:number,y:number}} Vector pointing from {@link p} toward the line.
         */
        Snap.vectorPointToLine = function (p, lp1, lp2, normalize, sq_error) {
            sq_error = sq_error || 1e-5;
            if (Snap.len2(lp1.x, lp1.y, lp2.x, lp2.x) < sq_error) {
                const ret = {x: lp1.x - p.x, y: lp1.y - p.y};
                if (normalize) {

                }
            }
            let x0 = p.x || +p[0] || 0, y0 = p.y || +p[1] || 0,
                x1 = lp1.x || +lp1[0] || 0, y1 = lp1.y || +lp1[1] || 0,
                x2 = lp2.x || +lp2[0] || 0, y2 = lp2.y || +lp2[1] || 0;

            let num = Math.abs(
                (y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1);
            let denum = Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));

            let distance = num / denum;

            const orthogonal = Snap.orthogonal({x: x2 - x1, y: y2 - y1});
            let norm = Snap.normalize(orthogonal);

            const distance_vector = {
                x: x0 + distance * norm.x,
                y: y0 + distance * norm.y,
            };

            if (Snap.len2(x1, y1, distance_vector.x, distance_vector.y) <
                Snap.len2(x1, y1, x0, y0)) {
                return (normalize) ?
                    norm :
                    {x: distance * norm.x, y: distance * norm.y};  //in this case the norm vector is towards the line
            } else {
                return (normalize) ? {x: -norm.x, y: -norm.y} : {
                    x: -distance * norm.x,
                    y: -distance * norm.y,
                }; // in this case the norm vector is way from the line.
            }
        };

        /**
         * Checks if an angle lies between two other angles within the minor arc.
         * @param {number} a1 Reference angle one, in degrees.
         * @param {number} a2 Reference angle two, in degrees.
         * @param {number} target The target angle to test, in degrees.
         * @returns {boolean} True when {@link target} lies between {@link a1} and {@link a2}.
         */
        Snap.angle_between = function (a1, a2, target) {
            let dif_1_2 = (Math.abs(a1 - a2) + 360) % 360;
            dif_1_2 > 180 && (dif_1_2 = 360 - dif_1_2);
            let dif_1_t = (Math.abs(a1 - target) + 360) % 360;
            dif_1_t > 180 && (dif_1_t = 360 - dif_1_t);
            let dif_2_t = (Math.abs(a2 - target) + 360) % 360;
            dif_2_t > 180 && (dif_2_t = 360 - dif_2_t);

            return (dif_1_t + dif_2_t) <= dif_1_2 + 1e-12;
        };

        /**
         * Normalizes an angle to a specific range.
         * @param {number} angle Angle to normalize.
         * @param {boolean} [bwn_neg_pos=false] When true, normalizes between -180° and 180° (or -π and π when {@link rad} is true).
         * @param {boolean} [rad=false] Treats the input angle as radians instead of degrees.
         * @returns {number} Normalized angle in the same units as the input.
         */
        Snap.angle_normalize = function (angle, bwn_neg_pos, rad) {
            if (rad) {
                if (bwn_neg_pos) {
                    angle = (angle + Math.PI) % (2 * Math.PI) - Math.PI;
                    return (angle > -Math.PI) ? angle : -angle;
                } else {
                    return angle - Math.floor(angle / (2 * Math.PI)) * 2 * Math.PI;
                }
            } else {
                if (bwn_neg_pos) {
                    angle = (angle + 180 + 360) % 360 - 180;
                    return angle > -180 ? angle : -angle;
                } else {
                    return (angle >= 0 ? angle : (360 - ((-angle) % 360))) % 360
                }
            }
        }

        /**
         * Finds the maximum safe distance from a point to the edges of an element's bounding box.
         * @param {{x:number,y:number}} ct Point to evaluate.
         * @param {Snap.Element} el Snap element providing the bounding box.
         * @param {boolean} [top=false] When true, returns vertical distance to the top edge instead of the farthest corner.
         * @returns {number} Non-negative distance value, zero when the point is outside the bbox.
         */
        Snap.getSafeDistance = function (ct, el, top) {
            // if (top === undefined) top = false;
            const bbox = el.getBBox();
            if (ct.x < bbox.x || ct.x > bbox.x2 || ct.y < bbox.y || ct.y >
                bbox.y2) return 0;
            if (top) return ct.y - bbox.y;
            return Math.max(Snap.len(ct.x, ct.y, bbox.x, bbox.y),
                Snap.len(ct.x, ct.y, bbox.x2, bbox.y),
                Snap.len(ct.x, ct.y, bbox.x, bbox.y2),
                Snap.len(ct.x, ct.y, bbox.x2, bbox.y2));
        };

        /**
         * Computes the change-of-basis matrix for transforming coordinates from one group to another.
         * @param {Snap.Element} from Source group element.
         * @param {Snap.Element} to Destination group element.
         * @returns {Snap.Matrix} Matrix that converts coordinates from {@link from} space into {@link to} space.
         */
        Snap.groupToGroupChangeOfBase = function (from, to) {
            const fromMatrix = from.transform().totalMatrix;
            const toMatrix_inv = to.transform().totalMatrix.invert();
            return toMatrix_inv.multLeft(fromMatrix);
        }

        /**
         * Determines whether two polygons intersect using the Separating Axis Theorem.
         * @param {Array<{x:number,y:number}>} a Polygon defined by connected vertices.
         * @param {Array<{x:number,y:number}>} b Polygon defined by connected vertices.
         * @returns {boolean} True if the polygons overlap, false otherwise.
         */
        Snap.polygonsIntersectConcave = function (a, b) {
            //todo use points
            const polygons = [a, b];
            let minA, maxA, projected, i, i1, j, minB, maxB;

            for (i = 0; i < polygons.length; i++) {

                // for each polygon, look at each edge of the polygon, and determine if it separates
                // the two shapes
                const polygon = polygons[i];
                for (i1 = 0; i1 < polygon.length; i1++) {

                    // grab 2 vertices to create an edge
                    const i2 = (i1 + 1) % polygon.length;
                    const p1 = polygon[i1];
                    const p2 = polygon[i2];

                    // find the line perpendicular to this edge
                    const normal = {x: p2.y - p1.y, y: p1.x - p2.x};

                    minA = maxA = undefined;
                    // for each vertex in the first shape, project it onto the line perpendicular to the edge
                    // and keep track of the min and max of these values
                    for (j = 0; j < a.length; j++) {
                        projected = normal.x * a[j].x + normal.y * a[j].y;
                        if (minA === undefined || projected < minA) {
                            minA = projected;
                        }
                        if (maxA === undefined || projected > maxA) {
                            maxA = projected;
                        }
                    }

                    // for each vertex in the second shape, project it onto the line perpendicular to the edge
                    // and keep track of the min and max of these values
                    minB = maxB = undefined;
                    for (j = 0; j < b.length; j++) {
                        projected = normal.x * b[j].x + normal.y * b[j].y;
                        if (minB === undefined || projected < minB) {
                            minB = projected;
                        }
                        if (maxB === undefined || projected > maxB) {
                            maxB = projected;
                        }
                    }

                    // if there is no overlap between the projects, the edge we are looking at separates the two
                    // polygons, and we know there is no overlap
                    if (maxA < minB || maxB < minA) {
                        // CONSOLE("polygons don't intersect!");
                        return false;
                    }
                }
            }
            return true;
        };

        /**
         * Generates an expanded polygon by offsetting each vertex outward by the supplied distance.
         * @param {Array<{x:number,y:number}>} points Vertices of the original polygon (clockwise or counter-clockwise).
         * @param {number} distance Offset distance applied to each vertex.
         * @returns {Array<{x:number,y:number}>} Expanded polygon vertices.
         */
        Snap.polygonExpand = function (points, distance) {
            const expandedPoints = [];
            const numPoints = points.length;

            // Compute the centroid of the polygon
            let centroid = {x: 0, y: 0};
            for (let i = 0; i < numPoints; i++) {
                centroid.x += points[i].x;
                centroid.y += points[i].y;
            }
            centroid.x /= numPoints;
            centroid.y /= numPoints;

            for (let i = 0; i < numPoints; i++) {
                const current = points[i];
                const prev = points[(i - 1 + numPoints) % numPoints];
                const next = points[(i + 1) % numPoints];

                // Calculate normalized direction vectors
                const prevDir = Snap.normalize({x: current.x - prev.x, y: current.y - prev.y});
                const nextDir = Snap.normalize({x: next.x - current.x, y: next.y - current.y});

                // Calculate outward normal vectors by rotating direction vectors 90 degrees
                const prevNormal = {x: -prevDir.y, y: prevDir.x};
                const nextNormal = {x: -nextDir.y, y: nextDir.x};

                // Average the normals to maintain the original angles better
                const offsetDir = Snap.normalize({
                    x: prevNormal.x + nextNormal.x,
                    y: prevNormal.y + nextNormal.y
                });

                // Determine the direction of expansion based on the centroid
                const directionToCentroid = Snap.normalize({
                    x: centroid.x - current.x,
                    y: centroid.y - current.y
                });

                // Ensure the offset direction is outward
                const dotProduct = Snap.dot(offsetDir, directionToCentroid);
                const outwardDir = dotProduct > 0 ? {x: -offsetDir.x, y: -offsetDir.y} : offsetDir;

                // Offset the current point by the distance along the computed direction
                expandedPoints.push({
                    x: current.x + outwardDir.x * distance,
                    y: current.y + outwardDir.y * distance
                });
            }

            return expandedPoints;
        }

        /**
         * Decodes a compact JSON representation of an SVG tree into raw markup.
         * @param {Object|string} json JSON describing the SVG structure.
         * @param {Function} [decript] Optional mapper that decrypts the attribute map.
         * @param {Object} [map] Lookup object translating compact tokens to attribute names.
         * @param {AttributeKeyConfiguration} [system]
         *  Custom key configuration describing where attributes, type, and children are stored.
         * @returns {string} SVG/XML markup generated from the JSON input.
         * @throws {Error} When a mapping table is not provided.
         */
        function decode_json(json, decript = undefined, map = undefined, system = undefined) {
            let attr = (system && (system.attr || system.attributes)) || "A";
            let type = (system && system.type) || "T";
            let children = (system && system.children) || "C";

            if (typeof json === "string") {
                try {
                    json = JSON.parse(json);
                } catch (e) {
                    return "";
                }
            }

            let xmlStr = "";

            if (!map && json['_']) {
                map = json['_'];
            }

            if (!map || typeof map !== "object") {
                throw new Error("No map provided");
            }

            if (decript && typeof decript === "function") {
                map = decript(map);
            }

            const typeName = map[json[type]] || json[type];

            if (typeName === 'svg') {
                xmlStr += "<svg";
            } else {
                xmlStr += "<" + typeName;
            }

            if (json[attr]) {
                for (const [key, value] of Object.entries(json[attr])) {
                    let attribute = map[key] || key;
                    if (typeof value === "object") {
                        let valueStr = "";
                        for (const [styleKey, styleValue] of Object.entries(value)) {
                            let styleAttr = map[styleKey] || styleKey;
                            if (typeof styleValue === "object") {
                                let styleValueStr = "";
                                for (const [styleKey2, styleValue2] of Object.entries(styleValue)) {
                                    let styleAttr2 = map[styleKey2] || styleKey2;
                                    styleValueStr += `${styleAttr2}:${styleValue2};`;
                                }
                                valueStr += `${styleAttr}:${styleValueStr}`;
                            } else {
                                valueStr += `${styleAttr}:${styleValue};`;
                            }
                        }
                        xmlStr += ` ${attribute}="${valueStr}"`;
                    } else {
                        xmlStr += ` ${attribute}="${value}"`;
                    }
                }
            }

            if (json[children]) {
                xmlStr += ">";
                let text_added = false;
                for (const child of json[children]) {
                    if (typeof child === "string") {
                        xmlStr += (text_added ? '\n' : "") + child;
                        text_added = true;
                    } else {
                        xmlStr += decode_json(child, decript, map, system);
                        text_added = false;
                    }
                }
                xmlStr += `</${typeName}>`;
            } else {
                xmlStr += "/>";
            }

            return xmlStr;
        }

        Snap.jsonToSvg = decode_json;

        /**
         * Converts RGB components in the range [0, 1] to CMYK percentages.
         * @param {number} r Red component normalized to [0, 1].
         * @param {number} g Green component normalized to [0, 1].
         * @param {number} b Blue component normalized to [0, 1].
         * @returns {{c:number,m:number,y:number,k:number}} Corresponding CMYK values.
         */
        Snap.rgb2cmyk = function (r, g, b) {
            let computedC = 0;
            let computedM = 0;
            let computedY = 0;
            let computedK = 0;

            if (r == null || g == null || b == null ||
                isNaN(r) || isNaN(g) || isNaN(b)) {
                // alert ('Please enter numeric RGB values!');
                return {c: 0, m: 0, y: 0, k: 0};
            }
            if (r < 0 || g < 0 || b < 0 || r > 1 || g > 1 || b > 1) {
                // alert ('RGB values must be in the range 0 to 255.');
                return {c: 0, m: 0, y: 0, k: 0};
            }

            // BLACK
            if (r === 0 && g === 0 && b === 0) {
                computedK = 1;
                return {c: 0, m: 0, y: 0, k: 1};
            }

            computedC = 1 - (r);
            computedM = 1 - (g);
            computedY = 1 - (b);

            const minCMY = Math.min(computedC,
                Math.min(computedM, computedY));
            computedC = (computedC - minCMY) / (1 - minCMY);
            computedM = (computedM - minCMY) / (1 - minCMY);
            computedY = (computedY - minCMY) / (1 - minCMY);
            computedK = minCMY;

            return {c: computedC, m: computedM, y: computedY, k: computedK};
        };

        /**
         * Converts CMYK values to 8-bit RGB components.
         * @param {number} c Cyan component normalized to [0, 1].
         * @param {number} m Magenta component normalized to [0, 1].
         * @param {number} y Yellow component normalized to [0, 1].
         * @param {number} k Key (black) component normalized to [0, 1].
         * @returns {{r:number,g:number,b:number}} RGB components in the range [0, 255].
         */
        Snap.cmykToRgb = function (c, m, y, k) {

            let result = {r: 0, g: 0, b: 0};

            result.r = round((1 - c) * (1 - k) * 255);
            result.g = round((1 - m) * (1 - k) * 255);
            result.b = round((1 - y) * (1 - k) * 255);

            return result;
        };

        /**
         * Changes the format of style from string to object and vice versa
         * @param {String | Object} style a string or object presentation of a style
         * @return {String | Object} returns an object or string presentation of the style respectively
         */
        Snap.convertStyleFormat = function (style) {
            let result;
            if (!style) return {};
            if (typeof style === 'string') {
                result = {};
                const coms = style.split(';');
                let i = 0, com;
                for (; i < coms.length; ++i) {
                    com = coms[i].split(':');
                    if (com.length === 2) result[com[0].replace(/\s/g,
                        '')] = com[1].replace(/\s/g, '');
                }
                return result;
            } else if (typeof style === 'object') {
                result = [];
                for (let stl in style) {
                    if (style.hasOwnProperty(stl)) {
                        result.push(stl + ':' + style[stl]);
                    }
                }
                return result.join(';');
            }

        };

        /**
         * Converts a camelCase string into kebab-case.
         * @param {string} str Input string.
         * @returns {string} Hyphenated representation.
         */
        Snap.camelToHyphen = function (str) {
            return str.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
        }

        /**
         * Converts dash or underscore delimited strings to camelCase.
         * @param {string} str Input string.
         * @returns {string} Camel-cased representation.
         */
        Snap.toCamelCase = function (str) {
            return str.replace(/[-_]+([a-z])/gi, function ($1, letter) {
                return letter.toUpperCase();
            });
        }

        /**
         * Polls a condition until it becomes true or the time limit elapses.
         * @param {Function} condition Predicate returning a boolean-like value.
         * @param {Function} callback Invoked once the condition succeeds.
         * @param {TimeLimitSpecifier} [timelimit=1000] Maximum wait duration in milliseconds, optionally paired with a custom interval step.
         * @param {Function} [fail_callback] Called when the time limit expires before success.
         */
        Snap.waitFor = function (condition, callback, timelimit, fail_callback) {
            timelimit = timelimit || 1000;
            let step = 10;
            if (Array.isArray(timelimit)) {
                step = (typeof timelimit[1] === 'number') ? timelimit[1] : step;
                timelimit = (typeof timelimit[0] === 'number') ?
                    timelimit[0] :
                    1000;
            }
            const start_time = Date.now();
            let timer = setInterval(function () {
                if (condition()) {
                    clearInterval(timer);
                    // console.log("Success waiting");
                    callback();
                } else if (Date.now() - start_time > timelimit) {
                    clearInterval(timer);
                    if (fail_callback) fail_callback();
                }
            }, step);
        };


        /**
         * Validates a URL string for either absolute or relative formats.
         * @param {string} url_string String to validate.
         * @param {boolean} [relative=false] When true, enforces relative-path validation.
         * @returns {boolean} True when {@link url_string} conforms to the requested format.
         */
        Snap.isUrl = function (url_string, relative) {
            if (relative) {
                const pattern = /^(?!www\.|(?:http|ftp)s?:\/\/|[A-Za-z]:\\|\/\/)[^\s]*$/;
                return pattern.test(url_string);
            } else {
                try {
                    new URL(url_string);
                    return true;
                } catch (_) {
                    return false;
                }
            }
        }

        /**
         * Determines whether the supplied object has no enumerable own properties.
         * @param {Object} obj Object to inspect.
         * @returns {boolean} True when the object has no own properties.
         */
        Snap.isEmptyObject = function (obj) {
            for (var prop in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                    return false;
                }
            }
            return true;
        }

       /**
         * Flattens a nested object into a single-level map.
         *
         * The function can be called in two modes:
         * - Flatten with dotted keys: pass `prefix` as `true` (or as a non-empty string),
         *   in which case nested keys are concatenated with `.` (e.g. `parent.child`).
         * - Use nested keys as-is: pass `prefix` as `false` (or an empty string),
         *   in which case nested objects are recursively flattened but resulting keys
         *   are not prefixed with parent names.
         *
         * Note: if `prefix` is passed as a boolean it is treated as the `useDots` flag
         * and the internal prefix string is reset to `''`. The third parameter `res`
         * is an accumulator object used for recursion and is returned.
         *
         * @param {Object} obj The object to flatten.
         * @param {string|boolean} [prefix=''] When a boolean, acts as `useDots`.
         *        When a string, if truthy will cause dotted keys to be used.
         * @param {Object} [res={}] Accumulator for flattened properties (used internally).
         * @returns {Object} The flattened object (same reference as `res`).
         */
        Snap.flattenObject = function (obj, prefix = '', res = {}) {
            // If prefix is passed as a boolean, treat it as useDots flag.
            let useDots = false;
            if (typeof prefix === 'boolean') {
                useDots = prefix;
                prefix = '';
            } else {
                useDots = !!prefix;
            }

            for (let key in obj) {
                if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
                const val = obj[key];
                const newKey = useDots ? (prefix ? prefix + '.' + key : key) : key;

                if (val && typeof val === 'object') {
                    Snap.flattenObject(val, useDots ? newKey : '', res);
                } else {
                    res[newKey] = val;
                }
            }
            return res;
        }

        const htmlEntities = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&#38;': '&',
            '&#60;': '<',
            '&#62;': '>'
            // '&quot;': '"',
            // '&#39;': "'"
        };
        /**
         * Normalizes Illustrator-generated identifiers into readable names.
         * @param {string} str Raw name to sanitize.
         * @returns {string} Cleaned identifier that is safe for use in Snap documents.
         */
        Snap.AI_name_fix = function (str) {
            if (!str) return '';
            const result = str.replace(/_(x[0-9A-F]{2})_/g, function (_, b) {
                return String.fromCharCode('0' + b);
            }).replace(/(.+)(_\d+_)$/, function (_, id) {
                return id;
            }).replace(/&[a-zA-Z0-9#]+;/g, function (match) {
                return htmlEntities[match] || match;
            });
            return result.replace(/ /g, '_');

        };

        /**
         * Returns a specific dimension from either a Snap element or raw bounding box object.
         * @param {Snap.Element|{x:number,y:number,x2:number,y2:number,width:number,height:number}} el Element or bounding box.
         * @param {string} dim Name of the dimension to extract (for example, "width" or "x").
         * @returns {number} Numeric value of the requested dimension.
         */
        Snap.dimFromElement = function (el, dim) {
            if (!Snap.is(el, 'Element')) return el;
            return el.getBBox()[dim];
        }

        /**
         * Evaluates dimension expressions with optional bounds and percentage handling.
         * @param {string|number|Array} str Expression describing the dimension; array form is [expr, min?, max?].
         * @param {number} space Base value used for percentage calculations.
         * @param {Function} [evaluate] Optional evaluator function used to compute expressions (e.g. percentage or formula strings).
         *          It is called with the expression and should return a numeric result. Recommended math.js: math.evaluate
         * @param {boolean} [negative=false] Whether the result may be negative.
         * @returns {number} Clamped dimension value.
         */
        Snap.varDimension = function (str, space, evaluate, negative) {

            if (typeof str === "number") return str;

            let max = Infinity, min = 0;
            if (Array.isArray(str)) {
                min = str[1] || 0;
                max = str[2] || Infinity;
                str = str[0];
            }

            const repls_percent = function (a, b) {
                b = b.replace('%', '');
                return String(space * b / 100);
            };
            const reg_percent = /(\d*\.?\d*%)/g;
            str = str.replace(reg_percent, repls_percent);

            if (evaluate) {
                try {
                    if (typeof max === 'string') max = evaluate(
                        max.replace(reg_percent, repls_percent));
                } catch (e) {
                    max = Infinity;
                }

                try {
                    if (typeof min === 'string') min = evaluate(
                        min.replace(reg_percent, repls_percent));
                } catch (e) {
                    min = 0;
                }

                try {
                    str = evaluate(str);
                } catch (e) {
                    str = space;
                }
            }
            if (negative) {
                return Math.min(Math.max(str, -max), max);
            }
            return Math.min(Math.max(str, min), max);
        }

    });


    //Matrix functions
    Snap.plugin(function (Snap, Element, Paper, global, Fragment, eve) {
        //Matrix Extentions

        /**
         * Applies the matrix to a point and returns the transformed coordinates.
         * @param {{x:number,y:number}|number[]} point Source point.
         * @param {Snap.Element} [node] Optional Snap element context.
         * @returns {{x:number,y:number}} Transformed point.
         */
        Snap.Matrix.prototype.apply = function (point, node) {
            let ret = {};
            ret.x = this.x(point.x || point[0] || 0, point.y || +point[1] || 0);
            ret.y = this.y(point.x || point[0] || 0, point.y || point[1] || 0);
            return ret;
        };

        /**
         * Solve a system of linear equations Ax = b using Gaussian elimination with partial pivoting
         * @param {Array<Array<number>>} A - Coefficient matrix
         * @param {Array<number>} b - Result vector
         * @returns {Array<number>} - Solution vector x
         */
        Snap.Matrix.prototype.lusolve = function (A, b) {
            if (Snap.is(A, "Matrix")) A = A.to2dArray();
            if (b === undefined && Array.isArray(A) && !isNaN(A(0))) {
                b = A;
                A = this.to2dArray();
            }
            const n = A.length;

            // Create augmented matrix [A|b] with copies to avoid modifying originals
            const augmented = A.map((row, i) => [...row, b[i]]);

            // Forward elimination with partial pivoting
            for (let col = 0; col < n; col++) {
                // Find pivot (largest absolute value in current column)
                let maxRow = col;
                for (let row = col + 1; row < n; row++) {
                    if (Math.abs(augmented[row][col]) > Math.abs(augmented[maxRow][col])) {
                        maxRow = row;
                    }
                }

                // Swap rows if needed
                if (maxRow !== col) {
                    [augmented[col], augmented[maxRow]] = [augmented[maxRow], augmented[col]];
                }

                // Check for singular matrix
                if (Math.abs(augmented[col][col]) < 1e-12) {
                    throw new Error('Matrix is singular or nearly singular');
                }

                // Eliminate column entries below pivot
                for (let row = col + 1; row < n; row++) {
                    const factor = augmented[row][col] / augmented[col][col];
                    for (let j = col; j <= n; j++) {
                        augmented[row][j] -= factor * augmented[col][j];
                    }
                }
            }

            // Back substitution
            const solution = new Array(n);
            for (let i = n - 1; i >= 0; i--) {
                let sum = augmented[i][n];
                for (let j = i + 1; j < n; j++) {
                    sum -= augmented[i][j] * solution[j];
                }
                solution[i] = sum / augmented[i][i];
            }

            return solution;
        };

        Snap.Matrix.prototype.twoPointTransform = function (
            p1_x, p1_y, p2_x, p2_y, toP1_x, toP1_y, toP2_x, toP2_y) {
            const l1 = [p2_x - p1_x, p2_y - p1_y],
                l2 = [toP2_x - toP1_x, toP2_y - toP1_y];

            // const scale = (Snap.len(l2[0], l2[1]) /
            //     (Snap.len(l1[0], l1[1]) || 1e-12));
            // let angle = Snap.angle(l1[0], l1[1], l2[0], l2[1], 0, 0);

            const eq_matrix = [
                [p1_x, -p1_y, 1, 0],
                [p1_y, p1_x, 0, 1],
                [p2_x, -p2_y, 1, 0],
                [p2_y, p2_x, 0, 1],
            ];
            let solution;
            try {
                solution = this.lusolve(eq_matrix,
                    [toP1_x, toP1_y, toP2_x, toP2_y]);
            } catch (e) {
                return null;
            }

            this.a = solution[0];
            this.b = solution[1];
            this.c = -solution[1];
            this.d = solution[0];
            this.e = solution[2];
            this.f = solution[3];

            return this;
        };

        /**
         * Builds an affine transformation that maps two source points to two target points.
         * @param {number} p1_x Source point 1 X coordinate.
         * @param {number} p1_y Source point 1 Y coordinate.
         * @param {number} p2_x Source point 2 X coordinate.
         * @param {number} p2_y Source point 2 Y coordinate.
         * @param {number} toP1_x Destination point 1 X coordinate.
         * @param {number} toP1_y Destination point 1 Y coordinate.
         * @param {number} toP2_x Destination point 2 X coordinate.
         * @param {number} toP2_y Destination point 2 Y coordinate.
         * @returns {Snap.Matrix|null} The matrix after it has been updated; `null` if the system can't be solved.
         */
        Snap.Matrix.prototype.twoPointTransform = function (
            p1_x, p1_y, p2_x, p2_y, toP1_x, toP1_y, toP2_x, toP2_y) {
            const l1 = [p2_x - p1_x, p2_y - p1_y],
                l2 = [toP2_x - toP1_x, toP2_y - toP1_y];

            // const scale = (Snap.len(l2[0], l2[1]) /
            //     (Snap.len(l1[0], l1[1]) || 1e-12));
            // let angle = Snap.angle(l1[0], l1[1], l2[0], l2[1], 0, 0);

            const eq_matrix = [
                [p1_x, -p1_y, 1, 0],
                [p1_y, p1_x, 0, 1],
                [p2_x, -p2_y, 1, 0],
                [p2_y, p2_x, 0, 1],
            ];
            let solution;
            try {
                solution = this.lusolve(eq_matrix,
                    [toP1_x, toP1_y, toP2_x, toP2_y]);
            } catch (e) {
                return null;
            }

            this.a = solution[0];
            this.b = solution[1];
            this.c = -solution[1];
            this.d = solution[0];
            this.e = solution[2];
            this.f = solution[3];

            return this;
        };
    })

}(typeof window !== "undefined" ? window : (global)));
