/**
 * @class SVG Renderer
 * @author Matthew Wagerfield
 */
FSS.SVGRenderer = function(s) {
  FSS.Renderer.call(this);
  this.element = s.g();
};

FSS.SVGRenderer.prototype = Object.create(FSS.Renderer.prototype);

FSS.SVGRenderer.prototype.setSize = function(width, height) {
  FSS.Renderer.prototype.setSize.call(this, width, height);
  return this;
};

FSS.SVGRenderer.prototype.clear = function() {
  FSS.Renderer.prototype.clear.call(this);
  for (var i = this.element.childNodes.length - 1; i >= 0; i--) {
    this.element.removeChild(this.element.childNodes[i]);
  }
  return this;
};

FSS.SVGRenderer.prototype.render = function(scene) {
  FSS.Renderer.prototype.render.call(this, scene);
  var m,mesh, t,triangle, points, style;

  // Update Meshes
  for (m = scene.meshes.length - 1; m >= 0; m--) {
    mesh = scene.meshes[m];
    if (mesh.visible) {
      mesh.update(scene.lights, true);

      // Render Triangles
      for (t = mesh.geometry.triangles.length - 1; t >= 0; t--) {
        triangle = mesh.geometry.triangles[t];

		if (triangle.polygon.parent() !== this.element) {
			this.element.append(triangle.polygon);
		}
		
        points  = this.formatPoint(triangle.a)+' ';
        points += this.formatPoint(triangle.b)+' ';
        points += this.formatPoint(triangle.c);
        style = this.formatStyle(triangle.color.format());
		
		triangle.polygon.attr({
			points: points,
			style: style
		});
      }
    }
  }
  return this;
};

FSS.SVGRenderer.prototype.formatPoint = function(vertex) {
  return (this.halfWidth+vertex.position[0])+','+(this.halfHeight-vertex.position[1]);
};

FSS.SVGRenderer.prototype.formatStyle = function(color) {
  var style = 'fill:'+color+';';
  style += 'stroke:'+color+';';
  return style;
};
