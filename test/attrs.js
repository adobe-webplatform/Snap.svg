describe("Attributes", function () {
    var s, r;
    beforeEach(function () {
        s = Snap(100, 100);
        r = s.rect(10, 10, 50, 50);
    });
    afterEach(function () {
        s.remove();
    });
    function colorTestProp(key) {
        var o = {};
        return function () {
            o[key] = "#fc0";
            r.attr(o);
            expect(r.node.getAttribute(key)).to.be("#ffcc00");
            expect(r.attr(key)).to.be("rgb(255, 204, 0)");
            o[key] = "rgb(255, 204, 0)";
            r.attr(o);
            expect(r.node.getAttribute(key)).to.be("#ffcc00");
            o[key] = "hsl(0.1333, 1, .5)";
            r.attr(o);
            expect(r.node.getAttribute(key)).to.be("#ffcc00");
            o[key] = "hsb(0.1333, 1, 1)";
            r.attr(o);
            expect(r.node.getAttribute(key)).to.be("#ffcc00");
            o[key] = "rgba(255, 204, 0, .5)";
            r.attr(o);
            expect(r.node.getAttribute(key)).to.be("rgba(255,204,0,0.5)");
            o[key] = "hsla(0.1333, 1, .5, .5)";
            r.attr(o);
            expect(r.node.getAttribute(key)).to.be("rgba(255,204,0,0.5)");
            o[key] = "hsba(0.1333, 1, 1, .5)";
            r.attr(o);
            expect(r.node.getAttribute(key)).to.be("rgba(255,204,0,0.5)");
        };
    }
    function colorTestStyle(key) {
        var o = {};
        return function () {
            function val() {
                return Snap.color(r.node.getAttribute(key)).hex;
            }
            o[key] = "#fc0";
            r.attr(o);
            expect(val()).to.be("#ffcc00");
            o[key] = "rgb(255, 204, 0)";
            r.attr(o);
            expect(val()).to.be("#ffcc00");
            o[key] = "hsl(0.1333, 1, .5)";
            r.attr(o);
            expect(val()).to.be("#ffcc00");
            o[key] = "hsb(0.1333, 1, 1)";
            r.attr(o);
            expect(val()).to.be("#ffcc00");
            o[key] = "rgba(255, 204, 0, .5)";
            r.attr(o);
            expect(val()).to.be("#ffcc00");
            o[key] = "hsla(0.1333, 1, .5, .5)";
            r.attr(o);
            expect(val()).to.be("#ffcc00");
            o[key] = "hsba(0.1333, 1, 1, .5)";
            r.attr(o);
            expect(val()).to.be("#ffcc00");
        };
    }
    it("sets fill", colorTestProp("fill"));
    it("sets stroke", colorTestStyle("stroke"));
    it("circle core attributes", function () {
        var c = s.circle(10, 20, 30);
        expect(c.node.getAttribute("cx")).to.be("10");
        expect(c.node.getAttribute("cy")).to.be("20");
        expect(c.node.getAttribute("r")).to.be("30");
        c.attr({
            cx: 40,
            cy: 50,
            r: "5%"
        });
        expect(c.node.getAttribute("cx")).to.be("40");
        expect(c.node.getAttribute("cy")).to.be("50");
        expect(c.node.getAttribute("r")).to.be("5%");
    });
    it("rect core attributes", function () {
        var c = s.rect(10, 20, 30, 40);
        expect(c.node.getAttribute("x")).to.be("10");
        expect(c.node.getAttribute("y")).to.be("20");
        expect(c.node.getAttribute("width")).to.be("30");
        expect(c.node.getAttribute("height")).to.be("40");
        c.attr({
            x: 40,
            y: 50,
            width: "5%",
            height: "6%",
            r: 10
        });
        expect(c.node.getAttribute("x")).to.be("40");
        expect(c.node.getAttribute("y")).to.be("50");
        expect(c.node.getAttribute("width")).to.be("5%");
        expect(c.node.getAttribute("height")).to.be("6%");
        expect(c.node.getAttribute("rx")).to.be("10");
        expect(c.node.getAttribute("ry")).to.be("10");
    });
    it("ellipse core attributes", function () {
        var c = s.ellipse(10, 20, 30, 40);
        expect(c.node.getAttribute("cx")).to.be("10");
        expect(c.node.getAttribute("cy")).to.be("20");
        expect(c.node.getAttribute("rx")).to.be("30");
        expect(c.node.getAttribute("ry")).to.be("40");
        c.attr({
            cx: 40,
            cy: 50,
            rx: "5%",
            ry: "6%"
        });
        expect(c.node.getAttribute("cx")).to.be("40");
        expect(c.node.getAttribute("cy")).to.be("50");
        expect(c.node.getAttribute("rx")).to.be("5%");
        expect(c.node.getAttribute("ry")).to.be("6%");
    });
    it("path core attributes", function () {
        var c = s.path("M10,10 110,10");
        expect(c.node.getAttribute("d")).to.be("M10,10 110,10");
        c.attr({d: "M10,10 210,10"});
        expect(c.node.getAttribute("d")).to.be("M10,10 210,10");
        c.attr({path: "M10,10 310,10"});
        expect(c.node.getAttribute("d")).to.be("M10,10 310,10");
    });
    it("text core attributes", function () {
        var c = s.text(10, 15, "testing");
        expect(c.node.getAttribute("x")).to.be("10");
        expect(c.node.getAttribute("y")).to.be("15");
        expect(c.node.textContent).to.be("testing");
        c.attr({
            x: 20,
            y: 25,
            text: "texting"
        });
        expect(c.node.getAttribute("x")).to.be("20");
        expect(c.node.getAttribute("y")).to.be("25");
        expect(c.node.textContent).to.be("texting");
    });
    it("line core attributes", function () {
        var c = s.line(10, 15, 110, 17);
        expect(c.node.getAttribute("x1")).to.be("10");
        expect(c.node.getAttribute("y1")).to.be("15");
        expect(c.node.getAttribute("x2")).to.be("110");
        expect(c.node.getAttribute("y2")).to.be("17");
        c.attr({
            x1: 20,
            y1: 25,
            x2: 220,
            y2: 27
        });
        expect(c.node.getAttribute("x1")).to.be("20");
        expect(c.node.getAttribute("y1")).to.be("25");
        expect(c.node.getAttribute("x2")).to.be("220");
        expect(c.node.getAttribute("y2")).to.be("27");
    });
    it("polyline core attributes", function () {
        var c = s.polyline(10, 15, 20, 25, 30, 35);
        expect(c.node.getAttribute("points")).to.be("10,15,20,25,30,35");
        c.attr({
            points: [20, 25, 30, 35, 40, 45]
        });
        expect(c.node.getAttribute("points")).to.be("20,25,30,35,40,45");
    });
    it("polygon core attributes", function () {
        var c = s.polygon(10, 15, 20, 25, 30, 35);
        expect(c.node.getAttribute("points")).to.be("10,15,20,25,30,35");
        c.attr({
            points: [20, 25, 30, 35, 40, 45]
        });
        expect(c.node.getAttribute("points")).to.be("20,25,30,35,40,45");
    });
});
