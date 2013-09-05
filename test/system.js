describe("System check", function () {
    it("Savage exists", function () {
        expect(Savage).to.be.a("function");
    });
    it("eve exists", function () {
        expect(eve).to.be.a("function");
    });
    it("mina exists", function () {
        expect(mina).to.be.a("function");
    });
    it("elemental exists", function () {
        expect(elemental).to.be.a("function");
    });
});
