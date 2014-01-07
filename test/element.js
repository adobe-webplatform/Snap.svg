describe("Element methods", function () {
    var s;
    beforeEach(function () {
        s = Snap(100, 100);
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
        var set = Snap.set(rect1, rect2);
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
    it("Element.appendTo (for Element)", function () {
        var rect = s.rect(10, 20, 30, 40);
        var result = rect.appendTo(s);
        expect(rect.node.parentNode).to.be(s.node);
        expect(s.node.lastChild).to.be(rect.node);
        expect(result).to.be(rect);
    });
    it("Element.append (for Set)", function () {
        var rect1 = s.rect(10, 20, 30, 40);
        var rect2 = s.rect(10, 20, 30, 40);
        var set = Snap.set(rect1, rect2);
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
    it("Element.prependTo", function() {
        var rect = s.rect(10, 20, 30, 40);
        var circle = s.circle(10, 20, 30);
        var group = s.group();
        s.append(group);
        var result = rect.prependTo(group);
        expect(group.node.firstChild).to.be(rect.node);
        expect(result).to.be(rect);
        result = circle.prependTo(group);
        expect(group.node.firstChild).to.be(circle.node);
        expect(result).to.be(circle);
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
        expect(result).to.be(rect);
    });
    
    /*
    Set/get data:
        Element.attr()
        Element.data()
        Element.removeData()
        Element.asPX()
        Element.getBBox()
        Element.getPointAtLength()
        Element.getSubpath()
        Element.getTotalLength()
        Element.innerSVG()
        Element.toString()
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
    it("Element.attr - set on group", function() {
        var group = s.group();
        group.attr({'class': 'myclass'});
        expect(group.node.getAttribute('class')).to.be('myclass');
    });
    it("Element.attr - textPath", function() {
        var txt = s.text(20, 20, "test");
        txt.attr({textpath: "M10,20L100,100"});
        expect(txt.node.firstChild.tagName).to.be("textPath");
    });
    it("Element.attr - textPath", function() {
        var txt = s.text(20, 20, "test"),
            pth = s.path("M10,20L100,100");
        txt.attr({textpath: pth});
        expect(txt.node.firstChild.tagName).to.be("textPath");
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
    it("Element.removeData - with key", function() {
        var circle = s.circle(10, 20, 30);
        var myObject = {};
        circle.data("my-object", myObject);
        var data = circle.data("my-object");
        expect(data).to.be(myObject);
        circle.removeData("my-object");
        data = circle.data("my-object");
        expect(data).to.be(undefined);
    });
    it("Element.removeData - no key", function() {
        var circle = s.circle(10, 20, 30);
        var myObject = {};
        var myNumber = 42;
        circle.data("my-object", myObject);
        circle.data("my-number", 42);
        expect(circle.data("my-object")).to.be(myObject);
        expect(circle.data("my-number")).to.be(myNumber);
        circle.removeData();
        expect(circle.data("my-object")).to.be(undefined);
        expect(circle.data("my-number")).to.be(undefined);
    });
    it("Element.asPX - from %", function() {
        s.attr({width: 200});
        var rect = s.rect(0, 0, "100%", 10);
        var widthAsPx = rect.asPX("width");
        expect(widthAsPx).to.be(200);
    });
    it("Element.getBBox", function() {
        var rect = s.rect(10, 20, 30, 40),
            bbox = rect.getBBox(),
            line = s.line(10, 20, 40, 60),
            lbbx = line.getBBox();

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
        expect(bbox).to.eql(lbbx);
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
    it("Element.innerSVG", function() {
        var group1 = s.group().attr({
            'class': 'group-one'
        });
        var group2 = s.group().attr({
            'class': 'group-two'
        });
        
        var group3 = s.group().attr({
            'class': 'group-three'
        });
        
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
        var innerSVG = group1.innerSVG();
        expect(innerSVG).to.match(/<g .*?class="group-two".*?>\w*<g .*?class="group-three".*?>\w*<circle .*?class="circle-two".*?>\w*<circle .*?class="circle-one".*?>/);
    });
    it("Element.toString", function() {
        var group1 = s.group();
        var circle1 = s.circle(10, 20, 30).attr({
            'class': 'circle-one'
        });
        group1.add(circle1);
        var str = group1.toString();
        expect(str).to.match(/<g.*?>\w*<circle .*?class="circle-one".*?>\w*<\/g>/);
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
        Element.toDefs()
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
    it("Element.stop", function(done) {
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
            done();
        }, 50);
    });
    it("Element.marker", function() {
        var line = s.line(0, 0, 10, 10);
        var marker = line.marker(0, 0, 5, 5, 0, 0);
        expect(marker.node.nodeName).to.be("marker");
        expect(marker.node.getAttribute("viewBox")).to.be("0 0 5 5");
        expect(marker.node.getAttribute("markerWidth")).to.be("5");
        expect(marker.node.getAttribute("markerHeight")).to.be("5");
        expect(marker.node.getAttribute("refX")).to.be("0");
        expect(marker.node.getAttribute("refY")).to.be("0");
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
        circle.transform("translate(10)");
        matrix = {
            a: 1, b: 0, c: 0, d: 1, e: 10, f: 0
        };
        transform = circle.transform();
        expect(transform.globalMatrix).to.eql(matrix);
    });
    it("Element.use", function() {
        var circle = s.circle(10, 20, 30);
        var use = circle.use();
        expect(use.node.nodeName).to.be('use');
    });
     it("Element.toDefs", function() {
        var circle = s.circle(10, 20, 30);
        var result = circle.toDefs();
        expect(circle.node.parentElement.nodeName).to.be('defs');
        expect(result).to.be(circle);
    });   
        
    /*
        Event binding & unbinding: 
        
            Element.click()
            Element.dblclick()
            Element.mousedown()
            Element.mousemove()
            Element.mouseout()
            Element.mouseover()
            Element.mouseup()
            Element.touchcancel()
            Element.touchend()
            Element.touchmove()
            Element.touchstart()
            Element.unclick()
            Element.undblclick()
            Element.unmousedown()
            Element.unmousemove()
            Element.unmouseout()
            Element.unmouseover()
            Element.unmouseup()
            Element.untouchcancel()
            Element.untouchend()
            Element.untouchmove()
            Element.untouchstart()

            Element.drag()
            Element.undrag()
            Element.onDragOver()
            Element.hover()
            Element.unhover()
    */
      
    // Helper function to simulate event triggering
    var triggerEvent = function(savageEl, eventType) {
        var event = document.createEvent("HTMLEvents");
        event.initEvent(eventType, true, true);
        savageEl.node.dispatchEvent(event);
    };
    
    // Generate tests for all standard DOM events
    (function() {
        var elementEvents = [
            "click",
            "dblclick",
            "mousedown",
            "mousemove",
            "mouseout",
            "mouseover",
            "mouseup",
            "touchcancel",
            "touchend",
            "touchmove",
            "touchstart"
        ];
        
        var makeEventTest = function(eventName) {
            return function() {
                // Add event, trigger event, remove event, trigger again
                var circle = s.circle(10, 20, 30);
                var n = 0;
                var fn = function() {
                    n++;
                };
                var result1 = circle[eventName](fn);
                expect(n).to.be(0);
                triggerEvent(circle, eventName);
                expect(n).to.be(1);
                var result2 = circle["un" + eventName](fn);
                triggerEvent(circle, eventName);
                expect(n).to.be(1);
                expect(result1).to.be(circle);
                expect(result2).to.be(circle);
            };
        };
        
        for (var i = 0; i < elementEvents.length; i++) {
            var eventName = elementEvents[i];
            var testName = "Element." + eventName + ", Element.un" + eventName;
            var testFunc = makeEventTest(eventName);
            it(testName, testFunc);
        }
    }());
    it("Element.drag, Element.undrag - no contexts", function() {
        var circle = s.circle(10, 20, 30);
        var moved = 0;
        var started = 0;
        var ended = 0;
        var result1 = circle.drag(function(dx, dy, x, y, event) {
            moved++;
            expect(dx).to.be.a('number');
            expect(dy).to.be.a('number');
            expect(x).to.be.a('number');
            expect(y).to.be.a('number');
            expect(event).to.be.an('object');
        }, function(x, y, event) {
            started++;
            expect(x).to.be.a('number');
            expect(y).to.be.a('number');
            expect(event).to.be.an('object');
        }, function(event) {
            ended++;
            expect(event).to.be.an('object');
        });
        
        expect(started).to.be(0);
        triggerEvent(circle, 'mousedown');
        expect(started).to.be(1);
        expect(moved).to.be(0);
        triggerEvent(circle, 'mousemove');
        expect(moved).to.be(1);
        expect(ended).to.be(0);
        triggerEvent(circle, 'mouseup');
        expect(ended).to.be(1);
        expect(result1).to.be(circle);
        
        var result2 = circle.undrag();
        triggerEvent(circle, 'mousedown');
        expect(started).to.be(1);
        triggerEvent(circle, 'mousemove');
        expect(moved).to.be(1);
        triggerEvent(circle, 'mouseup');
        expect(ended).to.be(1);
        // expect(result2).to.be(circle); // TODO: Make undrag return element
    });
    it("Element.drag - with contexts", function() {
        var circle = s.circle(10, 20, 30);
        var moved = 0;
        var started = 0;
        var ended = 0;
        var result = circle.drag(function(dx, dy, x, y, event) {
            moved++;
            expect(dx).to.be.a('number');
            expect(dy).to.be.a('number');
            expect(x).to.be.a('number');
            expect(y).to.be.a('number');
            expect(event).to.be.an('object');
            expect(this.moveContext).to.be(true);
        }, function(x, y, event) {
            started++;
            expect(x).to.be.a('number');
            expect(y).to.be.a('number');
            expect(event).to.be.an('object');
            expect(this.startContext).to.be(true);
        }, function(event) {
            ended++;
            expect(event).to.be.an('object');
            expect(this.endContext).to.be(true);
        }, {moveContext: true}, {startContext: true}, {endContext: true});
        
        expect(started).to.be(0);
        triggerEvent(circle, 'mousedown');
        expect(started).to.be(1);
        expect(moved).to.be(0);
        triggerEvent(circle, 'mousemove');
        expect(moved).to.be(1);
        expect(ended).to.be(0);
        triggerEvent(circle, 'mouseup');
        expect(ended).to.be(1);
        expect(result).to.be(circle);
        
        var result2 = circle.undrag();
        triggerEvent(circle, 'mousedown');
        expect(started).to.be(1);
        triggerEvent(circle, 'mousemove');
        expect(moved).to.be(1);
        triggerEvent(circle, 'mouseup');
        expect(ended).to.be(1);
        // expect(result2).to.be(circle); // TODO: Make undrag return element
    });
    
    
    it("Element.hover, Element.unhover - no contexts", function() {
        var circle = s.circle(10, 20, 30);
        var eventIn = 0;
        var eventOut = 0;
        var result1 = circle.hover(function() {
            eventIn++;
        }, function() {
            eventOut++;
        });
        
        expect(eventIn).to.be(0);
        triggerEvent(circle, 'mouseover');
        expect(eventIn).to.be(1);
        expect(eventOut).to.be(0);
        triggerEvent(circle, 'mouseout');
        expect(eventOut).to.be(1);
        expect(result1).to.be(circle);
        
        var result2 = circle.unhover();
        triggerEvent(circle, 'mouseover');
        expect(eventIn).to.be(1);
        triggerEvent(circle, 'mouseout');
        expect(eventOut).to.be(1);
        expect(result2).to.be(circle);
    });
    it("Element.hover, Element.unhover - with contexts", function() {
        var circle = s.circle(10, 20, 30);
        var eventIn = 0;
        var eventOut = 0;
        var result1 = circle.hover(function() {
            eventIn++;
            expect(this.inContext).to.be(true);
        }, function() {
            eventOut++;
            expect(this.outContext).to.be(true);
        }, {inContext: true}, {outContext: true});
        
        expect(eventIn).to.be(0);
        triggerEvent(circle, 'mouseover');
        expect(eventIn).to.be(1);
        expect(eventOut).to.be(0);
        triggerEvent(circle, 'mouseout');
        expect(eventOut).to.be(1);
        expect(result1).to.be(circle);
        
        var result2 = circle.unhover();
        triggerEvent(circle, 'mouseover');
        expect(eventIn).to.be(1);
        triggerEvent(circle, 'mouseout');
        expect(eventOut).to.be(1);
        expect(result2).to.be(circle);
    });
    it("Snap.getElementByPoint", function() {
        var rect = s.rect(10, 10, 30, 30).attr({id: "id"});
        var res1 = Snap.getElementByPoint(15, 15);
        var res2 = Snap.getElementByPoint(45, 45);
        expect(res1.node.id).to.be("id");
        expect(res2.node.id).to.not.be("id");
    });
});
