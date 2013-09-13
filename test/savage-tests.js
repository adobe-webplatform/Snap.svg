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
});