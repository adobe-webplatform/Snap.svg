describe("Filter methods", function () {
    it("Snap.filter.blur", function() {
        var str = Snap.filter.blur(3);
        expect(str).to.be('<feGaussianBlur stdDeviation="3"/>');
        str = Snap.filter.blur(0.123, 8);
        expect(str).to.be('<feGaussianBlur stdDeviation="0.123,8"/>');
    });
    it("Snap.filter.brightness", function() {
        var str = Snap.filter.brightness(0.3);
        expect(str).to.be('<feComponentTransfer><feFuncR type="linear" slope="0.3"/><feFuncG type="linear" slope="0.3"/><feFuncB type="linear" slope="0.3"/></feComponentTransfer>');
        str = Snap.filter.brightness(1);
        expect(str).to.be('<feComponentTransfer><feFuncR type="linear" slope="1"/><feFuncG type="linear" slope="1"/><feFuncB type="linear" slope="1"/></feComponentTransfer>');
    });
    it("Snap.filter.contrast", function() {
        var str = Snap.filter.contrast(0.1);
        expect(str).to.be('<feComponentTransfer><feFuncR type="linear" slope="0.1" intercept="0.45"/><feFuncG type="linear" slope="0.1" intercept="0.45"/><feFuncB type="linear" slope="0.1" intercept="0.45"/></feComponentTransfer>');
        str = Snap.filter.contrast(3);
        expect(str).to.be('<feComponentTransfer><feFuncR type="linear" slope="3" intercept="-1"/><feFuncG type="linear" slope="3" intercept="-1"/><feFuncB type="linear" slope="3" intercept="-1"/></feComponentTransfer>');
    });
    it("Snap.filter.grayscale", function() {
        var str = Snap.filter.grayscale(0.5);
        expect(str).to.be('<feColorMatrix type="matrix" values="0.6063000000000001 0.3576 0.0361 0 0 0.1063 0.8575999999999999 0.0361 0 0 0.1063 0.3576 0.5361 0 0 0 0 0 1 0"/>');
        str = Snap.filter.grayscale(1);
        expect(str).to.be('<feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0"/>');
    });
    it("Snap.filter.hueRotate", function() {
        var str = Snap.filter.hueRotate(180);
        expect(str).to.be('<feColorMatrix type="hueRotate" values="180"/>');
        str = Snap.filter.hueRotate(90);
        expect(str).to.be('<feColorMatrix type="hueRotate" values="90"/>');
    });
    it("Snap.filter.hueRotate", function() {
        var str = Snap.filter.hueRotate(180);
        expect(str).to.be('<feColorMatrix type="hueRotate" values="180"/>');
        str = Snap.filter.hueRotate(90);
        expect(str).to.be('<feColorMatrix type="hueRotate" values="90"/>');
    });
    it("Snap.filter.invert", function() {
        var str = Snap.filter.invert(0.6);
        expect(str).to.be('<feComponentTransfer><feFuncR type="table" tableValues="0.6 0.4"/><feFuncG type="table" tableValues="0.6 0.4"/><feFuncB type="table" tableValues="0.6 0.4"/></feComponentTransfer>');
        str = Snap.filter.invert(1);
        expect(str).to.be('<feComponentTransfer><feFuncR type="table" tableValues="1 0"/><feFuncG type="table" tableValues="1 0"/><feFuncB type="table" tableValues="1 0"/></feComponentTransfer>');
    });
    it("Snap.filter.saturate", function() {
        var str = Snap.filter.saturate(0.3);
        expect(str).to.be('<feColorMatrix type="saturate" values="0.7"/>');
        str = Snap.filter.saturate(1);
        expect(str).to.be('<feColorMatrix type="saturate" values="0"/>');
    });
    it("Snap.filter.sepia", function() {
        var str = Snap.filter.sepia(0.3);
        expect(str).to.be('<feColorMatrix type="matrix" values="0.8179 0.23070000000000002 0.0567 0 0 0.10470000000000002 0.9058 0.050400000000000014 0 0 0.0816 0.1602 0.7393 0 0 0 0 0 1 0"/>');
        str = Snap.filter.sepia(1);
        expect(str).to.be('<feColorMatrix type="matrix" values="0.393 0.769 0.189 0 0 0.349 0.686 0.168 0 0 0.272 0.534 0.131 0 0 0 0 0 1 0"/>');
    });
    it("Snap.filter.shadow - dx & dy", function() {
        var str = Snap.filter.shadow(5, 5);
        expect(str).to.be('<feGaussianBlur in="SourceAlpha" stdDeviation="4"/><feOffset dx="5" dy="5" result="offsetblur"/><feFlood flood-color="#000000"/><feComposite in2="offsetblur" operator="in"/><feComponentTransfer><feFuncA type="linear" slope="1"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>');
        str = Snap.filter.shadow(-1, 3);
        expect(str).to.be('<feGaussianBlur in="SourceAlpha" stdDeviation="4"/><feOffset dx="-1" dy="3" result="offsetblur"/><feFlood flood-color="#000000"/><feComposite in2="offsetblur" operator="in"/><feComponentTransfer><feFuncA type="linear" slope="1"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>');
    });
    it("Snap.filter.shadow - dx & dy, blur", function() {
        var str = Snap.filter.shadow(5, 5, 5);
        expect(str).to.be('<feGaussianBlur in="SourceAlpha" stdDeviation="5"/><feOffset dx="5" dy="5" result="offsetblur"/><feFlood flood-color="#000000"/><feComposite in2="offsetblur" operator="in"/><feComponentTransfer><feFuncA type="linear" slope="1"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>');
        str = Snap.filter.shadow(-1, 3, 10);
        expect(str).to.be('<feGaussianBlur in="SourceAlpha" stdDeviation="10"/><feOffset dx="-1" dy="3" result="offsetblur"/><feFlood flood-color="#000000"/><feComposite in2="offsetblur" operator="in"/><feComponentTransfer><feFuncA type="linear" slope="1"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>');
    });
    it("Snap.filter.shadow - dx & dy, color", function() {
        var str = Snap.filter.shadow(5, 5, '#F00');
        expect(str).to.be('<feGaussianBlur in="SourceAlpha" stdDeviation="4"/><feOffset dx="5" dy="5" result="offsetblur"/><feFlood flood-color="#ff0000"/><feComposite in2="offsetblur" operator="in"/><feComponentTransfer><feFuncA type="linear" slope="#F00"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>');
        str = Snap.filter.shadow(-1, 3, 'hsla(128deg, 50%, 50%, 0.8)');
        expect(str).to.be('<feGaussianBlur in="SourceAlpha" stdDeviation="4"/><feOffset dx="-1" dy="3" result="offsetblur"/><feFlood flood-color="rgba(64,191,81,0.8)"/><feComposite in2="offsetblur" operator="in"/><feComponentTransfer><feFuncA type="linear" slope="hsla(128deg, 50%, 50%, 0.8)"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>');
    });

    it("Snap.filter.shadow - dx & dy, blur & color", function() {
        var str = Snap.filter.shadow(5, 5, 5, '#F00');
        expect(str).to.be('<feGaussianBlur in="SourceAlpha" stdDeviation="5"/><feOffset dx="5" dy="5" result="offsetblur"/><feFlood flood-color="#ff0000"/><feComposite in2="offsetblur" operator="in"/><feComponentTransfer><feFuncA type="linear" slope="1"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>');
        str = Snap.filter.shadow(-1, 3, 10, 'hsla(128deg, 50%, 50%, 0.8)');
        expect(str).to.be('<feGaussianBlur in="SourceAlpha" stdDeviation="10"/><feOffset dx="-1" dy="3" result="offsetblur"/><feFlood flood-color="rgba(64,191,81,0.8)"/><feComposite in2="offsetblur" operator="in"/><feComponentTransfer><feFuncA type="linear" slope="1"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>');
    });
    
       
});