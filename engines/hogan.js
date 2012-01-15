
/* Hogan */

var hogan = require('hogan.js'),
    util = require('util');
    
// https://github.com/twitter/hogan.js

function Hogan(app) {
  this.app = app;
  this.module = hogan;
  this.multiPart = true;
  this.extensions = ['mustache'];
}

util.inherits(Hogan, framework.lib.engine);

Hogan.prototype.render = function(data, vars) {
  var tpl, func = this.getCachedFunction(arguments);
  if (func === null) {
    tpl = hogan.compile(data);
    func = function(data, partials) { 
      return tpl.render(data, partials); 
    }
    func.tpl = tpl;
    this.cacheFunction(func, arguments);
  }
  return this.evaluate(func, arguments, true);
}

Hogan.prototype.returnPartials = function() {
  var f, partials = {}, appPartials = this.app.views.partials;
  for (f in appPartials) {
    partials[f] = appPartials[f].tpl || appPartials[f];
  }
  return partials;
}

module.exports = Hogan;
