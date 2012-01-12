
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
    
    if (typeof this.driver == 'string') {
      var name = this.driver;
      this.driver = app.getResource('drivers/' + this.driver);
      if (typeof this.driver == 'undefined') {
        throw new Error(util.format("Driver config not found: '%s'", name));
      }
    }
    
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
