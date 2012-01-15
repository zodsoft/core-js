
/* HamlCoffee */

var hamlCoffee = require('haml-coffee'),
    util = require('util');

// https://github.com/9elements/haml-coffee

function HamlCoffee(app) {
  this.app = app;
  this.module = hamlCoffee;
  this.multiPart = false;
  this.extensions = ['hamlc'];
}

util.inherits(HamlCoffee, framework.lib.engine);

HamlCoffee.prototype.render = function(data) {
  var tpl, func = this.getCachedFunction(arguments);
  if (func === null) {
    func = hamlCoffee.compile(data);
    this.cacheFunction(func, arguments);
  }
  return this.eval(func, arguments);
}

module.exports = HamlCoffee;
