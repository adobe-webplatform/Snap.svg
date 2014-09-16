define(function (require) {
	
	var Heart = function (s, x, y) {
		var instance = this,
			heart,
			heartMatrix,
			totalMaskVertices = 50;
		
		this.el = s.select("#heart");
		heart = this.el.select('#heart-shape');
		
		instance.maskElement = s.path(getPath(totalMaskVertices));		
		instance.el.attr({
			clipPath: instance.maskElement
		});
		
		this.animFill = function (f, dur) {
			heart.animate({
				fill: f
			}, 200);
		}
		
		this.setFill = function (f, dur) {
			heart.attr({
				fill: f
			}, 200);
		}
		
		this.animScale = function (scale, dur) {
			dur = dur ? dur : 300;
			
			this.matrix = new Snap.Matrix();
			this.matrix.translate(x, y);
			this.matrix.scale(scale);
			this.el.animate({
				transform: this.matrix.toTransformString()
			}, dur, mina.bounce);
		}
		
		this.setScale = function (scale, dur) {
			dur = dur ? dur : 300;
			
			this.matrix = new Snap.Matrix();
			this.matrix.translate(x, y);
			this.matrix.scale(scale, scale, 0, 0);
			this.el.attr({
				transform: this.matrix.toTransformString()
			});
			
		}
		
		this.mask = function () {
			var n = totalMaskVertices;
			
			instance.maskElement.attr({
				d: getPath(n)
			});
			
			function updatePath() {
				n -= 1;
				instance.maskElement.attr({
					d: getPath(n)
				});
				
				if (n > 0) {
					setTimeout(updatePath, 10);
				}
			}
		
			setTimeout(updatePath, 10);
		}
		
		this.unmask = function () {
			instance.maskElement.attr({
				d: getPath(totalMaskVertices)
			});
		}
		
		function getPath(n) {
			var pathString,
				i,
				_x,
				_y;
			
			pathString = "M0 0";
			
			for (i = 0; i < n + 1; i += 1) {
				a = 2 * Math.PI * i / totalMaskVertices;
                a += Math.PI;

				_x = Math.sin(a) * 50;
				_y = Math.cos(a) * 50;
				
				pathString += "L" + _x + " " + _y;
			}
			
			pathString += "Z";
			return pathString;
		}
	}
	
	return Heart;
});