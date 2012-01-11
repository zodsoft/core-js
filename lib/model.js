
/* Model */

function Model(app) {
  
  this.constructor.prototype.__construct.call(this, app);
  
}

/* Model::prototype */

framework.extend(Model.prototype, new function() {
  
  var util = require('util');
  
  // Constructor
  this.__construct = function(app, driver, config) {
    if (typeof app == 'undefined' || typeof driver == 'undefined') return;
    this.app = app;
    this.driver = (typeof driver == 'string') ? app.driver(driver, config) : driver;
    this.driver.provideTo(this);
    this.className = this.constructor.name;
    framework.util.onlySetEnumerable(this, ['className']);
  }
  
  // Model API methods & properties
  
  // Model's properties
  this.properties = {};
  
  /**
    Provides a `has one` relationship
    
    @param {string} context
    @public
   */
  
  this.hasOne = function(context) {
    if (util.isArray(context)) context = context[0];
    // ...
  }
  
  /**
    Provides a `has many` relationship
    
    @param {string} context
    @public
   */

  this.hasMany = function(contexts) {
    if (typeof contexts == 'string') contexts = [contexts];
    // ...
  }
  
});

module.exports = Model;
