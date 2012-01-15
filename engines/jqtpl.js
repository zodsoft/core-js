
/* JqueryTemplate */

var jq = require('jqtpl'),
    util = require('util');

// https://github.com/kof/node-jqtpl

function JqueryTemplate(app) {
  this.app = app;
  this.module = jq;
  this.multiPart = true;
  this.extensions = ['jqtpl'];
}

util.inherits(JqueryTemplate, framework.lib.engine);

JqueryTemplate.prototype.render = function(data, vars, relPath) {
  var tpl, tplID, func = this.getCachedFunction(arguments);
  if (func === null) {
    tplID = this.app.domain + relPath;
    jq.template(tplID, data);
    func = function(locals) {
      return jq.tmpl(tplID, locals);
    }
    this.cacheFunction(func, arguments);
  }
  return this.evaluate(func, arguments);
}

module.exports = JqueryTemplate;
