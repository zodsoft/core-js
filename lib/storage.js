
/* Storage */

function Storage(app, config) {
  
  this.constructor.prototype.__construct.call(this, app, config);
  
}

/* Storage::prototype */

framework.extend(Storage.prototype, new function() {
  
  /* Storage API */

  // Backend configuration
  this.config = {};
  
  // Backend client
  this.client = null;
  
  /**
    Gets one or more records from the storage backend
    
    a) If a key is a string: provides [err, value]
    b) If a key is an array: provides [err, results] 
    
    @param {string|array} key
    @param {function} callback
    @public
   */
  
  this.get = function(key, callback) {

  }
  
  /**
    Inserts one or more records into the storage backend
    
    Provides: [err]
    
    Key can be either a string or an object containing key/value pairs
    
    @param {string|object} key
    @param {string} value (optional)
    @param {function} callback
    @public
   */
  
  this.set = function(key, value, callback) {

  }
  
  /**
    Deletes one or more records from the storage backend
    
    Provides: [err]
    
    @param {string|array} key
    @param {function} callback
    @public
   */
  
  this.delete = function(key, callback) {

  }
  
});

module.exports = Storage;
