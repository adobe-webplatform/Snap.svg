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
        var result = s.add(rect);
        expect(rect.node.parentNode).to.be(s.node);
        expect(s.node.lastChild).to.be(rect.node);
        expect(result).to.be(s);
    });
    it("Element.add (for Set)", function () {
        var rect1 = s.rect(10, 20, 30, 40);
        var rect2 = s.rect(10, 20, 30, 40);
        var set = Savage.set(rect1, rect2);
        var result = s.add(set);
        expect(rect1.node.parentNode).to.be(s.node);
        expect(rect2.node.parentNode).to.be(s.node);
        expect(result).to.be(s);
    });
    it("Element.append (for Element)", function () {
        var rect = s.rect(10, 20, 30, 40);
        var result = s.append(rect);
        expect(rect.node.parentNode).to.be(s.node);
        expect(s.node.lastChild).to.be(rect.node);
        expect(result).to.be(s);
    });
    it("Element.append (for Set)", function () {
        var rect1 = s.rect(10, 20, 30, 40);
        var rect2 = s.rect(10, 20, 30, 40);
        var set = Savage.set(rect1, rect2);
        var result = s.append(set);
        expect(rect1.node.parentNode).to.be(s.node);
        expect(rect2.node.parentNode).to.be(s.node);
        expect(result).to.be(s);
    });
    it("Element.after", function() {
        var circle = s.circle(10, 20, 30);
        var rect = s.rect(10, 20, 30, 40);
        var result = circle.after(rect);
        expect(circle.node.nextSibling).to.be(rect.node);
        expect(result).to.be(circle);
    });
    it("Element.prepend", function() {
        var rect = s.rect(10, 20, 30, 40);
        var circle = s.circle(10, 20, 30);
        var group = s.group();
        s.append(group);
        var result = group.prepend(rect);
        expect(group.node.firstChild).to.be(rect.node);
        expect(result).to.be(group);
        result = group.prepend(circle);
        expect(group.node.firstChild).to.be(circle.node);
        expect(result).to.be(group);
    });
    it("Element.insertAfter", function() {
        var circle = s.circle(10, 20, 30);
        var rect = s.rect(10, 20, 30, 40);
        var result = rect.insertAfter(circle);
        expect(circle.node.nextSibling).to.be(rect.node);
        expect(result).to.be(rect);
    });
    it("Element.before", function() {
        var circle = s.circle(10, 20, 30);
        var rect = s.rect(10, 20, 30, 40);
        var result = circle.before(rect);
        expect(circle.node.previousSibling).to.be(rect.node);
        expect(result).to.be(circle);
    });
    it("Element.insertBefore", function() {
        var circle = s.circle(10, 20, 30);
        var rect = s.rect(10, 20, 30, 40);
        var result = rect.insertBefore(circle);
        expect(circle.node.previousSibling).to.be(rect.node);
        expect(result).to.be(rect);
    });
    it("Element.clone", function() {
        var circle = s.circle(10, 20, 30);
        s.append(circle);
        var clone = circle.clone();
        expect(circle.node).not.to.be(clone.node);
        // NOTE: These assume a cloneNode copy, not a <use> element
        expect(clone.node.getAttribute("cx")).to.be("10");
        expect(clone.node.getAttribute("cy")).to.be("20");
        expect(clone.node.getAttribute("r")).to.be("30");
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
        var result = rect.remove();
        expect(rect.node.parentNode).to.be(null);
        // NOTE: docs say it does not return anything, but perhaps it should?
        // expect(result).to.be(rect);
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
    it("Element.attr - set", function() {
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
        data = circle.data("my-object");
        expect(data).to.be(undefined);
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
        
        expect(bbox.x).to.eql(10);
        expect(bbox.y).to.eql(20);
        expect(bbox.w).to.eql(30);
        expect(bbox.width).to.eql(30);
        expect(bbox.h).to.eql(40);
        expect(bbox.height).to.eql(40);
        expect(bbox.x2).to.eql(10 + 30);
        expect(bbox.cx).to.eql(10 + 30 / 2);
        expect(bbox.cy).to.eql(20 + 40 / 2);
        expect(bbox.y2).to.eql(20 + 40);
    });
    
    it("Element.getPointAtLength", function() {
        var path = s.path("M0,0 100,0");
        expect(path.getPointAtLength(50)).to.eql({
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
    it("Element.getSubpath", function() {
        var path = s.path("M0,0 100,0");
        expect(path.getSubpath(10, 90)).to.be("M9.995,0C29.153,0,70.839,0,90,0");
    });
    it("Element.getTotalLength", function() {
        var path = s.path("M0,0 100,0");
        expect(+path.getTotalLength("M0,0 100,0").toFixed(2)).to.be(100);
    });
    
    /*
        Misc: 
        
        Element.select()
        Element.selectAll()
        Element.animate()
        Element.inAnim()
        Element.stop()
        Element.marker()
        Element.pattern()
        Element.use()
        Element.transform()
        
    */
    
    it("Element.select", function() {
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
        var c1 = group1.select('.circle-one');
        expect(circle1).to.be(c1);
        var c2 = group1.select('.circle-two');
        expect(circle2).to.be(c2);
    });
    it("Element.selectAll", function() {
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
        var circles = group1.selectAll('circle');
        expect(circles.length).to.be(2);
        expect(circles).to.contain(circle1);
        expect(circles).to.contain(circle2);
    });
    it("Element.animate", function(done) {
        var circle = s.circle(10, 20, 30);
        var result = circle.animate({r: 50}, 10);
        setTimeout(function() {
            var r = circle.attr("r");
            expect(r).to.be("50");
            done();
        }, 50);
        expect(result).to.be(circle);
    });    
    it("Element.animate - with callback", function(done) {
        var circle = s.circle(10, 20, 30);
        var result = circle.animate({r: 50}, 10, function() {
            var r = circle.attr("r");
            expect(r).to.be("50");
            done();
        });
        expect(result).to.be(circle);
    });
    it("Element.animate - with easing", function(done) {
        var circle = s.circle(10, 20, 30);
        var result = circle.animate({r: 50}, 10, mina.easein);
        setTimeout(function() {
            var r = circle.attr("r");
            expect(r).to.be("50");
            done();
        }, 50);
        expect(result).to.be(circle);
    });
    it("Element.animate - with callback & easing", function(done) {
        var circle = s.circle(10, 20, 30);
        var result = circle.animate({r: 50}, 10, mina.easeout, function() {
            var r = circle.attr("r");
            expect(r).to.be("50");
            done();
        });
        expect(result).to.be(circle);
    });
    it("Element.inAnim", function(done) {
        var circle = s.circle(10, 20, 30);
        circle.animate({r: 50}, 100);
        circle.animate({cx: 100}, 100);
        setTimeout(function() {
            var inAnimArr = circle.inAnim();
            expect(inAnimArr).to.be.an('array');
            expect(inAnimArr.length).to.be(2);
            expect(inAnimArr[0].anim).to.be.an('object');
            expect(inAnimArr[0].curStatus).to.be.a('number');
            expect(inAnimArr[0].curStatus).to.be.within(0.01, 0.99);
            expect(inAnimArr[0].status).to.be.a('function');
            expect(inAnimArr[0].stop).to.be.a('function');
            done();
        }, 50);
    });
    it("Element.stop", function() {
        var circle = s.circle(10, 20, 30);
        circle.animate({r: 50}, 100);
        setTimeout(function() {
            var inAnimArr = circle.inAnim();
            expect(inAnimArr.length).to.be(1);
            var result = circle.stop();
            inAnimArr = circle.inAnim();
            expect(inAnimArr.length).to.be(0);
            var r = circle.attr("r");
            expect(r).to.be.lessThan(50);
            expect(result).to.be(circle);
        }, 50);
    });
    it("Element.marker", function() {
        var line = s.line(0, 0, 10, 10);
        var marker = line.marker(0, 0, 5, 5, 0, 0);
        expect(marker.node.nodeName).to.be('marker');
    });
    it("Element.pattern", function() {
        var circle = s.circle(10, 20, 30);
        var pattern = circle.pattern(0, 0, 50, 50);
        expect(pattern.node.nodeName).to.be('pattern');
    });
    it("Element.transform", function() {
        var circle = s.circle(10, 20, 30);
        var result = circle.transform("translate(10,10)");
        var matrix = {
            a: 1, b: 0, c: 0, d: 1, e: 10, f: 10
        };
        var transform = circle.transform();
        expect(transform.string).to.be.a('string');
        expect(transform.global).to.be.a('string');
        expect(transform.globalMatrix).to.be.an('object');
        expect(transform.globalMatrix).to.eql(matrix);
        expect(transform.local).to.be.a('string');
        expect(transform.localMatrix).to.be.an('object');
        expect(transform.localMatrix).to.eql(matrix);
        circle.transform("rotate(90)");
        transform = circle.transform();
        expect(transform.local).to.be("r90,0,0");
        expect(result).to.be(circle);
    });
    it("Element.use", function() {
        var circle = s.circle(10, 20, 30);
        var use = circle.use();
        expect(use.node.nodeName).to.be('use');
    });
});
