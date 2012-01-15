
/* Jazz */

var jazz = require('jazz'),
    util = require('util');

// https://github.com/shinetech/jazz

function Jazz(app) {
  this.app = app;
  this.module = jazz;
  this.async = true;
  this.multiPart = true;
  this.extensions = ['jazz'];
}

util.inherits(Jazz, framework.lib.engine);

Jazz.prototype.render = function(data) {
  var tpl, func = this.getCachedFunction(arguments);
  if (func === null) {
    tpl = jazz.compile(data);
    func = function(locals, callback) {
      tpl.eval(locals, callback);
    }
    this.cacheFunction(func, arguments);
  }
  return this.evaluate(func, arguments);
}

Jazz.prototype.makePartialAsync = function(func) {
  var cached = this.cache[func.id];
  if (cached instanceof Function) { 
    return cached;
  } else {
    function async(arg, callback) {
      func(arg, function(buf) {
        callback(buf);
      });
    }
    function sync(arg, callback) {
      callback(func(arg));
    }
    return this.__makePartialAsync(func, async, sync);
  }
}

module.exports = Jazz;
