
function MyEngine(app) {
  
  // Whether or not the template engine is asynchronous
  this.async = false;
 
  // Automatically include the header/footer templates
  this.multiPart = true; 
 
  // Register template engine extensions
  this.extensions = ['myengine'];
  
  this.render = function(data) {
    
    /* Templates with a .myengine extension will
       be rendered by this template engine */
    
    // 1. Get the cached function
    var func = this.getCachedFunction(arguments);

    // 2. If function is not cached
    if (func === null) {
      
      // 2.a Compile a new rendering function
      func = function(data) { return 'MYENGINE TEMPLATE'; }
      
      // 2.b Cache the compiled function
      this.cacheFunction(func, arguments);
    }
    
    // 3. Return evaluated function with passed parameters
    return this.eval(func, arguments);

  }
  
}

module.exports = MyEngine;