describe("Class methods", function () {
    var s, r;
    beforeEach(function () {
        s = Snap(100, 100);
        r = s.rect(10, 10, 50, 50);
    });
    afterEach(function () {
        s.remove();
    });
    it("elproto.addClass one", function() {
        r.addClass("one");
        expect(r.node.className.baseVal).to.be("one");
    });
    it("elproto.addClass two", function() {
        r.addClass("one two");
        expect(r.node.className.baseVal).to.be("one two");
    });
    it("elproto.addClass two (spacing)", function() {
        r.addClass("\tone   two ");
        expect(r.node.className.baseVal).to.be("one two");
    });
    it("elproto.addClass three", function() {
        r.addClass("one  two three");
        expect(r.node.className.baseVal).to.be("one two three");
    });
    it("elproto.removeClass 1", function() {
        r.addClass("one  two three");
        r.removeClass("two");
        expect(r.node.className.baseVal).to.be("one three");
    });
    it("elproto.removeClass 2", function() {
        r.addClass("one  two three");
        r.removeClass("two one");
        expect(r.node.className.baseVal).to.be("three");
    });
    it("elproto.hasClass", function() {
        r.addClass("one  two three");
        expect(r.hasClass("two")).to.be(true);
    });
    it("elproto.toggleClass 1", function() {
        r.addClass("one  two three");
        r.toggleClass("two one");
        expect(r.node.className.baseVal).to.be("three");
    });
    it("elproto.toggleClass 2", function() {
        r.addClass("one  three");
        r.toggleClass("two one", false);
        expect(r.node.className.baseVal).to.be("three");
    });
    it("elproto.toggleClass 3", function() {
        r.addClass("one three");
        r.toggleClass("two one", true);
        expect(r.node.className.baseVal).to.be("one three two");
    });
});