
/* Haml */

var haml = require('hamljs'),
    util = require('util');
    
// https://github.com/visionmedia/haml.js

function Haml(app) {
  this.app = app;
  this.module = haml;
  this.multiPart = false;
  this.extensions = ['haml'];
}

util.inherits(Haml, framework.lib.engine);

Haml.prototype.render = function(data) {
  var tpl, func = this.getCachedFunction(arguments);
  if (func === null) {
    func = function(vars) { 
      return haml.render(data, {locals: vars}); 
    }
    this.cacheFunction(func, arguments);      
  }
  return this.evaluate(func, arguments);
}

module.exports = Haml;
