
/* Jade */

function Jade(app) {
  
  // https://github.com/visionmedia/jade
  
  this.constructor.prototype.__construct.call(this, app);
  
}

/* Jade::prototype */

framework.extend(Jade.prototype, framework.engineProto);

framework.extend(Jade.prototype, new function() {
  
  var _ = require('underscore'),
      jade = require('jade');

  this.options = {
    pretty: true,
  }
  
  this.module = jade;
  
  this.multiPart = false;
  
  this.extensions = ['jade']

  this.render = function(data, vars, relPath) {

    var tpl, func = this.getCachedFunction(arguments);
    
    if (func === null) {
      
      var filename = this.app.fullPath('/views/' + relPath),
          options = _.extend({filename: filename}, this.options);
      
      // Compile Jade Template
      func = jade.compile(data, options);

      // Cache rendering function
      this.cacheFunction(func, arguments);

    }
    
    // Return evaluated buffer or exception
    return this.eval(func, arguments);
    
  }
  
});

module.exports = Jade;
