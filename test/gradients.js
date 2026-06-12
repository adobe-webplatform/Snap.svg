describe("Gradients", function () {
    var s,
        r;
    beforeEach(function () {
        s = Snap(100, 100);
        r = s.rect(0, 0, 100, 100);
    });
    afterEach(function () {
        s.remove();
    });
    function getGrad(el) {
        if (!el) {
            el = r;
        }
        var id = el.node.getAttribute("fill");
        id = Snap.deurl(id);
        return s.select(id);
    }

    it("creates simple gradient", function () {
        r.attr({fill: "l(0,0,1,0)#fff-#000"});
        var g = getGrad();
        expect(g).to.not.be(null);
        expect(g.stops().length).to.be(2);
        expect(g.stops()[0].attr("stop-color")).to.be("rgb(255, 255, 255)");
    });

    it("creates radial gradient", function () {
        r.attr({fill: "r()#fff-#000"});
        var g = getGrad();
        expect(g).to.not.be(null);
        expect(g.stops().length).to.be(2);
        expect(g.stops()[0].attr("stop-color")).to.be("rgb(255, 255, 255)");
    });

    it("returns gradient for .attr(\"fill\") call", function () {
        r.attr({fill: "l(0,0,1,0)#fff-#fc0:20-#000"});
        var g = getGrad(),
            g2 = r.attr("fill");
        expect(g).to.be(g2);
    });

    it("creates complex gradient", function () {
        r.attr({fill: "l(0,0,1,0)#fff-#fc0:20-#000"});
        var g = getGrad();
        expect(g).to.not.be(null);
        expect(g.stops().length).to.be(3);
        expect(g.stops()[0].attr("stop-color")).to.be("rgb(255, 255, 255)");
        expect(g.stops()[1].attr("offset")).to.be("20%");
    });

    it("updates simple gradient", function () {
        r.attr({fill: "l(0,0,1,0)#fff-#000"});
        var g = getGrad();
        expect(g).to.not.be(null);
        expect(g.stops().length).to.be(2);
        expect(g.stops()[0].attr("stop-color")).to.be("rgb(255, 255, 255)");
        g.setStops("#000-#fff");
        expect(g.stops().length).to.be(2);
        expect(g.stops()[0].attr("stop-color")).to.be("rgb(0, 0, 0)");
        g.setStops("#000-red-#fff");
        expect(g.stops().length).to.be(3);
        expect(g.stops()[1].attr("stop-color")).to.be("rgb(255, 0, 0)");
    });

    it("adds stops to the gradient", function () {
        r.attr({fill: "l(0,0,1,0)#fff-#000"});
        var g = getGrad();
        expect(g).to.not.be(null);
        expect(g.stops().length).to.be(2);
        expect(g.stops()[0].attr("stop-color")).to.be("rgb(255, 255, 255)");
        g.addStop("red", 20);
        expect(g.stops().length).to.be(3);
        expect(g.stops()[1].attr("stop-color")).to.be("rgb(255, 0, 0)");
        expect(g.stops()[1].attr("offset")).to.be("20%");
    });

});
