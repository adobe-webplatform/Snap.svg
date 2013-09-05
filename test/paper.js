describe("Check for Paper Creation", function () {
    it("creates simple paper 20 × 10", function () {
        var s = Savage(20, 10);
        var S = s.node;
        expect(S).to.not.be(null);
        expect(S.getAttribute("width")).to.be("20");
        expect(S.getAttribute("height")).to.be("10");
        s.remove();
    });
    it("removal of paper", function () {
        var s = Savage(20, 10);
        var S = s.node;
        expect(S).to.not.be(null);
        s.remove();
        S = document.querySelectorAll("svg").length;
        expect(S).to.be(1);
    });
    it("creates simple paper 20% × 10em", function () {
        var s = Savage("20%", "10em");
        var S = s.node;
        expect(S).to.not.be(null);
        expect(S.getAttribute("width")).to.be("20%");
        expect(S.getAttribute("height")).to.be("10em");
        s.remove();
    });
    it("converts existing SVG element to paper", function () {
        var S = document.getElementById("svgroot");
        var s = Savage(S);
        expect(document.querySelector("#svgroot circle")).to.be(null);
        var c = s.circle(10, 20, 5);
        expect(document.querySelectorAll("#svgroot circle").length).to.be(1);
        c.remove();
    });
    it("converts existing SVG element to paper (as query)", function () {
        var S = document.getElementById("svgroot");
        var s = Savage("#svgroot");
        expect(document.querySelector("#svgroot circle")).to.be(null);
        var c = s.circle(10, 20, 5);
        expect(document.querySelectorAll("#svgroot circle").length).to.be(1);
        c.remove();
    });
});
