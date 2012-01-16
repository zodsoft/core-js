
/* RedisStorage */

var _ = require('underscore'),
    redis = require('redis'),
    util = require('util');

function RedisStorage(app, config) {
  
  /** { 
    host: 'localhost',
    port: 6379,
    db: 1,
    pass: 'password'
   } */

   var self = this;
   
   config = config || {};
   config.host = config.host || 'localhost';
   config.port = config.port || 6379;
   
   this.app = app;
   this.db = 0;
   this.config = config;
   this.className = this.constructor.name;
   
   framework.util.checkPort(config.port, function(err) {
     if (err) {
       app.log(util.format("Redis [%s:%s] %s", config.host, config.port, err.code));
     } else {
       // Set redis client
       self.client = redis.createClient(config.port, config.host, self.options);

       // Authenticate if password provided
       if (typeof config.pass == 'string') {
         self.client.auth(config.pass, function(err, res) {
           if (err) throw err;
         });
       }

       // Handle error event
       self.client.on('error', function(err) {
         app.log(err);
       });

       // Select db if specified
       if (typeof config.db == 'number' && config.db !== 0) {
         self.db = config.db;
         self.client.select(config.db, function(err, res) {
           if (err) throw err;
         });
       }
     }
   });
   
   // Set enumerable properties
   framework.util.onlySetEnumerable(this, ['className', 'db']);
}

util.inherits(RedisStorage, framework.lib.storage);

RedisStorage.prototype.options = {};


/** Storage API get */

RedisStorage.prototype.get = function(key, callback) {
  var self = this;
  
  // If key is a string
  if (typeof key == 'string') {
    
    this.client.get(key, function(err, data) {
      if (err) callback.call(self, err, null);
      else {
        callback.call(self, null, data);
      }
    });
    
  // If key is an array
  } else if (util.isArray(key)) {
    
    var i, out = {}, keys = key, 
        multi = this.client.multi();
        
    for (i=0; i < keys.length; i++) {
      multi.get(keys[i]);
    }
    
    multi.exec(function(err, data) {
      if (err) callback.call(self, err, null);
      else {
        for (i=0; i < keys.length; i++) {
          out[keys[i]] = data[i];
        }
        callback.call(self, null, out);
      }
    });
  }
}

/** Storage API getHash */

RedisStorage.prototype.getHash = function(key, callback) {
  var self = this;
  this.client.hgetall(key, function(err, data) {
    if (err) callback.call(self, err, null);
    else {
      callback.call(self, null, data);
    }
  });
}

/** Storage API set */

RedisStorage.prototype.set = function(key, value, callback) {
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
        multi = this.client.multi();
    
    callback = value;
        
    for (var x in object) {
      multi.set(x, object[x]);
    }
    
    multi.exec(function(err, data) {
      if (err) callback.call(self, err);
      else {
        callback.call(self, null);
      }
    });
    
  }
}

/** Storage API setHash */

RedisStorage.prototype.setHash = function(key, object, callback) {
  var self = this;
  this.client.hmset(key, object, function(err, data) {
    if (err) callback.call(self, err);
    else {
      callback.call(self, null);
    }
  });
}

/** Storage API updateHash */

RedisStorage.prototype.updateHash = function(key, object, callback) {
  var self = this,
      args = [key];
      
  for (var x in object) {
    args.push(x);
    args.push(object[x]);
  }
  
  args.push(function(err, results) {
    callback.call(self, err);
  });
  
  this.client.hset.apply(this.client, args);
}

/** Storage API delete */

RedisStorage.prototype.delete = function(key, callback) {
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

/** Storage API rename */

RedisStorage.prototype.rename = function(oldkey, newkey, callback) {
  var self = this;
  this.client.rename(oldkey, newkey, function(err, result) {
    callback.call(self, err);
  });
}

/** Storage API expire */

RedisStorage.prototype.expire = function(key, timeout, callback) {
  var self = this;
  this.client.expire(key, timeout, function(err, result) {
    callback.call(self, err);
  });
}
  
module.exports = RedisStorage;
