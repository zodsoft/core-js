
/* Jade */

var jade = require('jade'),
    util = require('util');

// https://github.com/visionmedia/jade

function Jade(app) {
  this.app = app;
  this.options = {
    pretty: true
  }
  this.module = jade;
  this.multiPart = false;
  this.extensions = ['jade']
}

util.inherits(Jade, framework.lib.engine);

Jade.prototype.render = function(data, vars, relPath) {
  var tpl, func = this.getCachedFunction(arguments);
  if (func === null) {
    var filename = this.app.fullPath('/views/' + relPath),
        options = _.extend({filename: filename}, this.options);
    func = jade.compile(data, options);
    this.cacheFunction(func, arguments);
  }
  return this.evaluate(func, arguments);
}

module.exports = Jade;
