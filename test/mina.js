describe("Mina methods", function () {
    var s;
    beforeEach(function () {
        s = Snap(100, 100);
    });
    afterEach(function () {
        s.remove();
    });
    
    var validateDescriptor = function(obj) {
        expect(obj).to.be.an('object');
        expect(obj.id).to.be.a('string');
        expect(obj.start).to.be.a('number');
        expect(obj.end).to.be.a('number');
        expect(obj.b).to.be.a('number');
        expect(obj.s).to.be.a('number');
        expect(obj.dur).to.be.a('number');
        expect(obj.spd).to.be.a('number');
        
        expect(obj.get).to.be.a('function');
        expect(obj.set).to.be.a('function');
        expect(obj.easing).to.be.a('function');
        expect(obj.status).to.be.a('function');
        expect(obj.speed).to.be.a('function');
        expect(obj.duration).to.be.a('function');
        expect(obj.stop).to.be.a('function');
    };
    
    it("mina", function() {
        var n;
        var animDescriptor = mina(10, 20, 0, 1000, function(newN) {
            n = newN;
        }, function() {});
        
        validateDescriptor(animDescriptor);
        expect(animDescriptor.start).to.be(10);
        expect(animDescriptor.end).to.be(20);
        expect(animDescriptor.b).to.be(0);
        expect(animDescriptor.s).to.be(0);
        expect(animDescriptor.dur).to.be(1000);
        expect(animDescriptor.easing).to.be(mina.linear);
    });
    it("mina.getById", function() {
        var anim1 = mina(10, 20, 0, 1000, function() {}, function() {});
        var anim2 = mina(10, 20, 0, 1000, function() {}, function() {});
        expect(mina.getById(anim1.id)).to.be(anim1);
        expect(mina.getById(anim2.id)).to.be(anim2);
    });
    it("mina.time", function() {
        var now = (new Date).getTime();
        expect(mina.time()).to.be(now);
    });
    it("mina.backin", function() {
        expect(mina.backin(0)).to.be(0);
        expect(mina.backin(1)).to.be(1);
    });
    it("mina.backout", function() {
        expect(mina.backout(0)).to.be(0);
        expect(mina.backout(1)).to.be(1);
    });
    it("mina.bounce", function() {
        expect(mina.bounce(0)).to.be(0);
        expect(mina.bounce(1)).to.be(1);
    });
    it("mina.easein", function() {
        expect(mina.easein(0)).to.be(0);
        expect(mina.easein(1)).to.be(1);
    });
    it("mina.easeinout", function() {
        expect(mina.easeinout(0)).to.be(0);
        expect(mina.easeinout(1)).to.be(1);
    });
    it("mina.easeout", function() {
        expect(mina.easeout(0)).to.be(0);
        expect(mina.easeout(1)).to.be(1);
    });
    it("mina.elastic", function() {
        expect(mina.elastic(0)).to.be(0);
        expect(mina.elastic(1)).to.be(1);
    });
    it("mina.linear", function() {
        expect(mina.linear(0)).to.be(0);
        expect(mina.linear(0.2)).to.be(0.2);
        expect(mina.linear(0.7)).to.be(0.7);
        expect(mina.linear(1)).to.be(1);
    });
});