describe("Attributes += methods", function () {
    var s, r;
    beforeEach(function () {
        s = Snap(100, 100);
        r = s.rect(10, 10, 50, 50);
    });
    afterEach(function () {
        s.remove();
    });
    it("+=10", function () {
        r.attr({x: "+=10"});
        expect(r.node.getAttribute("x")).to.be("20");
    });
    it("-=10", function () {
        r.attr({x: "-=10"});
        expect(r.node.getAttribute("x")).to.be("0");
    });
    it("*=2", function () {
        r.attr({x: "*=2"});
        expect(r.node.getAttribute("x")).to.be("20");
    });
    it("/=2", function () {
        r.attr({x: "/=2"});
        expect(r.node.getAttribute("x")).to.be("5");
    });
    it("+=1em", function () {
        var em = s.rect(0, 0, "1em", "1em");
        em = em.getBBox().w;
        r.attr({x: "+=1em"});
        expect(r.node.getAttribute("x")).to.eql(10 + em);
    });
    it("-=.3em", function () {
        var em = s.rect(0, 0, "1em", "1em");
        em = em.getBBox().w;
        r.attr({x: "-=.3em"});
        expect((+r.node.getAttribute("x")).toFixed(2)).to.eql((10 - em  * .3).toFixed(2));
    });
});
