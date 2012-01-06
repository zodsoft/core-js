
/* RedisStorage */

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
    this.client = redis.createClient(config.port, config.host, this.options);
    framework.util.onlySetEnumerable(this, ['className', 'config']);
  }
  
});

module.exports = RedisStorage;
