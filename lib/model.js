
/* Model Generator */

function Model(app) {
  
  // TODO: Use cache
  
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
    
    var ModelObject, name, validation;
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
    
    // 5. Set context
    this.context = getContext(this.className);
    
    // 6. ModelObject prototype
    this.modelObjectProto = new (createModelObject.call(this));
    
    framework.util.onlySetEnumerable(this, ['className']);
  }
  
  // Defines model properties
  this.properties = {};
  
  // Defines model relationships
  this.relationships = {
    hasOne: null,
    hasMany: null
  };
  
  // Defines local model validation rules
  this.__validation = {
    
    // Validates timestamps against native JavaScript `Date`
    timestamp: function(date) {
      return ! isNaN(Date.parse(date));
    }
    
  };
  
  /**
    Creates a model object
    
    @param {array|object} obArr
    @returns {array} models
    @private
   */
   
  this.__createModel = function(ob) {
    var ob, key, 
        descriptor = {}, 
        proto = this.modelObjectProto;
    
    // Add property descriptors
    for (key in ob) {
      descriptor[key] = {value: ob[key], writable: true, enumerable: true, configurable: true};
    }
    
    // Create __currentState object
    descriptor['__currentState'] = {value: ob, writable: false, enumerable: false, configurable: false}
    
    // Create ModelObject
    ob = Object.create(proto, descriptor);
    
    // Freeze object current state
    Object.freeze(ob.__currentState);
    
    return ob;
  }
  
  /**
    Checks if an object contains properties found in model
    
    @param {object} o
    @private
   */
   
  this.__propertyCheck = function(o) {
    var key, len, badProperties = [],
        properties = this.properties;
    
    // Check if properties in `o` are valid
    for (key in o) {
      if (! properties.hasOwnProperty(key)) badProperties.push(key);
    }
    
    if ((len=badProperties.length) == 1) {
      throw new Error(util.format("%s: Property does not belong to model: '%s'", 
        this.className, badProperties[0]));
    } else if (len > 1) {
      throw new Error(util.format("%s: Properties do not belong to model: [%s]", 
        this.className, badProperties.join(', ')));
    }
  }
  
  /**
    Validates model properties
    
    @param {object} o
    @param {boolean} checkRequired
    @private
   */
  
  this.__validateProperties = function(o, options) {
    var key, val, regex, prop, validates, required, len, err = false,
        badProperties = [],
        app = this.app,
        properties = this.properties,
        unableToValidate = "%s: Unable to validate '%s': %s";
    
    // Parse options
    options = options || {};
    noRequired = options.noRequired;
    returnErrors = options.returnErrors;

    // Check properties
    this.__propertyCheck(o);

    for (key in properties) {
      prop = properties[key];

      // Check for required property
      if (!noRequired && prop.required && !o.hasOwnProperty(key)) {
        err = new Error(util.format("%s: '%s' is required", this.className, key));
        if (returnErrors) return err; else throw err;
      }
      
      // Check if property is valid
      validates = prop.validates;
      if (key in o && typeof validates != 'undefined') {
        val = o[key];
        if (validates instanceof RegExp) {
          // Regex validation
          if (! validates.test(val)) {
            err = new Error(util.format(unableToValidate, this.className, key, val));
            if (returnErrors) return err; else throw err;
          }
        } else if (typeof validates == 'string') {
          regex = this.validation[validates] || app.regex[validates];
          if (regex instanceof RegExp) {
            // Regexp alias validation
            if (! regex.test(val)) {
              err = new Error(util.format(unableToValidate, this.className, key, val));
              if (returnErrors) return err; else throw err;
            }
          } else if (regex instanceof Function) {
            // Function validation
            if (!regex(val)) {
              err = new Error(util.format(unableToValidate, this.className, key, val));
              if (returnErrors) return err; else throw err;
            }
          } else {
            // Regex can't be found
            err = new Error(util.format("%s: Can't find regex: '%s'", this.className, validates));
            if (returnErrors) return err; else throw err;
          }
        } else {
          // Wrong validation data provided
          validates = (validates === null) ? 'null' : validates.toString();
          err = new Error(util.format("%s: Wrong validation data for '%s': %s", this.className, key, validates));
          if (returnErrors) return err; else throw err;
        }
      }
    }
    
    if (returnErrors) return null;
    
  }
  
  /**
    Creates the ModelObject class
    
    @returns {function} ModelObject
   */
  
  function createModelObject() {
    var key, method,
        self = this;
    
    function ModelObject() {
      this.className = self.className + 'Object';
    }
    
    /* Model Generator */
    ModelObject.prototype.generator = this;
    
    /* Save model data */
    ModelObject.prototype.save = function(cdata, callback) {
      if (typeof callback == 'undefined') callback = cdata, cdata = {};
      
      var key, val, valid, err,
          self = this,
          diff = 0,
          update = {},
          generator = this.generator;

      for (key in this.__currentState) {
        val = this[key];
        if (val !== this.__currentState[key]) {
          update[key] = val, diff++;
        }
      }
      
      // No changes
      if (diff == 0) { callback.call(self, null); return; }
      
      // Validate data prior to sending to the driver
      err = generator.__validateProperties(update, {noRequired: true, returnErrors: true});
      
      if (err) callback.call(this, err);
      else {
        // Perform driver save
        update.id = this.__currentState.id;
        generator.save(update, cdata, function(err) {
          callback.call(self, err);
        });
      }
    }
    
    /* Delete model data */
    ModelObject.prototype.delete = function(cdata, callback) {
      
    }
    
    return ModelObject;
    
  }

  /**
    Returns the model context, analogous to the table, collection, etc.
    
    @param {string} string
    @returns {string} context
    @private
   */
  
  function getContext(string) {
    return _s.dasherize(string)
    .slice(1)
    .replace(/-/g,'_')
    .replace(/_model$/, '');
  }

});

module.exports = Model;
