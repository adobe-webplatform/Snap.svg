describe("Element methods", function () {
    var s;
    beforeEach(function () {
        s = Savage(100, 100);
    });
    afterEach(function () {
        s.remove();
    });
    
    /* 
    DOM manipulation:
        - add/append
        - prepend
        - after
        - insertAfter
        - before
        - insertBefore
        - clone
        - parent
        - remove
    */
    it("Element.add (for Element)", function () {
        var rect = s.rect(10, 20, 30, 40);
        s.add(rect);
        expect(rect.node.parentNode).to.be(s.node);
        expect(s.node.lastChild).to.be(rect.node);
    });
    it("Element.add (for Set)", function () {
        var rect1 = s.rect(10, 20, 30, 40);
        var rect2 = s.rect(10, 20, 30, 40);
        var set = Savage.set(rect1, rect2);
        s.add(set);
        expect(rect1.node.parentNode).to.be(s.node);
        expect(rect2.node.parentNode).to.be(s.node);
    });
    it("Element.append (for Element)", function () {
        var rect = s.rect(10, 20, 30, 40);
        s.append(rect);
        expect(rect.node.parentNode).to.be(s.node);
        expect(s.node.lastChild).to.be(rect.node);
    });
    it("Element.append (for Set)", function () {
        var rect1 = s.rect(10, 20, 30, 40);
        var rect2 = s.rect(10, 20, 30, 40);
        var set = Savage.set(rect1, rect2);
        s.append(set);
        expect(rect1.node.parentNode).to.be(s.node);
        expect(rect2.node.parentNode).to.be(s.node);
    });
    it("Element.after", function() {
        var circle = s.circle(10, 20, 30);
        var rect = s.rect(10, 20, 30, 40);
        circle.after(rect);
        expect(circle.node.nextSibling).to.be(rect.node);
    });
    it("Element.prepend", function() {
        var rect = s.rect(10, 20, 30, 40);
        var circle = s.circle(10, 20, 30);
        var group = s.group();
        s.append(group);
        group.prepend(rect);
        expect(group.node.firstChild).to.be(rect.node);
        group.prepend(circle);
        expect(group.node.firstChild).to.be(circle.node);
    });
    it("Element.insertAfter", function() {
        var circle = s.circle(10, 20, 30);
        var rect = s.rect(10, 20, 30, 40);
        rect.insertAfter(circle);
        expect(circle.node.nextSibling).to.be(rect.node);
    });
    it("Element.before", function() {
        var circle = s.circle(10, 20, 30);
        var rect = s.rect(10, 20, 30, 40);
        circle.before(rect);
        expect(circle.node.previousSibling).to.be(rect.node);
    });
    it("Element.insertBefore", function() {
        var circle = s.circle(10, 20, 30);
        var rect = s.rect(10, 20, 30, 40);
        rect.insertBefore(circle);
        expect(circle.node.previousSibling).to.be(rect.node);
    });
    it("Element.clone", function() {
        var circle = s.circle(10, 20, 30);
        s.append(circle);
        var clone = circle.clone();
        expect(circle.node).not.to.be(clone.node);
        expect(circle.node.getAttribute("cx")).to.be("10");
        expect(circle.node.getAttribute("cy")).to.be("20");
        expect(circle.node.getAttribute("r")).to.be("30");
    });
    it("Element.parent", function() {
        var circle = s.circle(10, 20, 30);
        s.append(circle);
        var parent = circle.parent();
        expect(parent.node).to.be(s.node);
    });
    it("Element.remove", function() {
        var rect = s.rect(10, 20, 30, 40);
        expect(rect.node.parentNode).to.be(s.node);
        rect.remove();
        expect(rect.node.parentNode).to.be(null);
    });
    
    /*
    Set/get data:
        Element.attr()
        Element.data()
        Element.removeData()
        Element.asPX()
        Element.getBBox()
        
        // TODO:
        Element.getPointAtLength()
        Element.getSubpath()
        Element.getTotalLength()
    */
    
    it("Element.attr - get", function() {
        var circle = s.circle(10, 20, 30);
        var r = circle.attr("r");
        expect(r).to.be("30");
    });
    it("Element.attr - set string", function() {
        var circle = s.circle(10, 20, 30);
        circle.attr("r", 40);
        var r = circle.node.getAttribute("r");
        expect(r).to.be("40");
    });
    it("Element.attr - set object", function() {
        var circle = s.circle(10, 20, 30);
        circle.attr({
            cx: 1,
            cy: 2,
            r: 3
        });
        var cx = circle.node.getAttribute("cx");
        var cy = circle.node.getAttribute("cy");
        var r = circle.node.getAttribute("r");
        expect(cx).to.be("1");
        expect(cy).to.be("2");
        expect(r).to.be("3");
    });
    it("Element.data", function() {
        var circle = s.circle(10, 20, 30);
        circle.data("foo", "bar");
        var data = circle.data("foo");
        expect(data).to.be("bar");
        var myObject = {};
        circle.data("my-object", myObject);
        data = circle.data("my-object");
        expect(data).to.be(myObject);
    });
    it("Element.removeData", function() {
        var circle = s.circle(10, 20, 30);
        var myObject = {};
        circle.data("my-object", myObject);
        var data = circle.data("my-object");
        expect(data).to.be(myObject);
        circle.removeData("my-object");
        var data = circle.data("my-object");
        expect(data).to.be(null);
    });
    it("Element.asPX - from %", function() {
        s.attr({width: "200"}); // NOTE: This is only working with "200" as string, fails as number
        var rect = s.rect(0, 0, '100%', 10);
        var widthAsPx = rect.asPX("width");
        expect(widthAsPx).to.be(200);
    });
    it("Element.asPX - from em", function() {
        var rect = s.rect(0, 0, 10, '10em');
        var heightAsPx = rect.asPX("height");
        expect(heightAsPx).to.be(160); // assumes 1em = 16px, is this safe?
    });
    it("Element.getBBox", function() {
        var rect = s.rect(10, 20, 30, 40);
        var bbox = rect.getBBox();
        
        expect(bbox).to.eql({
            x: 10,
            y: 20,
            w: 30,
            width: 30,
            h: 40,
            height: 40,
            
            x2: 25,
            cy: 40,
            x2: (100 - 40),
            y2: (100 - 60)
        });
    });
});
