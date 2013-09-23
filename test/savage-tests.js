describe("Savage methods", function () {
    it("Savage.Matrix - six params", function () {
        var matrix = new Savage.Matrix(1, 2, 3, 4, 5, 6);
        expect(matrix).to.eql({
            a: 1,
            b: 2,
            c: 3,
            d: 4,
            e: 5,
            f: 6
        });
    });
    it("Savage.Matrix - SVGMatrix param", function () {
        var svgMatrix = new Savage(10, 10).node.createSVGMatrix();
        var matrix = new Savage.Matrix(svgMatrix);
        expect(matrix).to.eql({
            a: 1,
            b: 0,
            c: 0,
            d: 1,
            e: 0,
            f: 0
        });
    });
    it("Savage.ajax - no postData", function(done) {
        var xhr = Savage.ajax('./res/file-for-ajax.txt', function(xhr) {
            var responseText = xhr.responseText;
            expect(responseText).to.be('success');
            expect(this.isContext).to.be(true);
            done();
        }, {'isContext': true});
        expect(xhr).to.be.an('object');
    });
    it("Savage.ajax - with object postData", function(done) {
        var xhr = Savage.ajax('./res/file-for-ajax.txt', {foo: 'bar'}, function(xhr) {
            var responseText = xhr.responseText;
            expect(responseText).to.be('success');
            expect(this.isContext).to.be(true);
            done();
        }, {'isContext': true});
        expect(xhr).to.be.an('object');
    });
    it("Savage.ajax - with string postData", function(done) {
        var xhr = Savage.ajax('./res/file-for-ajax.txt', 'foo=bar', function(xhr) {
            var responseText = xhr.responseText;
            expect(responseText).to.be('success');
            expect(this.isContext).to.be(true);
            done();
        }, {'isContext': true});
        expect(xhr).to.be.an('object');
    });
    
    var validateMina = function(minaObj) {
        expect(minaObj).to.be.an('object');
        expect(minaObj.id).to.be.a('string');
        expect(minaObj.duration).to.be.a('function');
        expect(minaObj.easing).to.be.a('function');
        expect(minaObj.speed).to.be.a('function');
        expect(minaObj.status).to.be.a('function');
        expect(minaObj.stop).to.be.a('function');
    };
    
    it("Savage.animate - numbers, no easing or callback", function(done) {
        var n;
        var minaObj = Savage.animate(10, 20, function(newN) { n = newN; }, 50);
        setTimeout(function() {
            expect(n).to.be(20);
            done();
        }, 100);
        validateMina(minaObj);
    });
   it("Savage.animate - numbers, callback", function(done) {
        var n;
        var minaObj = Savage.animate(10, 20, function(newN) { n = newN; }, 50, function() {
            expect(n).to.be(20);
            done();
        });
        validateMina(minaObj);
    });
   it("Savage.animate - numbers, easing", function(done) {
        var n;
        var minaObj = Savage.animate(10, 20, function(newN) { n = newN; }, 50, mina.easeinout);
        setTimeout(function() {
            expect(n).to.be(20);
            done();
        }, 100);
        validateMina(minaObj);
    });
   it("Savage.animate - numbers, easing & callback", function(done) {
        var n;
        var minaObj = Savage.animate(10, 20, function(newN) { n = newN; }, 50, mina.bounce, function() {
            expect(n).to.be(20);
            done();
        });
        validateMina(minaObj);
    });
    it("Savage.animate - arrays, no easing or callback", function(done) {
        var n1, n2;
        var minaObj = Savage.animate([5, 10], [10, 20], function(nArr) {  n1 = nArr[0]; n2 = nArr[1]; }, 50);
        setTimeout(function() {
            expect(n1).to.be(10);
            expect(n2).to.be(20);
            done();
        }, 100);
        validateMina(minaObj);
    });
   it("Savage.animate - arrays, callback", function(done) {
        var n1, n2;
        var minaObj = Savage.animate([5, 10], [10, 20], function(nArr) {n1 = nArr[0]; n2 = nArr[1]; }, 50, function() {
            expect(n1).to.be(10);
            expect(n2).to.be(20);
            done();
        });
        validateMina(minaObj);
    });
   it("Savage.animate - arrays, easing", function(done) {
        var n1, n2;
        var minaObj = Savage.animate([5, 10], [10, 20], function(nArr) { n1 = nArr[0]; n2 = nArr[1]; }, 50, mina.easeinout);
        setTimeout(function() {
            expect(n1).to.be(10);
            expect(n2).to.be(20);
            done();
        }, 100);
        validateMina(minaObj);
    });
    it("Savage.animate - arrays, easing & callback", function(done) {
        var n1, n2;
        var minaObj = Savage.animate([5, 10], [10, 20], function(nArr) { n1 = nArr[0]; n2 = nArr[1]; }, 50, mina.backin, function() {
            expect(n1).to.be(10);
            expect(n2).to.be(20);
            done();
        });
        validateMina(minaObj);
    });
    it("Savage.animation - no easing or callback", function() {
        var anim = Savage.animation({ foo: "bar" }, 100);
        expect(anim).to.be.an("object");
        expect(anim.dur).to.be(100);
        expect(anim.attr.foo).to.be("bar");
    });
    it("Savage.animation - with easing", function() {
        var anim = Savage.animation({ foo: "bar" }, 100, mina.easein);
        expect(anim).to.be.an("object");
        expect(anim.dur).to.be(100);
        expect(anim.attr.foo).to.be("bar");
        expect(anim.easing).to.be.a("function");
    });
    it("Savage.animation - with callback", function() {
        var cb = function(){};
        var anim = Savage.animation({ foo: "bar" }, 100, cb);
        expect(anim).to.be.an("object");
        expect(anim.dur).to.be(100);
        expect(anim.attr.foo).to.be("bar");
        expect(anim.callback).to.be.a("function");
    });
    it("Savage.animation - with easing & callback", function() {
        var cb = function(){};
        var anim = Savage.animation({ foo: "bar" }, 100, mina.linear, cb);
        expect(anim).to.be.an("object");
        expect(anim.dur).to.be(100);
        expect(anim.attr.foo).to.be("bar");
        expect(anim.easing).to.be.a("function");
        expect(anim.callback).to.be.a("function");
        expect(anim.easing).to.not.be(anim.callback);
    });
    it("Savage.deg", function() {
        expect(Savage.deg(Math.PI)).to.be(180);
        expect(Savage.deg(Math.PI / 2)).to.be(90);
        expect(Savage.deg(Math.PI / 4)).to.be(45);
        expect(Savage.deg(Math.PI * 2)).to.be(0);
    });
    it("Savage.rad", function() {
        expect(Savage.rad(180)).to.be(Math.PI);
        expect(Savage.rad(90)).to.be(Math.PI / 2);
        expect(Savage.rad(45)).to.be(Math.PI / 4);
        expect(Savage.rad(0)).to.be(0);
    });
    it("Savage.format", function() {
        var outputStr;
        outputStr = Savage.format("{x}", {x: 1});
        expect(outputStr).to.be("1");
        outputStr = Savage.format("{a['foo']}", {
            a: {
                foo: 'bar'
            }
        });
        expect(outputStr).to.be("bar");
        outputStr = Savage.format("M{x},{y}h{dim.width}v{dim.height}h{dim['negative width']}z", {
            x: 10,
            y: 20,
            dim: {
                width: 40,
                height: 50,
                "negative width": -40
            }
        });
        expect(outputStr).to.be("M10,20h40v50h-40z");
    });
    it("Savage.fragment", function() {
        var frag = Savage.fragment('<g class="foo"></g>', '<g class="foo2"></g>');
        expect(frag).to.be.an("object");
        expect(frag.node.childNodes.length).to.be(2);
        expect(frag.node.firstChild.nodeName).to.be("g");
        expect(frag.node.firstChild.getAttribute("class")).to.be("foo");
        expect(frag.node.lastChild.getAttribute("class")).to.be("foo2");
        frag = Savage.fragment('<g class="foo"><rect x="0" y="0" width="10" height="10"/></g>');
        var rectWidth = frag.select('rect').attr('width');
        expect(rectWidth).to.be("10");
    });
    it("Savage.is", function() {
        var undef;
        expect(Savage.is("foo", "string")).to.be.ok();
        expect(Savage.is(123, "number")).to.be.ok();
        expect(Savage.is({}, "object")).to.be.ok();
        expect(Savage.is([], "array")).to.be.ok();
        expect(Savage.is([], "object")).to.be.ok();
        expect(Savage.is(null, "null")).to.be.ok();
        expect(Savage.is(false, "boolean")).to.be.ok();
        expect(Savage.is(undef, "undefined")).to.be.ok();
        expect(Savage.is(function(){}, "function")).to.be.ok();
        expect(Savage.is(function(){}, "object")).to.be.ok();
    });
    it("Savage.load - with context", function(done) {
        Savage.load('./res/external-svg.svg', function(fragment) {
            expect(fragment.node.querySelector("svg")).to.not.be(null);
            expect(this.myContext).to.be(true);
            done();
        }, {myContext: true});
    });
    it("Savage.load - without context", function(done) {
        Savage.load('./res/external-svg.svg', function(fragment) {
            expect(fragment.node.querySelector("svg")).to.not.be(null);
            done();
        });
    });
    it("Savage.parse", function() {
        var frag = Savage.parse('<g class="foo"></g>');
        expect(frag).to.be.an("object");
        expect(frag.node.childNodes.length).to.be(1);
        expect(frag.node.firstChild.nodeName).to.be("g");
        expect(frag.node.firstChild.getAttribute("class")).to.be("foo");
        frag = Savage.parse('<g class="foo"><rect x="0" y="0" width="10" height="10"/></g>');
        var rectWidth = frag.select('rect').attr('width');
        expect(rectWidth).to.be("10");
    });
    it("Savage.parsePathString - string", function() {
        var pathArrs = Savage.parsePathString(
            "M1 2" +
            "m3 4" +
            "L 5, 6" +
            "l 7, 8" +
            "H 9" +
            "h 10" +
            "V 11" +
            "v 12" +
            "C 13 14, 15 16, 17 18" +
            "c 19 20, 21 22, 23 24" +
            "S 25 26, 27 28" +
            "s 29 30, 31 32" +
            "Q 33 34, 35 36" +
            "q 37 38, 39 40" +
            "T 41 42" +
            "t 43 44" +
            "A 45 46 47 0 1 48 49" +
            "a 50 51 52 1 0 53 54" +
            "Z");
        expect(pathArrs[0]).to.eql(["M", 1, 2]);
        expect(pathArrs[1]).to.eql(["m", 3, 4]);
        expect(pathArrs[2]).to.eql(["L", 5, 6]);
        expect(pathArrs[3]).to.eql(["l", 7, 8]);
        expect(pathArrs[4]).to.eql(["H", 9]);
        expect(pathArrs[5]).to.eql(["h", 10]);
        expect(pathArrs[6]).to.eql(["V", 11]);
        expect(pathArrs[7]).to.eql(["v", 12]);
        expect(pathArrs[8]).to.eql(["C", 13, 14, 15, 16, 17, 18]);
        expect(pathArrs[9]).to.eql(["c", 19, 20, 21, 22, 23, 24]);
        expect(pathArrs[10]).to.eql(["S", 25, 26, 27, 28]);
        expect(pathArrs[11]).to.eql(["s", 29, 30, 31, 32]);
        expect(pathArrs[12]).to.eql(["Q", 33, 34, 35, 36]);
        expect(pathArrs[13]).to.eql(["q", 37, 38, 39, 40]);
        expect(pathArrs[14]).to.eql(["T", 41, 42]);
        expect(pathArrs[15]).to.eql(["t", 43, 44]);
        expect(pathArrs[16]).to.eql(["A", 45, 46, 47, 0, 1, 48, 49]);
        expect(pathArrs[17]).to.eql(["a", 50, 51, 52, 1, 0, 53, 54]);
        expect(pathArrs[18]).to.eql(["Z"]);
    });
    it("Savage.parsePathString - array", function() {
        var pathArrs = Savage.parsePathString(["M1 2"]);
        expect(pathArrs[0]).to.eql(["M", 1, 2]);
    });
    it("Savage.parseTransformString - string", function() {
        var matrix = new Savage.Matrix(1, 0, 0, 2, 0, 0);
        var str = matrix.toTransformString();
        var output = Savage.parseTransformString(str);
        expect(output[0]).to.eql(['s', 1, 2, 0, 0]);
    });
    it("Savage.parseTransformString - array", function() {
        var output = Savage.parseTransformString(['s', 1, 2, 0, 0]);
        expect(output[0]).to.eql(['s', 1, 2, 0, 0]);
    });
    it("Savage.select", function() {
        var s = Savage(10, 10);
        var group1 = s.group();
        var group2 = s.group();
        var group3 = s.group();
        var circle1 = s.circle(10, 20, 30).attr({
            'class': 'circle-one'
        });
        var circle2 = s.circle(5, 10, 25).attr({
            'class': 'circle-two'
        });
        group1.add(group2);
        group2.add(group3);
        group2.add(circle1);
        group3.add(circle2);
        var c1 = Savage.select('.circle-one');
        expect(circle1).to.be(c1);
        var c2 = Savage.select('.circle-two');
        expect(circle2).to.be(c2);
        s.remove();
    });
    it("Savage.selectAll", function() {
        var s = Savage(10, 10);
        var group1 = s.group();
        var group2 = s.group();
        var group3 = s.group();
        var circle1 = s.circle(10, 20, 30).attr({
            'class': 'circle-one'
        });
        var circle2 = s.circle(5, 10, 25).attr({
            'class': 'circle-two'
        });
        group1.add(group2);
        group2.add(group3);
        group2.add(circle1);
        group3.add(circle2);
        var circles = Savage.selectAll('circle');
        expect(circles.length).to.be(2);
        expect(circles).to.contain(circle1);
        expect(circles).to.contain(circle2);
        s.remove();
    });
    it("Savage.snapTo - number, no tolerance", function() {
        expect(Savage.snapTo(100, -5)).to.be(0);
        expect(Savage.snapTo(100, 0.0001)).to.be(0);
        expect(Savage.snapTo(100, 9)).to.be(0);
        expect(Savage.snapTo(100, 50)).to.be(50);
        expect(Savage.snapTo(100, 75)).to.be(75);
        expect(Savage.snapTo(100, 90)).to.be(90);
        expect(Savage.snapTo(100, 91)).to.be(100);
        expect(Savage.snapTo(100, 95)).to.be(100);
        expect(Savage.snapTo(100, 1204)).to.be(1200);
    });
    it("Savage.snapTo - array, no tolerance", function() {
        var grid = [0, 55, 200];
        expect(Savage.snapTo(grid, -5)).to.be(0);
        expect(Savage.snapTo(grid, 0.0001)).to.be(0);
        expect(Savage.snapTo(grid, 9)).to.be(0);
        expect(Savage.snapTo(grid, 50)).to.be(55);
        expect(Savage.snapTo(grid, 75)).to.be(75);
        expect(Savage.snapTo(grid, 90)).to.be(90);
        expect(Savage.snapTo(grid, 91)).to.be(91);
        expect(Savage.snapTo(grid, 195)).to.be(200);
        expect(Savage.snapTo(grid, 1204)).to.be(1204);
    });
    it("Savage.snapTo - number, with tolerance", function() {
        expect(Savage.snapTo(100, 95, 0)).to.be(95);
        expect(Savage.snapTo(100, 95, 5)).to.be(95);
        expect(Savage.snapTo(100, 95, 6)).to.be(100);
        expect(Savage.snapTo(100, 105, 6)).to.be(100);
        expect(Savage.snapTo(100, 105, 5)).to.be(105);
        expect(Savage.snapTo(100, 105, 0)).to.be(105);
        // expect(Savage.snapTo(10, 19, 50)).to.be(20); // TODO: Find out what tolerance > grid should do
    });
    it("Savage.snapTo - array, with tolerance", function() {
        var grid = [0, 55, 200];
        expect(Savage.snapTo(grid, -5, 20)).to.be(0);
        expect(Savage.snapTo(grid, -5, 3)).to.be(-5);
        expect(Savage.snapTo(grid, 0.0001, 0.00001)).to.be(0.0001);
        expect(Savage.snapTo(grid, 0.0001, 1)).to.be(0);
        expect(Savage.snapTo(grid, 9, 9)).to.be(0);
        expect(Savage.snapTo(grid, 9, 10.5)).to.be(0);
        expect(Savage.snapTo(grid, 50, 6)).to.be(55);
        expect(Savage.snapTo(grid, 50, 1)).to.be(50);
        expect(Savage.snapTo(grid, 201, 0.5)).to.be(201);
        expect(Savage.snapTo(grid, 199, 1)).to.be(200);
        expect(Savage.snapTo(grid, 299, 100)).to.be(200);
    });
    it("Savage.path.getBBox", function() {
        // same as 10,20,30,40 rect
        var bbox = Savage.path.getBBox("M10,20h30v40h-30z");
        expect(bbox.x).to.eql(10);
        expect(bbox.y).to.eql(20);
        expect(bbox.width).to.eql(30);
        expect(bbox.height).to.eql(40);
        expect(bbox.x2).to.eql(10 + 30);
        expect(bbox.y2).to.eql(20 + 40);
    });
});