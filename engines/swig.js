
/* Swig */

var swig = require('swig'),
    util = require('util');

// https://github.com/paularmstrong/swig

function Swig(app) {
  this.app = app;
  this.options = {
    allowErrors: true,
    autoescape: true,
    encoding: 'utf-8',
    tags: {}
  };
  this.module = swig;
  this.multiPart = true;
  this.extensions = ['swig'];
}

util.inherits(Swig, framework.lib.engine);

Swig.prototype.render = function(data) {
  var func = this.getCachedFunction(arguments);
  if (func === null) {
    func = swig.compile(data, this.options);
    this.cacheFunction(func, arguments);
  }
  return this.evaluate(func, arguments);
}

module.exports = Swig;
