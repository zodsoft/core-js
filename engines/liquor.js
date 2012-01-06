
/* Liquor */

function Liquor(app) {
  
  // https://github.com/chjj/liquor
  
  this.constructor.prototype.__construct.call(this, app);
  
}

/* Liquor::prototype */

framework.extend(Liquor.prototype, framework.engineProto);

framework.extend(Liquor.prototype, new function() {
  
  var liquor = require('liquor');
  
  this.options = {
    pretty: true
  }
  
  this.module = liquor;
  
  this.multiPart = true;
  
  this.extensions = ['liquor'];

  this.render = function(data) {

    var func = this.getCachedFunction(arguments);
    
    if (func === null) {
      
      // Compile Liquor Template
      func = liquor.compile(data, this.options);
      
      // Cache rendering function
      this.cacheFunction(func, arguments);
      
    }
    
    // Return evaluated buffer or exception
    return this.eval(func, arguments);
    
  }
  
});

module.exports = Liquor;
