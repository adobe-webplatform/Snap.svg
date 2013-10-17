var PathAnimal = Backbone.View.extend({
	initialize: function () {
		var _x,
			_y,
			PATHS = [
				'M0,0c0,0,0-28.008,0-46.707S0-89,0-89',
				'M0,0c0,0-9.634-22.317,10-46.707S50-69,50-69',
				'M0,0c0,0,17.52-24.431,0-56.707S-50-99-50-99'
			];
		
		this.s = this.options.s;
		this.dot = this.options.dot;
		_x = this.dot.attr('cx');
		_y = this.dot.attr('cy');
		
		this.el = this.s.g();
		
		this.path = this.s.path(PATHS[Math.floor(Math.random() * PATHS.length)]);
		this.totalLength = this.dashOffset = this.path.getTotalLength();

		this.path.attr({
			fill: 'none',
			stroke: this.dot.attr('fill'),
			strokeWidth: 25,
			strokeMiterlimit: 10,
			strokeLinecap: 'round',
			opacity: 1,
			strokeDasharray: this.totalLength + " 200",
			strokeDashoffset: this.totalLength
		});
		this.el.add(this.path);
		
		this.el.transform("t" + [_x, _y]);
		
		this.hitarea = this.s.circle(_x, _y, 30);
		this.hitarea.attr({
			fill: 'transparent',
			'class': 'hit-area'
		});
		this.hitarea.mouseover(this.handle_MOUSEOVER.bind(this));
		this.hitarea.mouseout(this.handle_MOUSEOUT.bind(this));
		
		this.addFace();
	},
	
	addFace: function () {
		var mouth,
			eye,
			ey2;
		
		this.face = this.s.g();
		this.face.attr({
			'class': 'face'
		});
		
		mouth = this.s.circle(0, 5, 4);
		mouth.attr({fill: 'black', 'class': 'mouth'});
		this.face.add(mouth);
		
		eye = this.s.path('M-2.75-6.75c0,0-2.537,2.5-5.667,2.5s-5.667-2.5-5.667-2.5s2.537-2.5,5.667-2.5S-2.75-6.75-2.75-6.75z');
		eye.attr({fill: 'white', 'class': 'eye left'});
		this.face.add(eye);
		
		eye2 = this.s.path('M14.583-6.75c0,0-2.537,2.5-5.667,2.5S3.25-6.75,3.25-6.75s2.537-2.5,5.667-2.5S14.583-6.75,14.583-6.75z');
		eye2.attr({fill: 'white', 'class': 'eye right'});
		this.face.add(eye2);
		
		this.face.transform("s.6");
		this.el.add(this.face);
	},
	
	handle_MOUSEOVER: function () {
		var instance = this;
        
		this.face.attr({
			'class': 'face animating'
		});
        Snap.animate(this.dashOffset, 0, function (val) {
            instance.dashOffset = val;
            instance.render();
        }, 500);
	},
	
	handle_MOUSEOUT: function () {
		var instance = this;
        
		this.face.attr({
			'class': 'face'
		});
        Snap.animate(this.dashOffset, this.totalLength, function (val) {
            instance.dashOffset = val;
            instance.render();
        }, 500);
	},
	
	render: function () {
		var point;
		
		this.path.attr({
			'stroke-dashoffset': this.dashOffset
		});
		
		point = this.path.getPointAtLength(this.totalLength - this.dashOffset);
		this.face.transform("t" + [point.x, point.y] + "s.6");
	}
});