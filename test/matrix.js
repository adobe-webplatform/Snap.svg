describe("Matrix methods", function () {
    it("Matrix.add - matrix", function() {
        var matrix1 = new Snap.Matrix(1, 0, 0, 1, 5, 5);
        var matrix2 = new Snap.Matrix(1, 0, 0, 1, 10, 10);
        var result = matrix1.add(matrix2);
        expect(result).to.eql({
            a: 1,
            b: 0,
            c: 0,
            d: 1,
            e: 15,
            f: 15
        });
        // add two 90 degree rotations
        var matrix3 = new Snap.Matrix(0, 1, -1, 0, 0, 0);
        var matrix4 = new Snap.Matrix(0, 1, -1, 0, 0, 0);
        result = matrix3.add(matrix4);
        expect(result).to.eql({
            a: -1,
            b: 0,
            c: 0,
            d: -1,
            e: 0,
            f: 0
        });
    });
    it("Matrix.add - numbers", function() {
        var matrix1 = new Snap.Matrix(1, 0, 0, 1, 5, 5);
        var result = matrix1.add(1, 0, 0, 1, 10, 10);
        expect(result).to.eql({
            a: 1,
            b: 0,
            c: 0,
            d: 1,
            e: 15,
            f: 15
        });
    });
    it("Matrix.clone", function() {
        var matrix1 = new Snap.Matrix(1, 2, 3, 4, 5, 6);
        var clone = matrix1.clone();
        expect(clone).to.not.be(matrix1);
        expect(clone).to.eql({
            a: 1,
            b: 2,
            c: 3,
            d: 4,
            e: 5,
            f: 6
        });
    });
    it("Matrix.invert", function() {
        var matrix1 = new Snap.Matrix(1, 2, 3, 4, 5, 6);
        var inverse = matrix1.invert();
        expect(inverse).to.eql({
            a: -2,
            b: 1,
            c: 1.5,
            d: -0.5,
            e: 1,
            f: -2
        });
    });
    it("Matrix.rotate", function() {
        var matrix = new Snap.Matrix(1, 0, 0, 1, 0, 0);
        matrix.rotate(45, 0, 0);
        expect(+matrix.a.toFixed(3)).to.be(0.707);
        expect(+matrix.b.toFixed(3)).to.be(0.707);
        expect(+matrix.c.toFixed(3)).to.be(-0.707);
        expect(+matrix.d.toFixed(3)).to.be(0.707);
        expect(+matrix.e.toFixed(3)).to.be(0);
        expect(+matrix.f.toFixed(3)).to.be(0);
    });
    it("Matrix.scale - x", function() {
        var matrix = new Snap.Matrix(1, 0, 0, 1, 20, 30);
        matrix.scale(2);
        expect(matrix).to.eql({
            a: 2,
            b: 0,
            c: 0,
            d: 2,
            e: 20,
            f: 30
        });
        matrix.scale(0.5);
        expect(matrix).to.eql({
            a: 1,
            b: 0,
            c: 0,
            d: 1,
            e: 20,
            f: 30
        });
    });
    it("Matrix.scale - x, y", function() {
        var matrix = new Snap.Matrix(1, 0, 0, 1, 20, 30);
        matrix.scale(2, 3);
        expect(matrix).to.eql({
            a: 2,
            b: 0,
            c: 0,
            d: 3,
            e: 20,
            f: 30
        });
        matrix.scale(0.5, 1);
        expect(matrix).to.eql({
            a: 1,
            b: 0,
            c: 0,
            d: 3,
            e: 20,
            f: 30
        });
    });
    it("Matrix.scale - x, y, cx, cy", function() {
        var matrix = new Snap.Matrix(1, 0, 0, 1, 20, 30);
        matrix.scale(2, 3, 5, -5);
        expect(matrix).to.eql({
            a: 2,
            b: 0,
            c: 0,
            d: 3,
            e: 15,
            f: 40
        });
    });
    it("Matrix.split", function() {
        var matrix = new Snap.Matrix(1, 0, 0, 1, 0, 0);
        var result = matrix.split();
        expect(result.dx).to.be(0);
        expect(result.dy).to.be(0);
        expect(result.scalex).to.be(1);
        expect(result.scaley).to.be(1);
        expect(result.shear).to.be(0);
        expect(result.rotate).to.be(0);
        expect(result.isSimple).to.be(true);
        
        matrix = new Snap.Matrix(1.5, 0, 0, 0.5, 20, 25);
        result = matrix.split();
        expect(result.dx).to.be(20);
        expect(result.dy).to.be(25);
        expect(result.scalex).to.be(1.5);
        expect(result.scaley).to.be(0.5);
        expect(result.shear).to.be(0);
        expect(result.rotate).to.be(0);
        expect(result.isSimple).to.be(true);
    });
    it("Matrix.toTransformString", function() {
        var matrix = new Snap.Matrix(1.5, 0, 0, 0.5, 20, 25);
        var str = matrix.toTransformString();
        var s = Snap(10, 10);
        var rect = s.rect(0, 0, 10, 20);
        rect.transform(str);
        var transform = rect.transform();
        expect(transform.localMatrix).to.eql({
            a: 1.5,
            b: 0,
            c: 0,
            d: 0.5,
            e: 20,
            f: 25
        });
    });
    it("Matrix.translate", function() {
        var matrix = new Snap.Matrix(1, 0, 0, 1, 20, 30);
        matrix.translate(10, -10);
        expect(matrix).to.eql({
            a: 1,
            b: 0,
            c: 0,
            d: 1,
            e: 30,
            f: 20
        });
        matrix.translate(-1, -2);
        expect(matrix).to.eql({
            a: 1,
            b: 0,
            c: 0,
            d: 1,
            e: 29,
            f: 18
        });
    });
    it("Matrix.x", function() {
        var matrix = new Snap.Matrix(1, 0, 0, 1, 20, 30);
        var result = matrix.x(10, -10);
        expect(result).to.be(30);
    });
    it("Matrix.y", function() {
        var matrix = new Snap.Matrix(1, 0, 0, 1, 20, 30);
        var result = matrix.y(10, -10);
        expect(result).to.be(20);
    });
       
});