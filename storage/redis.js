
/* RedisStorage 

   options:
   
    {
      host: 'localhost',
      port: 6379,
      db: 1,
      pass: 'password'

    }

*/

function RedisStorage(app, config) {
  
  this.constructor.prototype.__construct.call(this, app, config);
  
}

/* RedisStorage::prototype */

framework.extend(RedisStorage.prototype, new function() {
  
  var redis = require('redis');

  this.options = {
    // Parser defaults to hiredis if installed
  }
  
  // Constructor
  this.__construct = function(app, config) {
    var self = this;
    this.app = app;
    this.config = config;
    this.className = this.constructor.name;
    
    // Set redis client
    this.client = redis.createClient(config.port, config.host, this.options);

    // Authenticate if password provided
    if (typeof config.pass == 'string') {
      client.auth(config.pass, function(err, res) {
        if (err) throw err;
      })
    }
    
    // Handle error event
    this.client.on('error', function(err) {
      app.log(err);
    });

    // Select db if specified
    if (typeof config.db == 'number' && config.db !== 0) {
      self.client.select(config.db, function(err, res) {
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
