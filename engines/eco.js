
/* Eco  */

var eco = require('eco'),
    util = require('util');

// https://github.com/sstephenson/eco

function Eco(app) {
  this.app = app;
  this.module = eco;
  this.multiPart = true;
  this.extensions = ['eco', 'coffee'];
}

util.inherits(Eco, framework.lib.engine);

Eco.prototype.render = function(data) {
  var tpl, func = this.getCachedFunction(arguments);
  if (func === null) {
    func = eco.compile(data);
    this.cacheFunction(func, arguments);
  }
  return this.evaluate(func, arguments);
}

module.exports = Eco;
