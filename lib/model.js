
/* Model */

function Model(app) {
  
  this.constructor.prototype.__construct.call(this, app);
  
}

/* Model::prototype */

framework.extend(Model.prototype, new function() {
  
  var util = require('util');
  
  // Constructor
  this.__construct = function(app) {
    this.app = app;
    this.className = this.constructor.name;
    framework.util.onlySetEnumerable(this, ['className']);
  }
  
  // Model API methods & properties
  
  // Defines model properties
  this.properties = {};
  
  // Defines model relationships
  this.relationships = {
    hasOne: null,
    hasMany: null
  };
  
});

module.exports = Model;
