
/* Utils */

var _ = require('underscore'),
    fs = require('fs'),
    urlModule = require('url');

module.exports = {

  /**
    Gets the static directories available in the application's public

    @returns {array}
    @private
   */

  getStaticDirs: function() {
    var files = fs.readdirSync(this.path + '/' + this.paths.public),
      dirs = [];
    for (var file, stat, i=0; i < files.length; i++) {
      file = files[i];
      stat = fs.lstatSync(this.path + '/' + this.paths.public + file);
      if ( stat.isDirectory() ) dirs.push(file);
    }
    return dirs;
  },

  /**
    Helper function, equivalent to url.parse()

    @param {string} url
    @returns {object}
    @public
   */

  parseUrl: function(url) {
    return urlModule.parse(url);
  },

  /**
    Parses the request cookies

    @param {object} req
    @returns {object}
    @private
   */

  getRequestCookies: function(req) {
    if (req.headers.cookie != null) {
      try {
        return parseCookie(req.headers.cookie);
      } catch (e) {
        this.log(req.__urlData.pathname, "Error parsing cookie header: " + e.toString());
        return {};
      }
    } else {
      return {};
    }
  },

  /**
    Enhances the controller function, allowing it to inherit the Controller class. Also allows 
    the controller to locally use the static routing functions.

    @param {function} func
    @returns {function}
    @private
   */

  monkeyPatchController: function(func) {

    var context, newFunc, compile;
    var code = func.toString()
        .trim()
        .replace(/^function\s+(.*?)(\s+)?\{(\s+)?/, '')
        .replace(/(\s+)?\}$/, '');

    // Controller code

    var fnCode = "\n\
  with (locals) {\n\n\
  function "+ func.name +"(app) {\n\
  this.__construct.call(this, app);\n\
  }\n\n\
  " + func.name + ".prototype = app.controllerProto;\n\n\
  framework.extend(" + func.name + ", framework.lib.controller);\n\
  \n";

    // Local functions

    var methods = _.methods(framework.lib.controller.routingFunctions);

    for (var method,i=0; i < methods.length; i++) {
      method = methods[i];
      fnCode += 'function ' + method + '() { ' + func.name + '.routingFunctions.' + method + '.apply(' + func.name 
      + ', arguments); }\n';
    }

    // Controller code, within closure

    fnCode += "\n\
  (function() {\n\n\
  " + code + "\n\n\
  }).call(" + func.name + ");\n\n\
  return " + func.name + ";\n\n\
  }\n";

    // console.exit(fnCode);

    /*jshint evil:true */
    compile = new Function('locals', fnCode);

    newFunc = compile({
      app: this,
      framework: framework,
      module: module,
      require: require,
      console: console,
      __dirname: this.path + '/controllers',
      __filename: this.path + '/controllers/' + func.name + '.js',
      process: process
    });

    return newFunc;

  },

  /**
    Enables a function to use `this.extends` to extend an application or framework class

    @param {function} func
    @returns {function}
    @private
   */

  addClassInheritance: function(func) {

    /*jshint newcap: false */
    var self = this, proto;

    func.prototype.extends = function(name, args) {
      proto = self.getClass(name);
      if (typeof proto === 'function') proto = new proto(self);
      _.extend(this.constructor.prototype, proto);
      if (args) this.__construct.apply(this, args);
      else this.__construct.call(this, self);
    }

    return func;
  },

  /**
    Parses the application configuration

    @private
   */

  parseConfig: function() {
    var p = this.path + '/config/',
        files = framework.util.getFiles(p),
        mainPos = files.indexOf('main.js'),
        jsExt = framework.regex.jsFile,
        config = require(this.path + '/config/main.js');

    for (var file,key,cfg,i=0; i < files.length; i++) {
      if (i==mainPos) continue;
      file = files[i];
      key = file.replace(jsExt, '');
      cfg = require(this.path + '/config/' + file);
      if (typeof config[key] == 'object') _.extend(config[key], cfg); 
      else config[key] = cfg;
    }

    return config;
  },

  /**
    Creates database drivers from config
   */

  createDrivers: function() {
    var cfg, def, x, y, z, 
        config = this.config.database,
        drivers = this.drivers;

    for (x in config) {
      cfg = config[x];
      if (x === 'default') { def = cfg; continue; }
      for (y in cfg) {
        if (typeof cfg[y] == 'object') {
          if (typeof drivers[x] == 'undefined') drivers[x] = {};
          drivers[x][y] = this.driver(x, cfg[y]);
        } else {
          drivers[x] = this.driver(x, cfg);
          continue;
        }
      }
    }

    if (def) drivers.default = this.getResource('drivers/' + def);
    else throw new Error('No default database set. Please check your config/database.');

    if (typeof drivers.default == 'undefined') {
      throw new Error(util.format("No driver available for '%s'.", def));
    }
  },

  /**
    Creates storages from config
   */

  createStorages: function() {
    var cfg, x, y, z, 
        config = this.config.storage,
        storages = this.storages;

    for (x in config) {
      cfg = config[x];
      for (y in cfg) {
        if (typeof cfg[y] == 'object') {
          if (typeof storages[x] == 'undefined') storages[x] = {};
          storages[x][y] = this.storage(x, cfg[y]);
        } else {
          storages[x] = this.storage(x, cfg);
          continue;
        }
      }
    }
  }

};

/**
  Parses the cookie header

  @param {string} str
  @returns {object}
  @private
 */

function parseCookie(str) {
  var obj = {},
    pairs = str.split(/[;,] */);

  for (var pair,eqlIndex,key,val,i=0; i < pairs.length; i++) {
    pair = pairs[i];
    eqlIndex = pair.indexOf('=');
    key = pair.substr(0, eqlIndex).trim().toLowerCase();
    val = pair.substr(++eqlIndex, pair.length).trim();
    if ('"' === val[0]) val = val.slice(1, -1);
    if (obj[key] === void 0) {
      val = val.replace(/\+/g, ' ');
      try {
        obj[key] = decodeURIComponent(val);
      } catch (err) {
        if (err instanceof URIError) {
          obj[key] = val;
        } else {
          throw err;
        }
      }
    }
  }
  return obj;
}
