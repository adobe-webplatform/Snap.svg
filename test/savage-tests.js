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
});