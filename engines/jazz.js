
/* Jazz */

function Jazz(app) {
  
  // https://github.com/shinetech/jazz
  
  this.constructor.prototype.__construct.call(this, app);
  
}

/* Jazz::prototype */

framework.extend(Jazz.prototype, framework.engineProto);

framework.extend(Jazz.prototype, new function() {
  
  var jazz = require('jazz');
  
  this.module = jazz;
  
  this.async = true;
  
  this.multiPart = true;
  
  this.extensions = ['jazz'];
  
  this.render = function(data) {

    var tpl, func = this.getCachedFunction(arguments);
    
    if (func === null) {
      
      // Compile jazz template
      tpl = jazz.compile(data);
      
      // Create rendering function
      func = function(locals, callback) {
        tpl.eval(locals, callback);
      }
      
      // Cache rendering function
      this.cacheFunction(func, arguments);
      
    }
    
    // Return evaluated buffer or exception
    return this.eval(func, arguments);
    
  }
  
  this.makePartialAsync = function(func) {
    
    return this.cache[func.id] || this.__makePartialAsync(func, 
      // Async
      function(arg, callback) {
        func(arg, function(buf) {
          callback(buf);
        });
      },
      // Sync
      function(arg, callback) {
        callback(func(arg));
      });
  }
  
});

module.exports = Jazz;
