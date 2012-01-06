
/* Storage */

function Storage(app, config) {
  
  this.constructor.prototype.__construct.call(this, app, config);
  
}

/* Storage::prototype */

framework.extend(Storage.prototype, new function() {
  
  // Constructor
  this.__construct = function(app, config) {
    if (app == undefined) return;
    this.app = app;
    this.config = config;
    this.className = this.constructor.name;
    framework.util.onlySetEnumerable(this, ['className']);
  }
  
  /* Storage API */

  // Backend configuration
  this.config = {};
  
  // Backend client
  this.client = null;
  
  /**
    Gets one or more records from the storage backend
    
    Provides: [err, results]
    
    @param {string|array} key
    @param {function} callback
    @public
   */
  
  this.get = function(key, callback) {
    callback.call(this, null, {});
  }
  
  /**
    Inserts one or more records into the storage backend
    
    Provides: [err, success]
    
    @param {string|object} key
    @param {string} value (optional)
    @param {function} callback
    @public
   */
  
  this.set = function(key, value, callback) {
    callback.call(this, null, true);
  }
  
  /**
    Deletes one or more records from the storage backend
    
    Provides: [err, success]
    
    @param {string|array} key
    @param {function} callback
    @public
   */
  
  this.delete = function(key, callback) {
    callback.call(this, null, true);
  }
  
});

module.exports = Storage;
