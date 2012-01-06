
/* HamlCoffee */

function HamlCoffee(app) {
  
  // https://github.com/9elements/haml-coffee
  
  this.constructor.prototype.__construct.call(this, app);
  
}

/* HamlCoffee::prototype */

framework.extend(HamlCoffee.prototype, framework.engineProto);

framework.extend(HamlCoffee.prototype, new function() {
  
  var hamlCoffee = require('haml-coffee');

  this.module = hamlCoffee;

  this.multiPart = false;

  this.extensions = ['hamlc'];

  this.render = function(data) {

    var tpl, func = this.getCachedFunction(arguments);
    
    if (func === null) {
      
      // Create rendering function
      func = hamlCoffee.compile(data);
      
      // Cache rendering function
      this.cacheFunction(func, arguments);

    }
    
    // Return evaluated buffer or exception
    return this.eval(func, arguments);
    
  }
  
});

module.exports = HamlCoffee;
