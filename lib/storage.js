
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
    Gets a record from the storage backend
    
    Provides: [err, results]
    
    @param {string} key
    @param {function} callback
    @public
   */
  
  this.get = function(key, callback) {
    callback.call(this, null, {});
  }
  
  /**
    Inserts a record into the storage backend
    
    Provides: [err, success]
    
    @param {string} key
    @param {function} callback
    @public
   */
  
  this.set = function(key, callback) {
    callback.call(this, null, true);
  }
  
  /**
    Deletes a record from the storage backend
    
    Provides: [err, success]
    
    @param {string} key
    @param {function} callback
    @public
   */
  
  this.delete = function(key, callback) {
    callback.call(this, null, true);
  }
  
});

module.exports = Storage;
