
/* Haml */

function Haml(app) {
  
  // https://github.com/visionmedia/haml.js
  
  this.constructor.prototype.__construct.call(this, app);
  
}

/* Haml::prototype */

framework.extend(Haml.prototype, framework.engineProto);

framework.extend(Haml.prototype, new function() {
  
  var haml = require('hamljs');

  this.module = haml;

  this.multiPart = false;

  this.extensions = ['haml'];

  this.render = function(data) {

    var tpl, func = this.getCachedFunction(arguments);
    
    if (func === null) {
      
      // Create rendering function
      func = function(vars) { return haml.render(data, {locals: vars}); }
      
      // Cache rendering function
      this.cacheFunction(func, arguments);      

    }
    
    // Return evaluated buffer or exception
    return this.eval(func, arguments);
    
  }
  
});

module.exports = Haml;
