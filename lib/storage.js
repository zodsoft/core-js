
/* Storage */

function Storage() {
  
}

/* Storage::prototype */

framework.extend(Storage.prototype, new function() {
  
  /* Storage API */
  
  var Multi = framework.require('./lib/multi');
  
  // Backend configuration
  this.config = {};
  
  // Backend client
  this.client = null;
  
  /**
    Retrieves one or more records from the storage backend
    
    a) If a key is a string: provides [err, value]
    b) If a key is an array: provides [err, results] 
    
    @param {string|array} key
    @param {function} callback
    @public
   */
  
  this.get = function(key, callback) {
    
    /* TODO: add automatic typecasting */
    
  }

  /**
    Retrieves a hash from the storage backend
    
    @param {string|array} key
    @param {function} callback
    @public
   */
  
  this.getHash = function(key, callback) {
    
    /* TODO: add automatic typecasting */
    
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
    Inserts a hash (object) into the storage backend
    
    Provides: [err]
    
    @param {string} key
    @param {object} hash
    @param {function} callback
    @public
   */
   
  this.setHash = function(key, object, callback) {
    
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
  
  /**
    Renames a key
    
    Provides: [err]
    
    @param {string} oldKey
    @param {string} newKey
   */
   
  this.rename = function(oldkey, newkey, callback) {

  }
  
  /**
    Makes a specific key expire in a certain amount of time
    
    @param {string} key
    @param {int} timeout
    @public
   */
   
   this.expire = function(key, timeout) {
     
   }
   
   /**
     Allows execution of multiple storage operations
    */
    
   this.multi = function(config) {
     return new Multi(this, config);
   }
   
});

module.exports = Storage;
