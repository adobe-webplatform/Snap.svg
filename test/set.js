describe("Set methods", function () {
    var s;
    beforeEach(function () {
        s = Snap(100, 100);
    });
    afterEach(function () {
        s.remove();
    });
    it("Set.clear", function() {
        var rect1 = s.rect(10, 20, 30, 40);
        var rect2 = s.rect(10, 20, 30, 40);
        var set = Snap.set(rect1, rect2);
        expect(set.length).to.be(2);
        set.clear();
        expect(set.length).to.be(0);
    });
    it("Set.exclude", function() {
        var rect1 = s.rect(10, 20, 30, 40);
        var rect2 = s.rect(10, 20, 30, 40);
        var rect3 = s.rect(10, 20, 30, 40);
        var set = Snap.set(rect1, rect2, rect3);
        expect(set.length).to.be(3);
        var excluded = set.exclude(rect2);
        expect(set.length).to.be(2);
        expect(excluded).to.be(true);
        excluded = set.exclude(rect2);
        expect(set.length).to.be(2);
        expect(excluded).to.be(false);
    });
    it("Set.remove", function() {
        var rect1 = s.rect(10, 20, 30, 40);
        var rect2 = s.rect(10, 20, 30, 40);
        var rect3 = s.rect(10, 20, 30, 40);
        var set = Snap.set(rect1, rect2, rect3);
        expect(set.length).to.be(3);
        set.remove();
        expect(set.length).to.be(0);
        expect(rect1.removed).to.be(true);
        expect(rect2.removed).to.be(true);
        expect(rect3.removed).to.be(true);
    });
    it("Set.forEach", function() {
        var rect1 = s.rect(10, 20, 30, 40);
        var rect2 = s.rect(10, 20, 30, 40);
        var rect3 = s.rect(10, 20, 30, 40);
        var set = Snap.set(rect1, rect2, rect3);
        var i = 0;
        var arr = [rect1, rect2, rect3];
        var result = set.forEach(function(item) {
            expect(arr[i]).to.be(item);
            expect(this.isContext).to.be(true);
            i++;
        }, {isContext: true});
        expect(result).to.be(set);
        expect(i).to.be(3);
    });
    it("Set.pop", function() {
        var rect1 = s.rect(10, 20, 30, 40);
        var rect2 = s.rect(10, 20, 30, 40);
        var rect3 = s.rect(10, 20, 30, 40);
        var set = Snap.set(rect1, rect2, rect3);
        expect(set.length).to.be(3);
        var result = set.pop();
        expect(set.length).to.be(2);
        expect(result).to.be(rect3);
        expect(set[0]).to.be(rect1);
        expect(set[1]).to.be(rect2);
        result = set.pop();
        expect(set.length).to.be(1);
        expect(result).to.be(rect2);
        expect(set[0]).to.be(rect1);
    });
    it("Set.push", function() {
        var rect1 = s.rect(10, 20, 30, 40);
        var rect2 = s.rect(10, 20, 30, 40);
        var rect3 = s.rect(10, 20, 30, 40);
        var set = Snap.set(rect1, rect2);
        expect(set.length).to.be(2);
        set.push(rect3);
        expect(set.length).to.be(3);
        expect(set[0]).to.be(rect1);
        expect(set[1]).to.be(rect2);
        expect(set[2]).to.be(rect3);
    });
    it("Set.splice - remove only", function() {
        var rect1 = s.rect(10, 20, 30, 40);
        var rect2 = s.rect(10, 20, 30, 40);
        var rect3 = s.rect(10, 20, 30, 40);
        var rect4 = s.rect(10, 20, 30, 40);
        var set = Snap.set(rect1, rect2, rect3, rect4);
        var removedSet = set.splice(1, 2);
        expect(set.length).to.be(2);
        expect(set[0]).to.be(rect1);
        expect(set[1]).to.be(rect4);
        expect(removedSet.length).to.be(2);
        expect(removedSet[0]).to.be(rect2);
        expect(removedSet[1]).to.be(rect3);
        var emptySet = set.splice(0, 0);
        expect(set.length).to.be(2);
        expect(emptySet.length).to.be(0);
    });
    it("Set.splice - remove & insert", function() {
        var rect1 = s.rect(10, 20, 30, 40);
        var rect2 = s.rect(10, 20, 30, 40);
        var rect3 = s.rect(10, 20, 30, 40);
        var rect4 = s.rect(10, 20, 30, 40);
        var set = Snap.set(rect1, rect2, rect3);
        var removedSet = set.splice(2, 1, rect4);
        expect(set.length).to.be(3);
        expect(set[0]).to.be(rect1);
        expect(set[1]).to.be(rect2);
        expect(set[2]).to.be(rect4);
        removedSet = set.splice(0, 3, rect4, rect3, rect2, rect1);
        expect(set[0]).to.be(rect4);
        expect(set[1]).to.be(rect3);
        expect(set[2]).to.be(rect2);
        expect(set[3]).to.be(rect1);
        expect(removedSet[0]).to.be(rect1);
        expect(removedSet[1]).to.be(rect2);
        expect(removedSet[2]).to.be(rect4);
    });
});