
function MyEngine(app) {
  
  // Whether or not the template rendering is asynchronous
  this.async = false;
 
  // If set to true, allows automatic inclusion of header/footer
  this.multiPart = true; 
 
  // Register template engine extensions
  this.extensions = ['myengine'];
  
  this.render = function(data) {
    
    /* 
      Template Engines API 
    
      This engine will be registered into the application,
      and ready to use, if a template is included with any 
      of the extensions specified in `this.extensions`.
      
      For example, the file `main/index.myengine` will be
      rendered using this engine.
    */
    
    // 1) Get the cached function
    var func = this.getCachedFunction(arguments);

    // 2) If function is not cached
    if (func === null) {
      
      // 2.a) Compile a new rendering function
      func = function(data) { return 'MYENGINE TEMPLATE'; }
      
      // 2.b) Cache the compiled function
      this.cacheFunction(func, arguments);
    }
    
    // 3) Evaluate function with passed parameters
    return this.eval(func, arguments);

  }
  
}

module.exports = MyEngine;