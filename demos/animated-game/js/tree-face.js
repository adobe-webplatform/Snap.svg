
var TreeFace = Backbone.View.extend({
	initialize: function () {
		this.s = this.options.s;
		this.el = this.options.tree;
		
		this.addFace();
		
		/*
		setTimeout(function () {
			this.face.attr({
				'class': 'face animating'
			});
		}.bind(this), Math.random() * 2000 );
		*/
		
		this.hitarea = this.s.circle(0, 0, 40);
		this.hitarea.attr({
			fill: 'transparent',
			'class': 'hit-area'
		});
		this.face.add(this.hitarea);
		this.hitarea.mouseover(this.handle_MOUSEOVER.bind(this));
		this.hitarea.mouseout(this.handle_MOUSEOUT.bind(this));
	},
	
	handle_MOUSEOVER: function () {
		this.face.attr({
			'class': 'face animating'
		});	
	},
	
	handle_MOUSEOUT: function () {
		this.face.attr({
			'class': 'face'
		});
	},
	
	addFace: function () {
		var mouth,
			eye,
			ey2,
			matrix;
		
		this.face = this.s.g();
		this.face.attr({
			'class': 'face'
		});
		/*
		mouth = this.s.circle(0, 5, 4);
		mouth.attr({fill: 'black', 'class': 'mouth'});
		this.face.add(mouth);
		*/
		eye = this.s.path('M-2.75-6.75c0,0-2.537,2.5-5.667,2.5s-5.667-2.5-5.667-2.5s2.537-2.5,5.667-2.5S-2.75-6.75-2.75-6.75z');
		eye.attr({fill: 'white', 'class': 'eye left'});
		this.face.add(eye);
		
		eye2 = this.s.path('M14.583-6.75c0,0-2.537,2.5-5.667,2.5S3.25-6.75,3.25-6.75s2.537-2.5,5.667-2.5S14.583-6.75,14.583-6.75z');
		eye2.attr({fill: 'white', 'class': 'eye right'});
		this.face.add(eye2);
		
		matrix = new Snap.Matrix();
		box = this.el.getBBox();
		matrix.translate(box.cx, box.cy);
		matrix.scale(box.r2 / 40);
		
		this.face.transform(matrix.toTransformString());
		this.el.add(this.face);
	},
});
