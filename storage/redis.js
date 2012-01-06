
/* RedisStorage 

   options:
   
    {
      host: 'localhost',
      port: 6379
      db: 1
    }

*/

function RedisStorage(app, config) {
  
  this.constructor.prototype.__construct.call(this, app, config);
  
}

/* RedisStorage::prototype */

framework.extend(RedisStorage.prototype, new function() {
  
  var redis = require('redis');

  this.options = {
    parser: 'hiredis'
  }
  
  // Constructor
  this.__construct = function(app, config) {
    this.app = app;
    this.config = config;
    this.className = this.constructor.name;
    
    // Set redis client
    this.client = redis.createClient(config.port, config.host, this.options);
    
    // Automatically select db if specified
    if (typeof config.db == 'number' && config.db !== 0) {
      this.client.select(config.db, function(err, res) {
        if (err) throw err;
      });
    }
    
    // Set enumerable properties
    framework.util.onlySetEnumerable(this, ['className', 'config']);
  }
  
  this.get = function(key, callback) {
    
  }
  
  this.set = function(key, value, callback) {
    
  }
  
  this.delete = function(key, callback) {
    
  }
  
});

module.exports = RedisStorage;
