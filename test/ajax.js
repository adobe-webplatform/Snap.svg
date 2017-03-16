describe("Snap Ajax methods", function () {
    it("Snap.ajax - no postData", function(done) {
        var xhr = Snap.ajax('./res/file-for-ajax.txt', function(xhr) {
            var responseText = xhr.responseText;
            expect(responseText).to.be('success');
            expect(this.isContext).to.be(true);
            done();
        }, {'isContext': true});
        expect(xhr).to.be.an('object');
    });
    it("Snap.ajax - with object postData", function(done) {
        var xhr = Snap.ajax('./res/file-for-ajax.txt', {foo: 'bar'}, function(xhr) {
            var responseText = xhr.responseText;
            expect(responseText).to.be('success');
            expect(this.isContext).to.be(true);
            done();
        }, {'isContext': true});
        expect(xhr).to.be.an('object');
    });
    it("Snap.ajax - with string postData", function(done) {
        var xhr = Snap.ajax('./res/file-for-ajax.txt', 'foo=bar', function(xhr) {
            var responseText = xhr.responseText;
            expect(responseText).to.be('success');
            expect(this.isContext).to.be(true);
            done();
        }, {'isContext': true});
        expect(xhr).to.be.an('object');
    });
    it("Snap.load - with context", function(done) {
        Snap.load('./res/external-svg.svg', function(fragment) {
            expect(fragment.node.querySelector("svg")).to.not.be(null);
            expect(this.myContext).to.be(true);
            done();
        }, {myContext: true});
    });
    it("Snap.load - without context", function(done) {
        Snap.load('./res/external-svg.svg', function(fragment) {
            expect(fragment.node.querySelector("svg")).to.not.be(null);
            done();
        });
    });
});
