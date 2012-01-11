
/* Model */

function Model(app) {
  
  this.constructor.prototype.__construct.call(this, app);
  
}

/* Model::prototype */

framework.extend(Model.prototype, new function() {
  
  var util = require('util'),
      slice = Array.prototype.slice;
  
  // Constructor
  this.__construct = function(app) {
    this.app = app;
    this.className = this.constructor.name;
    framework.util.onlySetEnumerable(this, ['className']);
  }
  
  // Defines model properties
  this.properties = {};
  
  // Defines model relationships
  this.relationships = {
    hasOne: null,
    hasMany: null
  };
  
  this.get = function(ob) {
    if (typeof ob == 'number') ob = {id: ob};
  }
  
});

module.exports = Model;
