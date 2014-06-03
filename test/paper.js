describe("Check for Paper Creation", function () {
    it("creates simple paper 20 × 10", function () {
        var s = Snap(20, 10);
        var S = s.node;
        expect(S).to.not.be(null);
        expect(S.getAttribute("width")).to.be("20");
        expect(S.getAttribute("height")).to.be("10");
        s.remove();
    });
    it("removal of paper", function () {
        var s = Snap(20, 10);
        var S = s.node;
        expect(S).to.not.be(null);
        s.remove();
        S = document.querySelectorAll("svg").length;
        expect(S).to.be(1);
    });
    it("creates simple paper 20% × 10em", function () {
        var s = Snap("20%", "10em");
        var S = s.node;
        expect(S).to.not.be(null);
        expect(S.getAttribute("width")).to.be("20%");
        expect(S.getAttribute("height")).to.be("10em");
        s.remove();
    });
    it("converts existing SVG element to paper", function () {
        var S = document.getElementById("svgroot");
        var s = Snap(S);
        expect(document.querySelector("#svgroot circle")).to.be(null);
        var c = s.circle(10, 20, 5);
        expect(document.querySelectorAll("#svgroot circle").length).to.be(1);
        c.remove();
    });
    it("converts existing SVG element to paper (as query)", function () {
        var S = document.getElementById("svgroot");
        var s = Snap("#svgroot");
        expect(document.querySelector("#svgroot circle")).to.be(null);
        var c = s.circle(10, 20, 5);
        expect(document.querySelectorAll("#svgroot circle").length).to.be(1);
        c.remove();
    });
});

describe("Paper methods", function () {
    /*
        Paper.el
        Paper.filter
        Paper.gradient
        Paper.image
        Paper.toString
    */
    var paper;
    beforeEach(function () {
        paper = Snap(100, 100);
    });
    afterEach(function () {
        paper.remove();
    });

    it("Paper.svg", function() {
        var c = paper.svg();
        expect(c.node.nodeName).to.be("svg");
        expect(c.node.parentNode).to.be(paper.node);
    });
    it("Paper.svg(x, y)", function() {
        var c = paper.svg(100, 200);
        expect(c.node.nodeName).to.be("svg");
        expect(c.node.x.baseVal.value).to.be(100);
        expect(c.node.y.baseVal.value).to.be(200);
        expect(c.node.parentNode).to.be(paper.node);
    });
    it("Paper.svg(x, y, w, h, viewbox)", function() {
        var c = paper.svg(100, 200, 300, 400, 10, 20, 30, 40);
        expect(c.node.nodeName).to.be("svg");
        expect(c.node.x.baseVal.value).to.be(100);
        expect(c.node.y.baseVal.value).to.be(200);
        expect(c.node.width.baseVal.value).to.be(300);
        expect(c.node.height.baseVal.value).to.be(400);
        expect(c.node.getAttribute("viewBox")).to.be("10 20 30 40");
        expect(c.node.parentNode).to.be(paper.node);
    });
    it("Paper.el", function() {
        var c = paper.el("circle");
        expect(c.node.nodeName).to.be("circle");
        expect(c.node.parentNode).to.be(paper.node);
    });
    it("Paper.filter", function() {
        var filter = paper.filter('<feGaussianBlur stdDeviation="2"/>');
        expect(filter.node.nodeName).to.be('filter');
        var child = filter.node.firstChild;
        expect(child).to.be.ok();
        expect(child.nodeName).to.be('feGaussianBlur');
        expect(child.getAttribute("stdDeviation")).to.be('2');
    });
    it("Paper.gradient - linear", function() {
        var gradient = paper.gradient("l(0, 0, 1, 1)#000-#f00-#fff");
        expect(gradient.node.nodeName).to.be('linearGradient');
        expect(gradient.node.getAttribute('x1')).to.be("0");
        expect(gradient.node.getAttribute('y1')).to.be("0");
        expect(gradient.node.getAttribute('x2')).to.be("1");
        expect(gradient.node.getAttribute('y2')).to.be("1");
        var stops = gradient.node.querySelectorAll("stop");
        expect(stops.length).to.be(3);
    });
    it("Paper.gradient - radial", function() {
        var gradient = paper.gradient("r(0.3, 0.4, 0.5)#000-#fff");
        expect(gradient.node.nodeName).to.be('radialGradient');
        expect(gradient.node.getAttribute('cx')).to.be("0.3");
        expect(gradient.node.getAttribute('cy')).to.be("0.4");
        expect(gradient.node.getAttribute('r')).to.be("0.5");
        var stops = gradient.node.querySelectorAll("stop");
        expect(stops.length).to.be(2);
    });
    it("Paper.image", function() {
        var image = paper.image('#', 10, 20, 30, 40);
        var img = document.querySelector("image");
        expect(img).to.not.be(null);
        expect(img.getAttribute("x")).to.be("10");
        expect(img.getAttribute("y")).to.be("20");
        expect(img.getAttribute("width")).to.be("30");
        expect(img.getAttribute("height")).to.be("40");
    });
    it("Paper.toString", function() {
        paper.circle(10, 20, 30);
        var str = paper.toString();
        expect(str).to.match(/.*?<svg.*?>.*?<circle.*?<\/svg>/);
    });
    it("Paper.getBBox", function() {
        paper.circle(50, 50, 30);
        var bb = paper.getBBox();
        expect(bb.x).to.be(20);
        expect(bb.y).to.be(20);
        expect(bb.width).to.be(60);
        expect(bb.height).to.be(60);
    });
});