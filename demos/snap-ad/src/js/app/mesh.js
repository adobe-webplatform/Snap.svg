define(function (require) {
	
	require('vendor/fss');
	
	var Mesh = function (s, container, colorA, colorB) {
		var instance = this,
			_width = 440,
			_height = 440,
			now,
			start = Date.now(),
			renderer,
			scene,
			geometry,
			material,
			mesh,
			light;
		
		instance.animating = false;
		
		instance.init = function () {
			renderer = new FSS.SVGRenderer(s);
			renderer.setSize(_width, _height);
			renderer.element.transform('translate(-20, -20)'); //keep edges from showing
			
			instance.el = renderer.element;
			
			container.append(renderer.element);

			scene = new FSS.Scene();
			material = new FSS.Material(colorA, colorB);
		    geometry = new FSS.Plane(_width, _height, 10, 10, s, material);
			mesh = new FSS.Mesh(geometry, material);
			scene.add(mesh);

			light = new FSS.Light('#eeeeee', '#eeeeee');
			light.setPosition(300*Math.sin(0.001), 200*Math.cos(0.0005), 100);
			scene.add(light);

			now = Date.now() - start;

			tweakMesh();
			distortMesh();			
			renderer.render(scene);
		}
		
		instance.start = function () {
			instance.animating = true;
			animate();
		}
		
		instance.stop = function () {
			instance.animating = false;
		}
		
		instance.setColor = function (colorA, colorB) {
			var i;
			
			material = new FSS.Material(colorA, colorB);
			
			for (i = geometry.triangles.length - 1; i > -1; i -= 1) {	
				geometry.triangles[i].material = material;
			}
			
			animate();
		}
		
		instance.rippleColor = function (colorA, colorB) {
			var i;
			
			material = new FSS.Material(colorA, colorB);

			function colorTriangle(j) {
				geometry.triangles[j].material = material;

				if (j == 0) {
					setTimeout(function () {
						animate();
					}, 10); //force clear
				}
			}

			for (i = geometry.triangles.length - 1; i > -1; i -= 1) {								
				var speed = 200 + Math.sin(0.1 + Math.abs(geometry.triangles[i].centroid[0] / geometry.triangles[i].centroid[1])) * 100;
				setTimeout(colorTriangle, speed * 2, i);
			}			
		}
		
		
		function tweakMesh() {
			var v, vertex;
			
			for (v = geometry.vertices.length - 1; v >= 0; v--) {
			      vertex = geometry.vertices[v];
			      vertex.anchor = FSS.Vector3.clone(vertex.position);
			      vertex.step = FSS.Vector3.create(
			        Math.randomInRange(0.2, 1.0),
			        Math.randomInRange(0.2, 1.0),
			        Math.randomInRange(0.2, 1.0)
			      );
				vertex.time = Math.randomInRange(0, Math.PIM2);
			}
		}
		
		function distortMesh() {
			var v,
				vertex,
				ox, oy, oz,
				offset = 10 / 2;
			
			for (v = geometry.vertices.length - 1; v >= 0; v--) {
		      vertex = geometry.vertices[v];
		      ox = Math.sin(vertex.time + vertex.step[0] * now * 0.002);
		      oy = Math.cos(vertex.time + vertex.step[1] * now * 0.002);
		      oz = Math.sin(vertex.time + vertex.step[2] * now * 0.002);
		      FSS.Vector3.set(vertex.position,
		        0.2 * geometry.segmentWidth * ox,
		        0.1 * geometry.sliceHeight * oy,
		        0.7 * offset * oz - offset);
		      FSS.Vector3.add(vertex.position, vertex.anchor);
		    }

		    geometry.dirty = true;
		}
	
		function animate() {
			now = Date.now() - start;
			
			if (mobilecheck() !== true) {
				distortMesh();
			}
			
			renderer.render(scene);
			
			if (instance.animating !== false) {
				requestAnimationFrame(animate);
			}
		}
		
		instance.init();
	}
	
	return Mesh;
});