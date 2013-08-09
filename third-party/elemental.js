/*
 * Elemental 0.2.1 - Simple JavaScript Tag Parser
 *
 * Copyright (c) 2010 Dmitry Baranovskiy (http://dmitry.baranovskiy.com/)
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 */
 
(function () {
    function parse(s) {
        s = s || Object(s);
        var pos = 1,
            len = s.length + 1,
            p, c, n = at(s, 0);
        for (;pos < len; pos++) {
            p = c;
            c = n;
            n = at(s, pos);
            this.raw += c;
            step.call(this, c, n, p);
        }
        this._beforeEnd = function () {
            step.call(this, "", "", c);
        };
        return this;
    }

    function at(s, i) {
        return s && (s.charAt ? s.charAt(i) : s[i]);
    }

    function on(name, f) {
        this.events = this.events || {};
        this.events[name] = this.events[name] || [];
        this.events[name].push(f);
    }

    function event(name, data, extra) {
        if (typeof eve == "function") {
            eve("elemental." + name + "." + data, null, data, extra || "", this.raw);
        }
        var a = this.events && this.events[name],
            i = a && a.length;
        while (i--) try {
            this.events[name][i](data, extra || "", this.raw);
        } catch (e) {}
        this.raw = "";
    }

    function end() {
        step.call(this, "eof");
        // this._beforeEnd && this._beforeEnd();
        // this.raw && this.event("text", this.raw);
        // this.mode = "text";
        // this.textchunk = "";
        // delete this._beforeEnd;
        this.event("eof");
    }

    var whitespace = /[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000]/,
        fireAttrEvent = function () {
            for (var key in this.attr) if (this.attr.hasOwnProperty(key)) {
                this.event("attr", key, {
                    value: this.attr[key],
                    tagname: this.tagname,
                    attr: this.attr
                });
            }
        },
        act = {
            text: function (c, n, p) {
                switch (c) {
                    case "<":
                    case "eof":
                        this.nodename = "";
                        this.attr = {};
                        this.mode = "tag name start";
                        this.raw = this.raw.slice(0, -1);
                        this.textchunk && this.event("text", this.textchunk);
                        this.raw += c;
                        this.textchunk = "";
                    break;
                    default:
                        this.textchunk += c;
                    break;
                }
            },
            special: function (c, n, p) {
                if (p == "!" && c == "-" && n == "-") {
                    this.mode = "comment start";
                    return;
                }
                if (this.textchunk == "[CDATA" && c == "[") {
                    this.mode = "cdata";
                    this.textchunk = "";
                    return;
                }
                if (c == ">" || c == "eof") {
                    this.event("special", this.textchunk);
                    this.mode = "text";
                    this.textchunk = "";
                    return;
                }
                this.textchunk += c;
            },
            cdata: function (c, n, p) {
                if (p == "]" && c == "]" && n == ">") {
                    this.mode = "cdata end";
                    this.textchunk = this.textchunk.slice(0, -1);
                    return;
                }
                if (c == "eof") {
                    act["cdata end"].call(this);
                }
                this.textchunk += c;
            },
            "cdata end": function (c, n, p) {
                this.event("cdata", this.textchunk);
                this.textchunk = "";
                this.mode = "text";
            },
            "comment start": function (c, n, p) {
                if (n == ">" || c == "eof") {
                    this.event("comment", "");
                    this.mode = "comment instant end";
                } else {
                    this.mode = "comment";
                }
            },
            "comment instant end": function (c, n, p) {
                this.mode = "text";
            },
            comment: function (c, n, p) {
                if (c == "-" && p == "-" && n == ">") {
                    this.mode = "comment end";
                    this.textchunk = this.textchunk.slice(0, -1);
                } else if (c == "eof") {
                    this.event("comment", this.textchunk);
                } else {
                    this.textchunk += c;
                }
            },
            "comment end": function (c, n, p) {
                this.event("comment", this.textchunk);
                this.textchunk = "";
                this.mode = "text";
            },
            declaration: function (c, n, p) {
                if (c == "?" && n == ">") {
                    this.mode = "declaration end";
                    return;
                }
                if (c == "eof") {
                    this.event("comment", this.textchunk);
                }
                this.textchunk += c;
            },
            "declaration end": function (c, n, p) {
                this.event("comment", this.textchunk);
                this.textchunk = "";
                this.mode = "text";
            },
            "tag name start": function (c, n, p) {
                if (c == "eof") {
                    this.event("text", "<");
                    return;
                }
                if (!whitespace.test(c)) {
                    this.mode = "tag name";
                    if (c == "/") {
                        this.mode = "close tag name start";
                        return;
                    } else if (c == "!") {
                        this.mode = "special";
                        this.textchunk = "";
                        return;
                    } else if (c == "?") {
                        this.mode = "declaration";
                        return;
                    }
                    act[this.mode].call(this, c, n, p);
                }
            },
            "close tag name start": function (c, n, p) {
                if (!whitespace.test(c)) {
                    this.mode = "close tag name";
                    this.tagname = "";
                    this.nodename = "";
                    act[this.mode].call(this, c, n, p);
                }
            },
            "close tag name": function (c, n, p) {
                if (whitespace.test(c)) {
                    this.tagname = this.nodename;
                } else switch (c) {
                    case ">":
                        this.event("/tag", (this.tagname || this.nodename));
                        this.mode = "text";
                    break;
                    default:
                        !this.tagname && (this.nodename += c);
                    break;
                }
            },
            "tag name": function (c, n, p) {
                if (whitespace.test(c)) {
                    this.tagname = this.nodename;
                    this.nodename = "";
                    this.mode = "attr start";
                } else switch (c) {
                    case ">":
                        this.event("tag", this.nodename);
                        this.mode = "text";
                    break;
                    default:
                        this.nodename += c;
                    break;
                }
            },
            "attr start": function (c, n, p) {
                if (!whitespace.test(c)) {
                    this.mode = "attr";
                    this.nodename = "";
                    act[this.mode].call(this, c, n, p);
                }
            },
            attr: function (c, n, p) {
                if (whitespace.test(c) || c == "=") {
                    this.attr[this.nodename] = "";
                    this.mode = "attr value start";
                } else switch (c) {
                    case ">":
                        if (this.nodename == "/") {
                            delete this.attr["/"];
                            this.event("tag", this.tagname, this.attr);
                            fireAttrEvent.call(this);
                            this.event("/tag", this.tagname, true);
                        } else {
                            this.nodename && (this.attr[this.nodename] = "");
                            this.event("tag", this.tagname, this.attr);
                            fireAttrEvent.call(this);
                        }
                        this.mode = "text";
                    break;
                    default:
                        this.nodename += c;
                    break;
                }
            },
            "attr value start": function (c, n, p) {
                if (!whitespace.test(c)) {
                    this.mode = "attr value";
                    this.quote = false;
                    if (c == "'" || c == '"') {
                        this.quote = c;
                        return;
                    }
                    act[this.mode].call(this, c, n, p);
                }
            },
            "attr value": function (c, n, p) {
                if (whitespace.test(c) && !this.quote) {
                    this.mode = "attr start";
                } else if (c == ">" && !this.quote) {
                    this.event("tag", this.tagname, this.attr);
                    this.mode = "text";
                } else switch (c) {
                    case '"':
                    case "'":
                        if (this.quote == c && p != "\\") {
                            this.mode = "attr start";
                        }
                    break;
                    default:
                        this.attr[this.nodename] += c;
                    break;
                }
            }
        };

    function step(c, n, p) {
        c == "\n" && this.event("newline");
        act[this.mode].call(this, c, n, p);
    }

    function elemental(type) {
        var out = function (s) {
            out.parse(s);
        };
        out.mode = "text";
        out.type = String(type || "html").toLowerCase();
        out.textchunk = "";
        out.raw = "";
        out.parse = parse;
        out.on = on;
        out.event = event;
        out.end = end;
        return out;
    }
    elemental.version = "0.2.1";

    (typeof exports == "undefined" ? this : exports).elemental = elemental;
})();