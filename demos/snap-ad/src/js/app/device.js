define(function (require) {
	
	var Device = function (s, x, y) {
		var instance = this;
		
		this.el = s.g();
		this.matrix = new Snap.Matrix();
		this.matrix.translate(x, y);
		this.el.transform(this.matrix.toTransformString());
		
		this.keyboardMatrix = new Snap.Matrix();
		this.keyboardMatrix.translate(0, 70);
		
		instance.maskElement = s.polygon();
		instance.maskElement.toDefs();
		
		addBack();
		addScreen();
		//addGloss();
		addKeyboard();
		
		function addBack() {
			instance.back = s.rect(0, 0, 0, 0);
			instance.back.attr({
				fill: '#696969'
			});

			instance.el.append(instance.back);	
		}
		
		function addScreen() {
			instance.scr = s.rect(0, 0, 0, 0);
			instance.scr.attr({
				fill: "#09ae8a"
			});

			instance.el.append(instance.scr);
		}
		
		function addKeyboard() {
			var p1,
				p2;
				
			instance.keyboard = s.g();
			instance.keyboard.transform(instance.keyboardMatrix.toTransformString());
			
			p1 = s.polygon('-103.324,0 -135.324,32 136.676,32 104.676,0 ');
			p1.attr({
				fill: '#818181'
			});
			
			p2 = s.polygon('127.774,40 -128.226,40 -136.226,32 135.774,32 ');
			p2.attr({
				fill: '#676767'
			});
			
			instance.keyboard.append(p1);
			instance.keyboard.append(p2);
			instance.el.append(instance.keyboard);
		}
		
		function addGloss() {
			instance.gl = s.rect(0, 0, 0, 0);
			instance.gl.attr({
				opacity: 0.2,
				fill: "white",
				clipPath: instance.maskElement
			});
			
			instance.el.append(instance.gl);
		}
		
		this.hideKeyboard = function () {
			this.keyboardMatrix = new Snap.Matrix();
			instance.keyboardMatrix.translate(0, 50);
			instance.keyboardMatrix.scale(0.01, 0.01, 0, 0);
			instance.keyboard.animate({
				opacity: 0,
				transform: instance.keyboardMatrix.toTransformString()
			}, 100);
		}
		
		this.showKeyboard = function () {
			this.keyboardMatrix = new Snap.Matrix();
			instance.keyboardMatrix.translate(0, 70);
			instance.keyboardMatrix.scale(1, 1, 0, 0);
			instance.keyboard.attr({
				opacity: 1,
				transform: instance.keyboardMatrix.toTransformString()
			});
		}
		
		this.setScreen = function(w, h) {
			this.scr.attr({
				x: -w / 2,
				y: -h / 2,
				width: w,
				height: h
			});
		}
		
		this.setBack = function (w, h) {
			this.back.attr({
				x: -w / 2,
				y: -h / 2,
				width: w,
				height: h
			});
			
			/*
			this.gl.attr({
				x: -w / 2,
				y: -h / 2,
				width: w,
				height: h
			});
			
			var pointString = -w / 2 + ' ' + -h / 2 + ',' + w / 2 + ' ' + -h / 2 + ',' + -w / 2 + ' ' + h / 2;
			
			instance.maskElement.attr({
				points: pointString
			});
			*/
		}
		
		this.setScale = function (scale) {
			this.matrix.scale(scale, scale, 0, 0);
			this.el.transform(this.matrix.toTransformString());
		}
		
		this.animScreen = function(w, h) {
			this.scr.animate({
				x: -w / 2,
				y: -h / 2,
				width: w,
				height: h
			}, 100);
		}
		
		this.animBack = function (w, h) {
			this.back.animate({
				x: -w / 2,
				y: -h / 2,
				width: w,
				height: h
			}, 100);
			
			/*
			this.gl.animate({
				x: -w / 2,
				y: -h / 2,
				width: w,
				height: h
			}, 100);
			
			var pointString = -w / 2 + ' ' + -h / 2 + ',' + w / 2 + ' ' + -h / 2 + ',' + -w / 2 + ' ' + h / 2;
			
			instance.maskElement.attr({
				points: pointString
			});
			*/
		}
		
		this.animRotation = function (r) {
			instance.matrix.rotate(r, 0, 0);
					
			instance.el.animate({
				transform: instance.matrix.toTransformString()
			}, 100, mina.easeIn);
			
			/*
			if (r == 90) {
				var w = 100,
					h = 56,
					pointString = -w / 2 + ' ' + -h / 2 + ',' + w / 2 + ' ' + -h / 2 + ',' + -w / 2 + ' ' + h / 2;
				
				instance.maskElement.attr({
					points: pointString
				});
				
				instance.maskElement.animate({
					transform: 'rotate(-90)'
				}, 100, mina.easeIn);
			} else {
				instance.maskElement.animate({
					transform: 'rotate(0)'
				}, 100, mina.easeIn);
			}
			*/
		}
		
		this.animScale = function (scale, dur, ease) {
			dur = dur ? dur : 100;
			ease = ease ? ease : mina.easeout;
			
			this.matrix.scale(scale, scale, 0, 0);
			this.el.animate({
				transform: this.matrix.toTransformString()
			}, dur, ease);
		}
		
		this.animOpacity = function (opacity, dur) {
			dur = dur ? dur : 200;
			
			this.el.animate({
				opacity: opacity
			}, dur);
		}
		
		this.setOpacity = function (opacity) {			
			this.el.attr({
				opacity: opacity
			});
		}
	}
	
	return Device;
});