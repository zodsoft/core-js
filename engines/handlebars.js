
/* Handlebars */

function Handlebars(app) {
  
  // https://github.com/wycats/handlebars.js
  
  this.constructor.prototype.__construct.call(this, app);
  
}

/* Handlebars::prototype */

framework.extend(Handlebars.prototype, framework.engineProto);

framework.extend(Handlebars.prototype, new function() {
  
  var handlebars = require('handlebars');
  
  this.module = handlebars;
  
  this.multiPart = true;
  
  this.extensions = ['mustache'];
  
  this.render = function(data) {

    var tpl, func = this.getCachedFunction(arguments);
    
    if (func === null) {
      
      // Compile handlebars template
      func = handlebars.compile(data);
      
      // Cache rendering function
      this.cacheFunction(func, arguments);
      
    }
    
    // Return evaluated buffer. Pass an extra object with partials
    return this.eval(func, arguments, true);
    
  }
  
  this.registerHelper = function(alias, callback) {
    handlebars.registerHelper(alias, callback);
  }
  
  this.returnPartials = function() {
    var f, partials = {}, appPartials = this.app.views.partials;
    for (f in appPartials) {
      partials[f] = appPartials[f].tpl || appPartials[f];
    }
    return {partials: partials};
  }
  
});

module.exports = Handlebars;
