/**
 * @class Vertex
 * @author Matthew Wagerfield
 */
FSS.Vertex = function(x, y, z) {
  this.position = FSS.Vector3.create(x, y, z);
};

FSS.Vertex.prototype = {
  setPosition: function(x, y, z) {
    FSS.Vector3.set(this.position, x, y, z);
    return this;
  }
};
