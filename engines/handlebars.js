
/* Handlebars */

var handlebars = require('handlebars'),
    util = require('util');

// https://github.com/wycats/handlebars.js

function Handlebars(app) {
  this.app = app;
  this.module = handlebars;
  this.multiPart = true;
  this.extensions = ['handlebars'];
}

util.inherits(Handlebars, framework.lib.engine);

Handlebars.prototype.render = function(data) {
  var tpl, func = this.getCachedFunction(arguments);
  if (func === null) {
    func = handlebars.compile(data);
    this.cacheFunction(func, arguments);
  }
  return this.eval(func, arguments, true);
}

Handlebars.prototype.registerHelper = function(alias, callback) {
  handlebars.registerHelper(alias, callback);
}

Handlebars.prototype.returnPartials = function() {
  var f, partials = {}, appPartials = this.app.views.partials;
  for (f in appPartials) {
    partials[f] = appPartials[f].tpl || appPartials[f];
  }
  return {partials: partials};
}

module.exports = Handlebars;
