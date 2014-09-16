define(function (require) {
		
	var Logo = function (s) {
		var instance = this,
			logo,
			parts = [
				['top', 0, 20], 
				['left', 20, 0], 
				['bottom', 0, -20],
				['right', -20, 0]
			],
			components = [],
			i = 0,
			k = 0,
			isLogoAnimated = false,
			isCrocAnimated = false,
			isCroc2Animated = false;
		
		logo = s.select("#snap-logo");

		for (i = 0; i < parts.length; i++) {
			var el = parts[i]
			elid = el[0];
			element = logo.select("#snap-logo-" + elid);
			element.attr({opacity:0, transform: "t" + (el[1]) + "," + (el[2])});
		    components.push(element);
		}

		function animateEach() {
			if (!components[k]) {
				return;
			}
		    components[k].animate({ 
		        transform: "t" + (0) + "," + (0),
		        opacity: 1
		    }, 250, mina.easeout);
			setTimeout(animateEach, 150);
			k++;
		};
		
		this.animate = function () {
			setTimeout(animateEach, 150);
		}
		
		this.show = function () {
			var i;
			
			for (i = 0; i < components.length; i += 1) {
				components[i].attr({ 
			    	transform: "t" + (0) + "," + (0),
			    	opacity: 1
			    });
			}
		    
		}
	}
	
	return Logo;
});