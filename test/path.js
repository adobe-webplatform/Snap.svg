describe("Path methods", function () {
    it("Savage.path.getTotalLength", function () {
        expect(+Savage.path.getTotalLength("M0,0 100,0").toFixed(2)).to.be(100);
    });
    it("Savage.path.getPointAtLength", function () {
        expect(Savage.path.getPointAtLength("M0,0 100,0", 50)).to.eql({
            x: 50,
            y: 0,
            m: {
                x: 25,
                y: 0
            },
            n: {
                x: 75,
                y: 0
            },
            start: {
                x: 0,
                y: 0
            },
            end: {
                x: 100,
                y: 0
            },
            alpha: 180
        });
    });
    it("Savage.path.getSubpath", function () {
        expect(Savage.path.getSubpath("M0,0 100,0", 10, 90)).to.be("M9.995,0C29.153,0,70.839,0,90,0");
        expect(Savage.path.getSubpath("M0,0 100,0", 0, 90)).to.be("M0,0C0,0,64.674,0,90,0");
        expect(Savage.path.getSubpath("M0,0 100,0", 10, 120)).to.be("M10,0C35.326,0,100,0,100,0");
    });
    it("Savage.path.findDotsAtSegment", function () {
        expect(Savage.path.findDotsAtSegment(0,0,0,0,100,0,100,0,.5)).to.eql({
            x: 50,
            y: 0,
            m: {
                x: 25,
                y: 0
            },
            n: {
                x: 75,
                y: 0
            },
            start: {
                x: 0,
                y: 0
            },
            end: {
                x: 100,
                y: 0
            },
            alpha: 180
        });
    });
    it("Savage.path.bezierBBox", function () {
        var bbox = Savage.path.bezierBBox(10, 10, 10, 20, 110, 0, 110, 10);
        expect(bbox.cx).to.be(60);
        expect(bbox.cy).to.be(10);
        expect(bbox.x).to.be(10);
        expect(bbox.w).to.be(100);
        expect(bbox.width).to.be(100);
        expect(bbox.x2).to.be(110);
    });
    it("Savage.path.isPointInsideBBox", function () {
        expect(Savage.path.isPointInsideBBox({x: 0, y: 0, width: 10, height: 10}, 5, 5)).to.be(true);
        expect(Savage.path.isPointInsideBBox({x: 0, y: 0, width: 10, height: 10}, 10, 5)).to.be(true);
        expect(Savage.path.isPointInsideBBox({x: 0, y: 0, width: 10, height: 10}, 10, 10)).to.be(true);
    });
    it("Savage.path.isBBoxIntersect", function () {
        expect(Savage.path.isBBoxIntersect({
                x: 0,
                y: 0,
                width: 10,
                height: 10
            }, {
                x: 5,
                y: 5,
                width: 15,
                height: 15
            })).to.be(true);
        expect(Savage.path.isBBoxIntersect({
                x: 0,
                y: 0,
                width: 10,
                height: 10
            }, {
                x: 5,
                y: 5,
                width: 7,
                height: 7
            })).to.be(true);
        expect(Savage.path.isBBoxIntersect({
                x: 0,
                y: 0,
                width: 10,
                height: 10
            }, {
                x: 15,
                y: 15,
                width: 10,
                height: 10
            })).to.be(false);
    });
});
