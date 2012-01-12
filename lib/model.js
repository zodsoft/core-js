
/* Model */

function Model(app) {
  
  this.constructor.prototype.__construct.call(this, app);
  
}

/* Model::prototype */

framework.extend(Model.prototype, new function() {
  
  var _s = require('underscore.string'),
      util = require('util'),
      slice = Array.prototype.slice;
  
  // Constructor
  this.__construct = function(app) {
    
    // Exit if drivers are not ready yet
    if (typeof app == 'undefined' || typeof app.drivers.default == 'undefined') return;
    
    var name;
    this.app = app;
    name = this.driver = (this.driver || app.config.database.default);

    // 1. Get driver
    this.driver = app.getResource('drivers/' + this.driver);
    
    if (typeof this.driver == 'undefined') {
      throw new Error(util.format("Driver config not found: '%s'", name));
    }
    
    // 2. Connect driver with self
    this.driver.provideTo(this);
    
    // 3. Set classname
    this.className = this.constructor.name;
    
    // 4. set context
    this.context = getContext(this.className);
    
    framework.util.onlySetEnumerable(this, ['className']);
  }
  
  // Defines local model validation rules
  this.validation = {};
  
  // Defines model properties
  this.properties = {};
  
  // Defines model relationships
  this.relationships = {
    hasOne: null,
    hasMany: null
  };
  
  /**
    Returns the model context, analogous to the table, collection, etc.
   */
  
  function getContext(string) {
    return _s.dasherize(string)
    .slice(1)
    .replace(/-/g,'_')
    .replace(/_model$/, '');
  }
  
});

module.exports = Model;
