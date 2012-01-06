
/* RedisStorage */

function RedisStorage(app, config) {
  
  /** { host: 'localhost',
        port: 6379,
        db: 1,
        pass: 'password'
      } */
  
  this.constructor.prototype.__construct.call(this, app, config);
  
}

/* RedisStorage::prototype */

framework.extend(RedisStorage.prototype, framework.storageProto);

framework.extend(RedisStorage.prototype, new function() {
  
  var redis = require('redis'),
      util = require('util');

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
  

  /** Storage API get */
  
  this.get = function(key, callback) {
    var self = this;
    
    // If key is a string
    if (typeof key == 'string') {
      
      this.client.get(key, function(err, data) {
        if (err) callback.call(self, err, null);
        else {
          callback.call(self, null, data);
        }
      })
      
    // If key is an array
    } else if (util.isArray(key)) {
      
      var i, out = {}, keys = key, 
          multi = this.client.multi();
          
      for (i=0; i < keys.length; i++) {
        multi.get(keys[i]);
      }
      
      multi.exec(function(err, data) {
        if (err) callback.call(self, err);
        else {
          for (i=0; i < keys.length; i++) {
            out[keys[i]] = data[i];
          }
          callback.call(self, null, out);
        }
      })
    }
  }
  
  
  /** Storage API set */
  
  this.set = function(key, value, callback) {
    var self = this;
    
    // If key is a string
    if (typeof key == 'string') {
      
      // Set single value
      this.client.set(key, value, function(err, data) {
        if (err) callback.call(self, err);
        else {
          callback.call(self, null);
        }
      });
      
    // If key is an array
    } else if (typeof key == 'object') {
      
      // Set multiple values
      var object = key,
          callback = value,
          multi = this.client.multi();
          
      for (key in object) {
        multi.set(key, object[key]);
      }
      
      multi.exec(function(err, data) {
        if (err) callback.call(self, err);
        else {
          callback.call(self, null);
        }
      });
      
    }
  }
  
  
  /** Storage API delete */
  
  this.delete = function(key, callback) {
    var self = this;
    
    // If key is a string
    if (typeof key == 'string') {
      
      this.client.del(key, function(err, data) {
        if (err) callback.call(self, err);
        else {
          callback.call(self, null);
        }
      });
      
    // If key is an array
    } else if (util.isArray(key)) {
      var i, keys = key,
          multi = this.client.multi();
          
      for (i=0; i < keys.length; i++) {
        multi.del(keys[i]);
      }
      
      multi.exec(function(err, data) {
        if (err) callback.call(self, err);
        else {
          callback.call(self, null);
        }
      });
      
    }
  }
  
});

module.exports = RedisStorage;
