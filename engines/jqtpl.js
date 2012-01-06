
/* JqueryTemplate */

function JqueryTemplate(app) {
  
  // https://github.com/kof/node-jqtpl
  
  this.constructor.prototype.__construct.call(this, app);
  
}

/* JqueryTemplate::prototype */

framework.extend(JqueryTemplate.prototype, framework.engineProto);

framework.extend(JqueryTemplate.prototype, new function() {
  
  var jq = require('jqtpl');
  
  this.module = jq;
  
  this.multiPart = true;
  
  this.extensions = ['jqtpl'];
  
  this.render = function(data, vars, relPath) {

    var tpl, tplID, func = this.getCachedFunction(arguments);
    
    if (func === null) {
      
      // Get jquery template id
      tplID = this.app.domain + relPath;
      
      // Compile jquery template
      jq.template(tplID, data);
      
      // Create rendering function
      func = function(locals) {
        return jq.tmpl(tplID, locals);
      }
      
      // Cache rendering function
      this.cacheFunction(func, arguments);
      
    }
    
    // Return evaluated buffer or exception
    return this.eval(func, arguments);
    
  }
  
});

module.exports = JqueryTemplate;
