
/* EJS */

function EJS(app) {
  
  // https://github.com/visionmedia/ejs
  
  this.constructor.prototype.__construct.call(this, app);
  
}

/* EJS::prototype */

framework.extend(EJS.prototype, framework.engineProto);

framework.extend(EJS.prototype, new function() {
  
  var ejs = require('ejs');

  this.options = {
    open: '<%',
    close: '%>'
  }
  
  this.module = ejs;
  
  this.multiPart = true;
  
  this.extensions = ['ejs'];

  this.render = function(data) {

    var func = this.getCachedFunction(arguments);
    
    if (func === null) {
      
      // Compile EJS Template with this.options
      func = ejs.compile(data, this.options);
      
      // Cache rendering function
      this.cacheFunction(func, arguments);
      
    }
    
    // Return evaluated buffer or exception
    return this.eval(func, arguments);
    
  }
  
});

module.exports = EJS;
