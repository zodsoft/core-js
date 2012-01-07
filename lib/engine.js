
/* Engine */

function Engine() {
  
  this.constructor.prototype.__construct.apply(this, arguments);
  
}

/* Engine::prototype */

var _ = require('underscore'),
    fs = require('fs');

_.extend(Engine.prototype, new function() {
  
  var isTypeOf = framework.util.isTypeOf;
  
  // Engine's compilation options
  this.options = {};
  
  // Node module of the template engine
  this.module = null;
  
  // Whether or not this is an asynchronous template engine
  this.async = false;
  
  // Whether or not the template engine allows multiple parts
  this.multiPart = true;
  
  // Extensions to register for the template engine
  this.extensions = []
  
  // Used for partials caching purposes
  this.cache = {};
  
  // Constructor
  this.__construct = function(app) {
    this.app = app;
    this.className = this.constructor.name;
    framework.util.onlySetEnumerable(this, ['className', 'async', 'multiPart']);
  }
  
  /**
    Wrapper for _getCachedFunction
    
    @param {object} args
    @private
   */
  
  this.getCachedFunction = function(args) {

    if (this.app.viewCaching) {
      return _getCachedFunction.apply(this, args);
    } else {
      return null;
    }
    
  }

  /** 
    Wrapper for _cacheFunction
    
    @param {function} func
    @param {object} args
    @private
   */
   
   this.cacheFunction = function(func, args) {
     
     if (!this.app.viewCaching) return;
     
     var argsArray = [func].concat(Array.prototype.slice.call(args, 0));
     
     _cacheFunction.apply(this, argsArray);
     
   }
   
  /**
   Wrapper for _eval
   
   @param {function} func
   @param {object} args
   @param {boolean} addPartials
   @private
  */
  
  this.eval = function(func, args, addPartials) {

    var argsArray = [func].concat(Array.prototype.slice.call(args, 0));
    
    if (addPartials === true) argsArray.push(true);
    
    return _eval.apply(this, argsArray);
 
  }
  
  /**
    Gets the template engine from extension
    
    @param {string} file
    @returns {object} engine
    @private
   */
   
   this.getEngineByExtension = function(file) {
     if (typeof file === 'undefined') return null;
     var ext = file.slice(file.indexOf('.') + 1);
     return this.app.enginesByExtension[ext];
   }
   
   /**
    Renders a view partial
    
    @param {string} data
    @param {string} relPath
    @private
   */
   
  this.renderPartial = function(path) {
    var app = this.app,
        data = fs.readFileSync(path, 'utf-8'),
        func = this.render(data, null, this.app.relPath(path, '/views'));
        
    if (typeof func === 'function') func.async = this.async;
    
    return func;
  }
  
  /**
    Makes functions asynchronous, following a specific pattern
    
    @param {string} data
    @param {object} vars
    @param {string} relPath
    @private
   */
   
  this.__makePartialAsync = function(func, asyncFn, syncFn) {

    // Return from cache
    var cached = this.cache[func.id];
    if (typeof cached === 'function') return cached;
    
    if (func.async) {
      // Async function
      return this.cache[func.relPath] = asyncFn;
    } else {
      // Sync function
      return this.cache[func.relPath] = syncFn;
    }

  }
   
  function _getCachedFunction(data, vars, relPath) {
    
    var func, app = vars.app;
    
    if (app.viewCaching) {
      
        func = app.views.callbacks[relPath];
      
        if (isTypeOf(func, 'function')) { return func; }
        else { return null; }
        
    } else { return null; }
    
  }
  
  /** 
    Caches a function into the view cache
    
    @param {function} func
    @param {string} data
    @param {object} vars
    @param {string} relPath
    @private
   */
    
  function _cacheFunction(func, data, vars, relPath) {
    
    if (vars) vars.app.views.callbacks[relPath] = func;
    
  }
  
  /**
    Renders the evaluated template buffer.

    If there's an error, an exception will be returned otherwise.
    
    @param {function} func
    @param {string} data
    @param {object} vars
    @param {string} relPath
    @private
    */
    
    function _eval(func, data, vars, relPath, partial) {
      if (vars) {
        
        var app = vars.app, 
            appPartials = 
            app.views.partials, 
            async = this.async,
            f, partials;
        
        // Add partials as helpers for all engines
        for (var f in appPartials) {
          if (async) {
            // Async engines need to make the helpers compatible with their asynchronous model
            vars[f] = this.makePartialAsync(appPartials[f]);
          } else {
            f = appPartials[f];
            if (f.async) {
              // Ignore async partials for sync engines
              app.debug('Ignoring ' + f.id + ' partial on ' + vars.res.engine.className + ' engine');
            } else {
              // Sync engines only support sync partials
              vars[f.id] = f;
            }
          }
        }
        
        // Rendering a template
        var res = vars.res;
        try {
          if (res.engine.async) {
            // Render asynchronous template
            func(vars, function(buffer) {
              res.emit('__async_template_done', buffer);
            });
          } else {
            // Render normal template
            if (typeof func == 'function') {
              // Specify extra partial arguments for the engines that need it
              if (partial) {
                // call rendering function with partials
                return func(vars, this.returnPartials());
              } else {
                // call rendering function normally
                return func(vars); 
              }
            } else {
              return func;
            }
          }
        } catch (e) {
          return e;
        }
      } else {
        // Rendering a partial, just return the function
        return func;
      }
    }

});

module.exports = Engine;
