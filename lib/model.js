
/* Model Generator */

function Model(app) {
  
  // For the Model API, refer to lib/driver.js
  
  this.constructor.prototype.__construct.call(this, app);
  
}

/* Model::prototype */

framework.extend(Model.prototype, new function() {
  
  var _ = require('underscore'),
      _s = require('underscore.string'),
      util = require('util'),
      slice = Array.prototype.slice;
  
  // Constructor
  this.__construct = function(app) {
    
    // Exit if drivers are not ready yet
    if (typeof app == 'undefined' || typeof app.drivers.default == 'undefined') return;
    
    var name, validation;
    this.app = app;
    name = this.driver = (this.driver || app.config.database.default);

    // 1. Get driver
    this.driver = app.getResource('drivers/' + this.driver);
    
    if (typeof this.driver == 'undefined') {
      throw new Error(util.format("Driver config not found: '%s'", name));
    }
    
    // 2. Extend validation
    validation = _.extend({}, this.__validation);
    this.validation = _.extend(validation, this.validation || {});    
    
    // 3. Connect driver with self
    this.driver.provideTo(this);
    
    // 4. Set classname
    this.className = this.constructor.name;
    
    // 5. set context
    this.context = getContext(this.className);
    
    framework.util.onlySetEnumerable(this, ['className']);
  }
  
  // Defines local model validation rules
  this.__validation = {
    
    // Validates timestamps against native JavaScript `Date`
    timestamp: function(date) {
      return Date.parse(date) !== NaN;
    }
    
  };
  
  // Defines model properties
  this.properties = {};
  
  // Defines model relationships
  this.relationships = {
    hasOne: null,
    hasMany: null
  };
  
  /**
    Validates model properties
    
    @param {object} o
    @private
   */
  
  this.__validateProperties = function(o) {
    var key, regex, prop, validates, required,
        app = this.app,
        properties = this.properties,
        unableToValidate = "%s: Unable to validate '%s': %s";

    for (key in properties) {
      prop = properties[key];
      
      // Check required property
      required = prop.required;
      if (typeof required == 'boolean' && required && !o.hasOwnProperty(key)) {
        throw new Error(util.format("%s: '%s' is required", this.className, key));
      }
      
      // Check if property is valid
      validates = prop.validates;
      if (typeof validates != 'undefined') {
        if (validates instanceof RegExp) {
          // Regex validation
          if (! validates.test(o[key])) {
            throw new Error(util.format(unableToValidate, this.className, key, o[key].toString()));
          }
        } else if (typeof validates == 'string') {
          regex = this.validation[validates] || app.regex[validates];
          if (regex instanceof RegExp) {
            // Regexp alias validation
            if (! regex.test(o[key])) {
              throw new Error(util.format(unableToValidate, this.className, key, o[key].toString()));
            }
          } else if (regex instanceof Function) {
            // Function validation
            if (regex(o[key]) !== true) {
              throw new Error(util.format(unableToValidate, this.className, key, o[key].toString()));
            }
          } else {
            throw new Error(util.format("%s: Can't find regex: '%s'", this.className, validates));
          }
        } else {
          throw new Error(util.format("%s: Wrong validation data for '%s': %s", this.className, key, 
            validates.toString()));
        }
      }
    }
    console.exit('here');
  }
  
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
