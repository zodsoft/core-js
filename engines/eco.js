
/* Eco  */

function Eco(app) {
  
  // https://github.com/sstephenson/eco
  
  this.constructor.prototype.__construct.call(this, app);
  
}

/* Eco::prototype */

framework.extend(Eco.prototype, framework.engineProto);

framework.extend(Eco.prototype, new function() {
  
  var eco = require('eco');
  
  this.module = eco;
  
  this.multiPart = true;
  
  this.extensions = ['eco', 'coffee'];
  
  this.render = function(data) {

    var tpl, func = this.getCachedFunction(arguments);
    
    if (func === null) {
      
      // Compile eco template
      func = eco.compile(data);
      
      // Cache rendering function
      this.cacheFunction(func, arguments);
      
    }
    
    // Return evaluated buffer or exception
    return this.eval(func, arguments);
    
  }
  
});

module.exports = Eco;
