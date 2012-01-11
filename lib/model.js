
/* Model */

function Model(app) {
  
  this.constructor.prototype.__construct.call(this, app);
  
}

/* Model::prototype */

framework.extend(Model.prototype, new function() {
  
  // Constructor
  this.__construct = function(app, driver, config) {
    if (typeof app == 'undefined' || typeof driver == 'undefined') return;
    this.app = app;
    this.driver = (typeof driver == 'string') ? app.driver(driver, config) : driver;
    this.driver.provideTo(this);
    this.className = this.constructor.name;
    framework.util.onlySetEnumerable(this, ['className']);
  }
  
  // Model API methods
  
  this.hasOne = function() {
    
  }
  
  this.hasMany = function() {
    
  }
  
});

module.exports = Model;
