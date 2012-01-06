
/* Kernel */

function Kernel(app) {
  
  // https://github.com/c9/kernel
  
  this.constructor.prototype.__construct.call(this, app);
  
}

/* Kernel::prototype */

framework.extend(Kernel.prototype, framework.engineProto);

framework.extend(Kernel.prototype, new function() {
  
  var kernel = require('kernel'),
      generator = kernel.generator,
      parser = kernel.parser,
      tokenizer = kernel.tokenizer,
      helpers = kernel.helpers;
  
  this.module = kernel;
  
  this.async = true;
  
  this.multiPart = true;
  
  this.extensions = ['kernel'];
  
  this.render = function(data) {

    var tpl, func = this.getCachedFunction(arguments);
    
    if (func === null) {
      
      // Compile kernel template
      tpl = this.compile.apply(this, arguments);
      
      // Create rendering function
      if (typeof tpl === 'function') {
        // Rendering function successfully created
        func = function(locals, callback) {
          tpl(locals, function(err, html) {
            callback.call(null, html || err);
          });
        }
      } else {
        // There were errors compiling template (tpl is an exception)
        func = tpl;
      }

      // Cache rendering function
      this.cacheFunction(func, arguments);
      
    }
    
    // Return evaluated buffer or exception
    return this.eval(func, arguments);
    
  }
  
  /**
    Compiles a kernel template
   */
  
  this.compile = function(source, vars, relPath) {
   
    try {
      
      return Function("var helpers = this;\nreturn " 
      + generator(parser(tokenizer(source), source, this.app.fullPath(relPath))))
      .call(helpers);
      
    } catch(e) {
      
      return e;
      
    }

  }
  
  this.makePartialAsync = function(func) {
   
    return this.cache[func.id] || this.__makePartialAsync(func, 
      // Async
      function(arg, callback) {
        func(arg, function(buf) {
          callback(null, buf);
        });
      },
      // Sync
      function(arg, callback) {
        callback(null, func(arg));
      });
    
  }
  
});

module.exports = Kernel;
