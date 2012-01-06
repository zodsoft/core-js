
/* Whiskers */

function Whiskers(app) {
  
  // https://github.com/gsf/whiskers.js/tree
  
  this.constructor.prototype.__construct.call(this, app);
  
}

/* Whiskers::prototype */

framework.extend(Whiskers.prototype, framework.engineProto);

framework.extend(Whiskers.prototype, new function() {
  
  var whiskers = require('whiskers');
  
  this.module = whiskers;
  
  this.multiPart = true;
  
  this.extensions = ['whiskers'];

  this.render = function(data) {

    var func = this.getCachedFunction(arguments);
    
    if (func === null) {
      
      // Compile Whiskers Template
      func = whiskers.compile(data);
      
      // Cache rendering function
      this.cacheFunction(func, arguments);
      
    }
    
    // Return evaluated buffer or exception
    return this.eval(func, arguments);
    
  }
  
});

module.exports = Whiskers;
