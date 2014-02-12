define(function (require) {
	
	var Burst = function (s, x, y) {
		var instance = this,
			polygons,
			mask,
			maskCircle,
			maskBg;
		
		this.el = s.select("#burst");
		
		mask = s.g();
		mask.toDefs();
		
		maskBg = s.rect(-200, -200, 400, 400);
		maskBg.attr({
			fill: 'white'
		});
		mask.append(maskBg);
		
		maskCircle = s.circle(0, 0, 30);
		mask.append(maskCircle);
		
		this.el.attr({
			mask: mask
		});
		
		this.anim = function () {
			this.el.animate({
				opacity: 1
			}, 100);
			
			maskCircle.animate({
				transform: 'scale(6)'
			}, 300);
			
			setTimeout(function () {
				instance.el.animate({
					opacity: 0
				}, 100);
			}, 300)
		}
		
		this.reset = function () {
			maskCircle.attr({
				transform: 'scale(1)'
			});
		}
	}
	
	return Burst;
});