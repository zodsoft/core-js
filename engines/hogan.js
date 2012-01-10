
/* Hogan */

function Hogan(app) {
  
  // https://github.com/twitter/hogan.js
  
  this.constructor.prototype.__construct.call(this, app);
  
}

/* Hogan::prototype */

framework.extend(Hogan.prototype, framework.engineProto);

framework.extend(Hogan.prototype, new function() {
  
  var hogan = require('hogan.js'),
      superEval = framework.engineProto.eval;
  
  this.module = hogan;
  
  this.multiPart = true;
  
  this.extensions = ['hogan'];
  
  this.render = function(data, vars) {

    var tpl, func = this.getCachedFunction(arguments);
    
    if (func === null) {
      
      // Compile hogan template
      tpl = hogan.compile(data);
      
      func = function(data, partials) { return tpl.render(data, partials); }
      func.tpl = tpl;
      
      // Cache rendering function
      this.cacheFunction(func, arguments);
      
    }
    
    // Return evaluated buffer. Pass an extra object with partials
    return this.eval(func, arguments, true);
    
  }
  
  this.returnPartials = function() {
    var f, partials = {}, appPartials = this.app.views.partials;
    for (f in appPartials) {
      partials[f] = appPartials[f].tpl || appPartials[f];
    }
    return partials;
  }
  
});

module.exports = Hogan;
