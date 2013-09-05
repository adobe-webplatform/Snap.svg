describe("Colours", function () {
    it("parses hex colour", function () {
        expect(Savage.color("#fC0").hex).to.be("#ffcc00");
    });
    it("parses RGB", function () {
        var c = Savage.color("rgb(255, 204, 0)");
        expect(c.hex).to.be("#ffcc00");
        expect(c.r).to.be(255);
        expect(c.g).to.be(204);
        expect(c.b).to.be(0);
    });
    it("parses HSL", function () {
        var c = Savage.color("hsl(0.1333, 1, .5)");
        expect(c.hex).to.be("#ffcc00");
        expect(c.h.toFixed(3)).to.be("0.133");
        expect(c.s).to.be(1);
        expect(c.l).to.be(.5);
    });
    it("parses HSB", function () {
        var c = Savage.color("hsb(0.1333, 1, 1)");
        expect(c.hex).to.be("#ffcc00");
        expect(c.h.toFixed(3)).to.be("0.133");
        expect(c.s).to.be(1);
        expect(c.v).to.be(1);
    });
    it("parses RGBA", function () {
        var c = Savage.color("rgba(255, 204, 0, .75)");
        expect(c.hex).to.be("#ffcc00");
        expect(c.r).to.be(255);
        expect(c.g).to.be(204);
        expect(c.b).to.be(0);
        expect(c.opacity).to.be(.75);
    });
    it("parses HSLA", function () {
        var c = Savage.color("hsla(0.1333, 1, .5, .5)");
        expect(c.hex).to.be("#ffcc00");
        expect(c.r).to.be(255);
        expect(c.g).to.be(204);
        expect(c.b).to.be(0);
        expect(c.opacity).to.be(.5);
    });
    it("parses HSBA", function () {
        var c = Savage.color("hsba(0.1333, 1, 1, .5)");
        expect(c.hex).to.be("#ffcc00");
        expect(c.r).to.be(255);
        expect(c.g).to.be(204);
        expect(c.b).to.be(0);
        expect(c.opacity).to.be(.5);
    });
    it("parses names", function () {
        var c = Savage.color("DodgerBlue");
        expect(c.hex).to.be("#1e90ff");
        c = Savage.color("FireBrick");
        expect(c.hex).to.be("#b22222");
        c = Savage.color("MintCream");
        expect(c.hex).to.be("#f5fffa");
    });
});
