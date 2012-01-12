
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
    
    // Exit if drivers are not ready yet
    if (typeof app == 'undefined' || typeof app.drivers.default == 'undefined') return;
    
    var name;
    this.app = app;
    name = this.driver = (this.driver || app.config.database.default);

    this.driver = app.getResource('drivers/' + this.driver);
    
    if (typeof this.driver == 'undefined') {
      throw new Error(util.format("Driver config not found: '%s'", name));
    }
    
    this.driver.provideTo(this);
    
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
