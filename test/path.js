describe("Path methods", function () {
    it("Snap.path.getTotalLength", function () {
        expect(+Snap.path.getTotalLength("M0,0 100,0").toFixed(2)).to.be(100);
    });
    it("Snap.path.getPointAtLength", function () {
        expect(Snap.path.getPointAtLength("M0,0 100,0", 50)).to.eql({
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
    it("Snap.path.getSubpath", function () {
        expect(Snap.path.getSubpath("M0,0 100,0", 10, 90)).to.be("M9.995,0C29.153,0,70.839,0,90,0");
        expect(Snap.path.getSubpath("M0,0 100,0", 0, 90)).to.be("M0,0C0,0,64.674,0,90,0");
        expect(Snap.path.getSubpath("M0,0 100,0", 10, 120)).to.be("M10,0C35.326,0,100,0,100,0");
    });
    it("Snap.path.findDotsAtSegment", function () {
        expect(Snap.path.findDotsAtSegment(0,0,0,0,100,0,100,0,.5)).to.eql({
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
    it("Snap.path.bezierBBox - params", function () {
        var bbox = Snap.path.bezierBBox(10, 10, 10, 20, 110, 0, 110, 10);
        expect(bbox.cx).to.be(60);
        expect(bbox.cy).to.be(10);
        expect(bbox.x).to.be(10);
        expect(bbox.w).to.be(100);
        expect(bbox.width).to.be(100);
        expect(bbox.x2).to.be(110);
    });
    it("Snap.path.bezierBBox - array", function () {
        var bbox = Snap.path.bezierBBox([10, 10, 10, 20, 110, 0, 110, 10]);
        expect(bbox.cx).to.be(60);
        expect(bbox.cy).to.be(10);
        expect(bbox.x).to.be(10);
        expect(bbox.w).to.be(100);
        expect(bbox.width).to.be(100);
        expect(bbox.x2).to.be(110);
    });
    it("Snap.path.getBBox", function() {
        // same as 10,20,30,40 rect
        var bbox = Snap.path.getBBox("M10,20h30v40h-30z");
        expect(bbox.x).to.eql(10);
        expect(bbox.y).to.eql(20);
        expect(bbox.width).to.eql(30);
        expect(bbox.height).to.eql(40);
        expect(bbox.x2).to.eql(10 + 30);
        expect(bbox.y2).to.eql(20 + 40);
    });
    it("Snap.path.isPointInsideBBox", function () {
        expect(Snap.path.isPointInsideBBox({x: 0, y: 0, width: 10, height: 10}, 5, 5)).to.be(true);
        expect(Snap.path.isPointInsideBBox({x: 0, y: 0, width: 10, height: 10}, 10, 5)).to.be(true);
        expect(Snap.path.isPointInsideBBox({x: 0, y: 0, width: 10, height: 10}, 10, 10)).to.be(true);
    });
    it("Snap.path.isBBoxIntersect", function () {
        expect(Snap.path.isBBoxIntersect({
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
        expect(Snap.path.isBBoxIntersect({
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
        expect(Snap.path.isBBoxIntersect({
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
    it("Snap.path.toAbsolute", function() {
        var relPath = "M 10 10" +
                        "h 40" +
                        "v 30" +
                        "h -40" +
                        "l 0 -30" +
                        "m 0 40" +
                        "l 30 0" +
                        "l 0 40" +
                        "l -30 0" +
                        "m 0 10" +
                        "c 20 20 40 20 40 0" +
                        "m -40 40" +
                        "c 10 -25 20 -25 30 0" +
                        "s 10 25 20 0" +
                        "m 20 -130" +
                        "q 30 30 60 0" +
                        "m -60 40" +
                        "q 10 20 20 0" +
                        "t 20 0" +
                        "m -40 30" +
                        "a 10 10 0 0 0 40 0";
        var absPath = Snap.path.toAbsolute(relPath);
        var i = 0;
        var checkNext = function(arr) {
            expect(absPath[i++]).to.eql(arr);
        }
        checkNext(['M', 10, 10]);
        checkNext(['H', 50]);
        checkNext(['V', 40]);
        checkNext(['H', 10]);
        checkNext(['L', 10, 10]);
        checkNext(['M', 10, 50]);
        checkNext(['L', 40, 50]);
        checkNext(['L', 40, 90]);
        checkNext(['L', 10, 90]);
        checkNext(['M', 10, 100]);
        checkNext(['C', 30, 120, 50, 120, 50, 100]);
        checkNext(['M', 10, 140]);
        checkNext(['C', 20, 115, 30, 115, 40, 140]);
        checkNext(['S', 50, 165, 60, 140]);
        checkNext(['M', 80, 10]);
        checkNext(['Q', 110, 40, 140, 10]);
        checkNext(['M', 80, 50]);
        checkNext(['Q', 90, 70, 100, 50]);
        checkNext(['T', 120, 50]);
        checkNext(['M', 80, 80]);
        checkNext(['A', 10, 10, 0, 0, 0, 120, 80]);
    });
    it("Snap.path.toRelative", function() {
        var absPath = "M10 10 H 50 V 40 H 10 L 10 10" +
                    "M10 50 L 40 50 L 40 90 L 10 90" +
                    "M10 100 C 30 120, 50 120, 50 100" +
                    "M10 140 C 20 115, 30, 115, 40 140 S 50 165, 60 140" +
                    "M80 10 Q 110 40, 140 10" +
                    "M80 50 Q 90 70, 100 50 T 120 50" +
                    "M80 80 A 10 10 0 0 0 120 80";
        var relPath = Snap.path.toRelative(absPath);
        var i = 0;
        var checkNext = function(arr) {
            expect(relPath[i++]).to.eql(arr);
        }
        
        checkNext(['M', 10, 10]);
        checkNext(['h', 40]);
        checkNext(['v', 30]);
        checkNext(['h', -40]);
        checkNext(['l', 0, -30]);
        checkNext(['m', 0, 40]);
        checkNext(['l', 30, 0]);
        checkNext(['l', 0, 40]);
        checkNext(['l', -30, 0]);
        checkNext(['m', 0, 10]);
        checkNext(['c', 20, 20, 40, 20, 40, 0]);
        checkNext(['m', -40, 40]);
        checkNext(['c', 10, -25, 20, -25, 30, 0]);
        checkNext(['s', 10, 25, 20, 0]);
        checkNext(['m', 20, -130]);
        checkNext(['q', 30, 30, 60, 0]);
        checkNext(['m', -60, 40]);
        checkNext(['q', 10, 20, 20, 0]);
        checkNext(['t', 20, 0]);
        checkNext(['m', -40, 30]);
        checkNext(['a', 10, 10, 0, 0, 0, 40, 0]);
    });
    it("Snap.path.toCubic", function() {
        var absPath = "M10 10 H 50 V 40 H 10 L 10 10" +
                    "M10 50 L 40 50 L 40 90 L 10 90" +
                    "M10 100 C 30 120, 50 120, 50 100" +
                    "M10 140 C 20 115, 30, 115, 40 140 S 50 165, 60 140" +
                    "M80 10 Q 110 40, 140 10" +
                    "M80 50 Q 90 70, 100 50 T 120 50" +
                    "M80 80 A 10 10 0 0 0 120 80";
        var relPath = "M 10 10" +
                        "h 40" +
                        "v 30" +
                        "h -40" +
                        "l 0 -30" +
                        "m 0 40" +
                        "l 30 0" +
                        "l 0 40" +
                        "l -30 0" +
                        "m 0 10" +
                        "c 20 20 40 20 40 0" +
                        "m -40 40" +
                        "c 10 -25 20 -25 30 0" +
                        "s 10 25 20 0" +
                        "m 20 -130" +
                        "q 30 30 60 0" +
                        "m -60 40" +
                        "q 10 20 20 0" +
                        "t 20 0" +
                        "m -40 30" +
                        "a 10 10 0 0 0 40 0";
        var cubicPathFromAbs = Snap.path.toCubic(absPath);
        var cubicPathFromRel = Snap.path.toCubic(relPath);
        var i = 0;
        var checkNext = function(arr) {
            expect(cubicPathFromAbs[i]).to.eql(arr);
            expect(cubicPathFromRel[i]).to.eql(arr);
            i++;
        }       
        
        checkNext(['M', 10, 10]);
        checkNext(['C', 10, 10, 50, 10, 50, 10]);
        checkNext(['C', 50, 10, 50, 40, 50, 40]);
        checkNext(['C', 50, 40, 10, 40, 10, 40]);
        checkNext(['C', 10, 40, 10, 10, 10, 10]);
        checkNext(['M', 10, 50]);
        checkNext(['C', 10, 50, 40, 50, 40, 50]);
        checkNext(['C', 40, 50, 40, 90, 40, 90]);
        checkNext(['C', 40, 90, 10, 90, 10, 90]);
        checkNext(['M', 10, 100]);
        checkNext(['C', 30, 120, 50, 120, 50, 100]);
        checkNext(['M', 10, 140]);
        checkNext(['C', 20, 115, 30, 115, 40, 140]);
        checkNext(['C', 50, 165, 50, 165, 60, 140]);
        checkNext(['M', 80, 10]);
        checkNext(['C', 100, 29.999999999999996, 120, 29.999999999999996, 140, 10]);
        checkNext(['M', 80, 50]);
        checkNext(['C', 86.66666666666666, 63.33333333333333, 93.33333333333333, 63.33333333333333, 100, 50]);
        checkNext(['C', 106.66666666666666, 36.666666666666664, 113.33333333333333, 36.666666666666664, 120, 50]);
        checkNext(['M', 80, 80]);
        checkNext(['C', 80, 95.39600717839002, 96.66666666666667, 105.01851166488379, 110, 97.32050807568878]);
        checkNext(['C', 116.18802153517007, 93.74785217660714, 120, 87.14531179816328, 120, 80]);
        
    });
    it("Snap.path.map", function() {
        var absPath = "M10 10 H 50 V 40 H 10 L 10 10" +
                    "M10 50 L 40 50 L 40 90 L 10 90" +
                    "M10 100 C 30 120, 50 120, 50 100" +
                    "M10 140 C 20 115, 30, 115, 40 140 S 50 165, 60 140" +
                    "M80 10 Q 110 40, 140 10" +
                    "M80 50 Q 90 70, 100 50 T 120 50" +
                    "M80 80 A 10 10 0 0 0 120 80";
        var matrix = new Snap.Matrix(1, 0, 0, 1, 1000, 0);
        var transformedPath = Snap.path.map(absPath, matrix);
        
        var i = 0;
        var checkNext = function(arr) {
            expect(transformedPath[i++]).to.eql(arr);
        }
        checkNext(['M', 1010, 10]);
        checkNext(['C', 1010, 10, 1050, 10, 1050, 10]);
        checkNext(['C', 1050, 10, 1050, 40, 1050, 40]);
        checkNext(['C', 1050, 40, 1010, 40, 1010, 40]);
        checkNext(['C', 1010, 40, 1010, 10, 1010, 10]);
        checkNext(['M', 1010, 50]);
        checkNext(['C', 1010, 50, 1040, 50, 1040, 50]);
        checkNext(['C', 1040, 50, 1040, 90, 1040, 90]);
        checkNext(['C', 1040, 90, 1010, 90, 1010, 90]);
        checkNext(['M', 1010, 100]);
        checkNext(['C', 1030, 120, 1050, 120, 1050, 100]);
        checkNext(['M', 1010, 140]);
        checkNext(['C', 1020, 115, 1030, 115, 1040, 140]);
        checkNext(['C', 1050, 165, 1050, 165, 1060, 140]);
        checkNext(['M', 1080, 10]);
        checkNext(['C', 1100, 29.999999999999996, 1120, 29.999999999999996, 1140, 10]);
        checkNext(['M', 1080, 50]);
        checkNext(['C', 1086.66666666666666, 63.33333333333333, 1093.33333333333333, 63.33333333333333, 1100, 50]);
        checkNext(['C', 1106.66666666666666, 36.666666666666664, 1113.33333333333333, 36.666666666666664, 1120, 50]);
        checkNext(['M', 1080, 80]);
        checkNext(['C', 1080, 95.39600717839002, 1096.66666666666667, 105.01851166488379, 1110, 97.32050807568878]);
        checkNext(['C', 1116.18802153517007, 93.74785217660714, 1120, 87.14531179816328, 1120, 80]);
    });
    it("Snap.path.isPointInside", function () {
        var path = "M10 10 H 50 V 40 H 10 L 10 10 Z" +
            "M10 50 L 40 50 L 40 90 L 10 90 Z" +
            "M10 100 C 30 120, 50 120, 50 100 Z" +
            "M10 140 C 20 115, 30, 115, 40 140 S 50 165, 60 140 Z" +
            "M80 10 Q 110 40, 140 10 Z" +
            "M80 50 Q 90 70, 100 50 T 120 50 Z" +
            "M80 80 A 10 10 0 0 0 120 80 Z";

        expect(Snap.path.isPointInside(path, 15, 35)).to.be(true);
        expect(Snap.path.isPointInside(path, 35, 75)).to.be(true);
        expect(Snap.path.isPointInside(path, 15, 102)).to.be(true);
        expect(Snap.path.isPointInside(path, 15, 135)).to.be(true);
        expect(Snap.path.isPointInside(path, 50, 145)).to.be(true);
        expect(Snap.path.isPointInside(path, 130, 15)).to.be(true);
        expect(Snap.path.isPointInside(path, 110, 45)).to.be(true);
        expect(Snap.path.isPointInside(path, 85, 55)).to.be(true);
        expect(Snap.path.isPointInside(path, 115, 82)).to.be(true);
        expect(Snap.path.isPointInside(path, 95, 98)).to.be(true);
        
        expect(Snap.path.isPointInside(path, 5, 5)).to.be(false);
        expect(Snap.path.isPointInside(path, 25, 48)).to.be(false);
        expect(Snap.path.isPointInside(path, 42, 87)).to.be(false);
        expect(Snap.path.isPointInside(path, 12, 105)).to.be(false);
        expect(Snap.path.isPointInside(path, 47, 113)).to.be(false);
        expect(Snap.path.isPointInside(path, 47, 135)).to.be(false);
        expect(Snap.path.isPointInside(path, 25, 142)).to.be(false);
        expect(Snap.path.isPointInside(path, 15, 125)).to.be(false);
        expect(Snap.path.isPointInside(path, 43, 152)).to.be(false);
        expect(Snap.path.isPointInside(path, 58, 152)).to.be(false);
        expect(Snap.path.isPointInside(path, 90, 21)).to.be(false);
        expect(Snap.path.isPointInside(path, 130, 21)).to.be(false);
        expect(Snap.path.isPointInside(path, 95, 48)).to.be(false);
        expect(Snap.path.isPointInside(path, 110, 55)).to.be(false);
        expect(Snap.path.isPointInside(path, 100, 70)).to.be(false);
        expect(Snap.path.isPointInside(path, 115, 96)).to.be(false);
        expect(Snap.path.isPointInside(path, 85, 96)).to.be(false);

        // bug #248
        expect(Snap.path.isPointInside("M1.4315332974182866,4.405806462382467 L57.26133189673147,176.23225849529868 A185.30156250000002,185.30156250000002 0 0 1 -172.2890356108522,-68.21405480708441 L-4.307225890271305,-1.7053513701771101 A4.6325390625,4.6325390625 0 0 0 1.4315332974182866,4.405806462382467 Z", -58.296875, 70.96875)).to.be(true);
    });
    
    it("Snap.path.intersection", function () {
        var path1 = "M10 10 H 50 V 40 H 10 L 10 10 Z" +
            "M10 50 L 40 50 L 40 90 L 10 90 Z" +
            "M10 100 C 30 120, 50 120, 50 100 Z" +
            "M10 140 C 20 115, 30, 115, 40 140 S 50 165, 60 140 Z" +
            "M80 10 Q 110 40, 140 10 Z" +
            "M80 50 Q 90 70, 100 50 T 120 50 Z" +
            "M80 80 A 10 10 0 0 0 120 80 Z";
        var path2 = "M10,0 L80,200 L20, 200 L30, 0 L110, 15 L90, 150";
        var intersection = Snap.path.intersection(path1, path2);
        expect(intersection.length).to.be(22);
        var first = intersection[0];
        expect(first.x).to.be.a('number');
        expect(first.y).to.be.a('number');
        expect(first.t1).to.be.a('number');
        expect(first.t2).to.be.a('number');
        expect(first.segment1).to.be.a('number');
        expect(first.segment2).to.be.a('number');
        expect(first.bez1).to.be.an('array');
        expect(first.bez2).to.be.an('array');
        
        var checkXY = function(index, x, y) {
            expect(+intersection[index].x.toFixed(2)).to.be(x);
            expect(+intersection[index].y.toFixed(2)).to.be(y);
        }
        
        checkXY(0, 13.5, 10);
        checkXY(1, 29.5, 10);
        checkXY(2, 24, 40);
        checkXY(3, 28, 40);
        checkXY(4, 27.5, 50);
        checkXY(5, 27.5, 50);
        checkXY(6, 40, 85.71);
        checkXY(7, 25.5, 90);
        checkXY(8, 48.06, 108.75);
        checkXY(9, 24.46, 110.77);
        checkXY(10, 45, 100);
        checkXY(11, 25, 100);
        checkXY(12, 23.91, 121.7);
        checkXY(13, 59.46, 141.31);
        checkXY(14, 59, 140);
        checkXY(15, 23, 140);
        checkXY(16, 108.55, 24.82);
        checkXY(17, 83.33, 10);
        checkXY(18, 106, 42);
        checkXY(19, 104.81, 50);
        checkXY(20, 97.49, 99.44);
        checkXY(21, 100.37, 80);
    });
});
