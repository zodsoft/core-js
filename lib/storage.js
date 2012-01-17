
/* Storage API */

var Multi = framework.require('./lib/multi');

function Storage() {
  
}

// Backend configuration
Storage.prototype.config = {};

// Backend client
Storage.prototype.client = null;

/**
  Retrieves one or more records from the storage backend
  
  a) If a key is a string: provides [err, value]
  b) If a key is an array: provides [err, results] 
  
  @param {string|array} key
  @param {function} callback
  @public
 */

Storage.prototype.get = function(key, callback) {
  
}

/**
  Retrieves a hash from the storage backend
  
  Provides: [err, hash]
  
  @param {string|array} key
  @param {function} callback
  @public
 */

Storage.prototype.getHash = function(key, callback) {
  
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

Storage.prototype.set = function(key, value, callback) {

}

/**
  Inserts a hash (object) into the storage backend
  
  Provides: [err]
  
  @param {string} key
  @param {object} hash
  @param {function} callback
  @public
 */
 
Storage.prototype.setHash = function(key, object, callback) {
  
}

/**
  Updates a hash with new values in object
  
  Provides [err]
  
  @param {string} key
  @param {object} object
  @param {function} callback
 */

Storage.prototype.updateHash = function(key, object, callback) {
  
}

/**
  Deletes one or more keys from a specific hash
  
  Provides [err]
  
  @param {string} hash
  @param {string} key
  @param {function} callback
  @public
 */

Storage.prototype.deleteFromHash = function(hash, key, callback) {}

/**
  Deletes one or more records from the storage backend
  
  Provides: [err]
  
  @param {string|array} key
  @param {function} callback
  @public
 */
 
Storage.prototype.delete = function(key, callback) {

}

/**
  Renames a key
  
  Provides: [err]
  
  @param {string} oldKey
  @param {string} newKey
 */
 
Storage.prototype.rename = function(oldkey, newkey, callback) {

}

/**
  Makes a specific key expire in a certain amount of time
  
  Provides: [err]
  
  @param {string} key
  @param {int} timeout
  @param {function} callback
  @public
 */
 
 Storage.prototype.expire = function(key, timeout, callback) {
   
 }
 
/**
   Allows execution of multiple storage operations
   
   @param {object} config
   @public
*/
  
 Storage.prototype.multi = function(config) {
   return new Multi(this, config);
 }
   
module.exports = Storage;
