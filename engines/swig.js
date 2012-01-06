
/* Swig */

function Swig(app) {
  
  // https://github.com/paularmstrong/swig
  
  this.constructor.prototype.__construct.call(this, app);
  
}

/* Swig::prototype */

framework.extend(Swig.prototype, framework.engineProto);

framework.extend(Swig.prototype, new function() {
  
  var swig = require('swig');
  
  this.options = {
    allowErrors: true,
    autoescape: true,
    encoding: 'utf-8',
    tags: {}
  };
  
  this.module = swig;
  
  this.multiPart = true;
  
  this.extensions = ['swig'];
  
  this.render = function(data) {

    var func = this.getCachedFunction(arguments);
    
    if (func === null) {
      
      // Compile Swig Template with this.swigOptions
      func = swig.compile(data, this.options);
      
      // Cache rendering function
      this.cacheFunction(func, arguments);
      
    }
    
    // Return evaluated buffer or exception
    return this.eval(func, arguments);
    
  }
  
});

module.exports = Swig;
