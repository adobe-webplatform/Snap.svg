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
    it("parses RGB - %", function () {
        var c = Savage.color("rgb(100%, 80%, 0%)");
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
    it("parses HSL - %", function () {
        var c = Savage.color("hsl(48%, 100%, 50%)");
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
    it("parses HSB - %", function () {
        var c = Savage.color("hsb(48%, 100%, 100%)");
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
    it("parses to RGB", function() {
        var expectRGB = function(str) {
            var c = Savage.getRGB(str);
            expect(c.hex).to.be("#ffcc00");
            expect(c.r).to.be(255);
            expect(c.g).to.be(204);
            expect(c.b).to.be(0);
            expect(c.error).to.not.be(true);
        };
        
        expectRGB("#fc0");
        expectRGB("#ffcc00");
        expectRGB("rgb(255, 204, 0)");
        expectRGB("rgb(100%, 80%, 0%)");
        expectRGB("hsb(0.1333, 1, 1)");
        expectRGB("hsb(48%, 100%, 100%)");
        expectRGB("hsl(0.1333, 1, .5)");
        expectRGB("hsl(48%, 100%, 50%)");
        expectRGB("rgba(255, 204, 0, .75)");
        expectRGB("hsla(0.1333, 1, .5, .5)");
        expectRGB("hsba(0.1333, 1, 1, .5)");
        var c = Savage.getRGB("DodgerBlue");
        expect(c.hex).to.be("#1e90ff");
        expect(c.r).to.be(30);
        expect(c.g).to.be(144);
        expect(c.b).to.be(255);
        expect(c.error).to.not.be(true);
        c = Savage.getRGB("foobar");
        expect(c.error).to.be(true);
        c = Savage.getRGB("#zzz");
        expect(c.error).to.be(true);
        c = Savage.getRGB("rgb(255)");
        expect(c.error).to.be(true);
        c = Savage.getRGB("hsl(0, 0, 0");
        expect(c.error).to.be(true);
        c = Savage.getRGB("rab(0, 0, 0)");
        expect(c.error).to.be(true);
    });
    it("creates hsb", function() {
        var str = Savage.hsb(0.13333, 1, 1);
        expect(str).to.be("#ffcc00");
        str = Savage.hsb(0, 0.5, 0.5);
        expect(str).to.be("#804040");
    });
    it("creates rgb from hsb", function() {
        var rgb = Savage.hsb2rgb(0.13333, 1, 1);
        expect(rgb.r).to.be(255);
        expect(rgb.g).to.be(204);
        expect(rgb.b).to.be(0);
        expect(rgb.hex).to.be("#ffcc00");
        rgb = Savage.hsb2rgb(0, 0.5, 0.5);
        expect(rgb.r).to.be(128);
        expect(rgb.g).to.be(64);
        expect(rgb.b).to.be(64);
        expect(rgb.hex).to.be("#804040");
    });
    it("creates hsl", function() {
        var str = Savage.hsl(0.13333, 1, 0.5);
        expect(str).to.be("#ffcc00");
        str = Savage.hsl(0, 1, 0.75);
        expect(str).to.be("#ff8080");
    });
    it("creates rgb from hsl", function() {
        var rgb = Savage.hsl2rgb(0.13333, 1, 0.5);
        expect(rgb.r).to.be(255);
        expect(rgb.g).to.be(204);
        expect(rgb.b).to.be(0);
        expect(rgb.hex).to.be("#ffcc00");
        rgb = Savage.hsl2rgb(0, 1, 0.75);
        expect(rgb.r).to.be(255);
        expect(rgb.g).to.be(128);
        expect(rgb.b).to.be(128);
        expect(rgb.hex).to.be("#ff8080");
    });
    it("creates rgb", function() {
        var str = Savage.rgb(255, 204, 0);
        expect(str).to.be("#ffcc00");
        str = Savage.rgb(64, 128, 255);
        expect(str).to.be("#4080ff");
    });
    it("creates hsb from rgb", function() {
        var hsb = Savage.rgb2hsb(255, 204, 0);
        expect(hsb.h.toFixed(3)).to.be("0.133");
        expect(hsb.s).to.be(1);
        expect(hsb.b).to.be(1);
        hsb = Savage.rgb2hsb(128, 64, 64);
        expect(hsb.h).to.be(0);
        expect(hsb.s.toFixed(1)).to.be("0.5");
        expect(hsb.b.toFixed(1)).to.be("0.5");
    });
    it("creates hsl from rgb", function() {
        var hsl = Savage.rgb2hsl(255, 204, 0);
        expect(hsl.h.toFixed(3)).to.be("0.133");
        expect(hsl.s).to.be(1);
        expect(hsl.l).to.be(0.5);
        hsl = Savage.rgb2hsl(255, 128, 128);
        expect(hsl.h).to.be(0);
        expect(hsl.s).to.be(1);
        expect(hsl.l.toFixed(2)).to.be("0.75");
    });
});
