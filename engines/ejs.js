
/* EJS */

var ejs = require('ejs'),
    util = require('util');

// https://github.com/visionmedia/ejs

function EJS(app) {
  this.app = app;
  this.options = {open: '<%', close: '%>'}
  this.module = ejs;
  this.multiPart = true;
  this.extensions = ['ejs'];
}

util.inherits(EJS, framework.lib.engine);

EJS.prototype.render = function(data) {
  var func = this.getCachedFunction(arguments);
  if (func === null) {
    func = ejs.compile(data, this.options);
    this.cacheFunction(func, arguments);
  }
  return this.evaluate(func, arguments);
}

module.exports = EJS;
