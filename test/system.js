describe("System check", function () {
    it("Snap exists", function () {
        expect(Snap).to.be.a("function");
    });
    it("eve exists", function () {
        expect(eve).to.be.a("function");
    });
    it("mina exists", function () {
        expect(mina).to.be.a("function");
    });
});
