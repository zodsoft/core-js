
/**
  Application
  
  Application class, available locally (on a per-application basis) as `app`.
  
  @extends EventEmitter
 */

var EventEmitter = require('events').EventEmitter,
    _ = require('underscore'),
    http = require('http'),
    fileModule = require('file'),
    pathModule = require('path'),
    urlModule = require('url'),
    qs = require('qs'),
    fs = require('fs'),
    util = require('util'),
    mime = require('mime'),
    Multi = framework.require('./lib/multi');


function Application(domain, path) {

  _.extend(this, new EventEmitter());

  var self = this, listenPort, portStr;
  
  this.domain = domain;
  this.path = path;
  this.className = this.constructor.name;
  framework.apps[this.domain] = this;

  this.paths = {
    layout: '__layout/',
    restricted: '__restricted/',
    static: '__static/',
    public: 'public/',
    upload: 'incoming/'
  }
  
  this.views = {
    static: [],
    buffers: {},
    callbacks: {},
    partials: {}
  }

  this.logging = true;
  this.debugMode = false;
  this.viewCaching = false;
  this.responseCaching = false;

  this.loginUrl = '/login';
  this.debugColor = '0;37';
  
  this.supports = {};
  this.lib = {};
  this.drivers = {};
  this.cache = {};
  this.storages = {};
  this.helpers = {};
  this.controllers = {};
  this.models = {};
  this.engines = {};
  this.defaultEngine = null;
  this.config = {};
  this.globals = {};
  this.routes = {};

  this.mvcMethods = ['GET', 'POST'];
  this.otherMethods = ['OPTIONS', 'PUT', 'DELETE', 'TRACE', 'CONNECT'];
  this.httpStatusCodes = http.STATUS_CODES;
  this.initialized = false;

  this.__enableFeatures = {
    session: function(config) {
      this.session = new framework.lib.session(this, config);
    }
  }

  // Module loading queue
  this.useQueue = [];

  // Attach configuration
  this.config = parseConfig.call(this);

  // Regular expressions, extend framework's
  this.regex = _.extend(this.config.regex, framework.regex);
  this.regexKeys = _.keys(this.regex);
  
  // App early initialization event (available on environments)
  framework.emit('app_init', this);
  
  // Structure application's baseUrl
  listenPort = framework.config.server.listenPort;
  portStr = listenPort !== 80 ? ":" + listenPort : '';
  this.baseUrl = "http://" + this.domain + portStr;
  
  // Get constructors from app/lib/
  var requireCb;
  framework.util.requireAllTo(this.path + "/lib", this.lib);
  
  // Get instances from app/helpers/
  var instance, helperCtor = this.lib.helper || framework.lib.helper;
  framework.util.requireAllTo(this.path + "/helpers", this.helpers, function(Ctor) {
    util.inherits(Ctor, helperCtor);
    instance = new Ctor(self);
    instance.className = instance.constructor.name;
    return instance;
  });

  // Create storages
  createStorages.call(this);
  
  // Create drivers
  createDrivers.call(this);
  
  // Get models/
  var model, modelCtor = this.lib.model || framework.lib.model;
  framework.util.requireAllTo(this.path + "/models", this.models, function(Ctor) {
    util.inherits(Ctor, modelCtor);
    model = new Ctor();
    model.prepare(self);
    name = model.className[0].toLowerCase() + model.className.slice(1);
    self[name] = model;
    return model;
  });
  
  // Get engines from app/engines/
  this.enginesByExtension = {};
  var engine, engineProps = ['className', 'extensions'];
  for (engine in framework.engines) {
    instance = new framework.engines[engine](this);
    instance.className = instance.constructor.name;
    framework.util.onlySetEnumerable(instance, engineProps);
    this.engines[engine] = instance;
  }
  
  // Get app:engines/
  var engineCtor = this.lib.engine || framework.lib.engine;
  framework.util.requireAllTo(this.path + "/engines", this.engines, function(Ctor) {
    util.inherits(Ctor, engineCtor);
    instance = new Ctor(self);
    instance.className = instance.constructor.name;
    framework.util.onlySetEnumerable(instance, engineProps);
    return instance;
  });
  
  // Register engine extensions
  var exts = [];
  for (var key in this.engines) {
    engine = this.engines[key];
    exts = exts.concat(engine.extensions);
    for (var i=0; i < engine.extensions.length; i++) {
      key = engine.extensions[i];
      this.enginesByExtension[key] = engine;
    }
  }
  
  // Set default template engine
  this.defaultEngine = this.engines.hogan;

  console.exit(this.engines);
  
  // Get controllers/
  var files, cpath;
  if (framework.config.environment == 'TEST') {
    files = framework.util.getFiles(framework.path + '/test/controllers');
    cpath = framework.path + '/test/controllers/';
  } else {
    files = framework.util.getFiles(path + "/controllers");
    cpath = path + '/controllers/';
  }
  
  // Create controllers and attach to app
  this.controllerProto = this.lib.controller || new framework.lib.controller(this);
  var controller,file,className,ControllerClass;
  for (i=0; i < files.length; i++) {
    file = files[i];
    key = file.replace(this.regex.jsFile, '');
    className = file.replace(this.regex.jsFile, '');
    ControllerClass = require(cpath + className);
    ControllerClass = monkeyPatchController.call(this, ControllerClass);
    controller = this.controllers[key] = new ControllerClass(this);
    framework.util.runInitFunction(controller);
  }
  
  // MainController is set as the main controller
  this.controller = this.controllers.main_controller;
  
  // Generate template file regex from registered template extensions
  this.regex.templateFile = new RegExp('\\.(' + exts.join('|') + ')$');
  this.templateExtensions = exts;
  
  // Generate static file regex
  this.views.static = framework.util.ls(this.path + "/views/" + this.paths.static, this.regex.templateFile);
  this.views.staticAsoc = {};
  this.views.pathAsoc = {};
  
  // Associate static paths with their respective templates
  for (file,key,i=0; i < this.views.static.length; i++) {
    file = this.views.static[i];
    key = file.replace(this.regex.templateFile, '');
    this.views.staticAsoc['/' + key] = file;
  }
  
  var regex = '^\\/(',
    staticViews = this.views.static;
  
  // Get directories in public/
  files = getStaticDirs.call(this);
  
  // Iterate over files and append to regex
  var dir, re;
  for (i=0; i < files.length; i++) {
    dir = files[i];
    path = dir.replace(this.regex.startOrEndSlash, '').replace(this.regex.regExpChars, '\\$1');
    if (i > 0) path = "|" + path;
    regex += path;
  }
    
  // Finalize & create regex
  regex += ')\\/?';
  
  if (regex === '^\\/()\\/?') {
    // No directories found in public/. Invalidate regex
    this.staticFileRegex = /^$/;
  } else {
    // Directories found in public/
    this.staticFileRegex = new RegExp(regex);
  }
  
  // Partial & tempalte regexes
  var partialRegex = new RegExp('^_[a-zA-Z0-9-_]+\\.(' + exts.join('|') + ')$'),
      templateRegex = new RegExp('\\.(' + exts.join('|') + ')$');
      
  // Build partial views and add path associations
  fileModule.walkSync(this.path + '/views', function(dirPath, dirs, files) {
    var layoutPath = self.fullPath('/views/' + self.paths.layout);
    for (var path,file,i=0; i < files.length; i++) {
      file = files[i];
      path = dirPath + "/" + file;
      if (partialRegex.test(file)) {
        // Only build valid partial views
        self.buildPartialView(path);
      } else if (templateRegex.test(file)) {
        // Build partial views for everything inside app.paths.layout
        if (path.indexOf(layoutPath) === 0) self.buildPartialView(path);
        // Only add valid templates to view associations
        self.views.pathAsoc[self.relPath(path.replace(self.regex.templateFile, ''))] = path;
      }
    }
  });
  
  // Run components queue
  var data;
  for (i=0; i < this.useQueue.length; i++) {
    data = this.useQueue[i];
    this.use.apply(this, data);
  }
  
  // No use for this.useQueue
  delete this.useQueue;
  
  // console.exit(this);

}


/**
  Initializes the application
 */

Application.prototype.initialize = function() {
  // 1) Emit the init event
  this.emit('init', this);

  // 2) Run initialization code from init.js
  this.require('init').call(null, this);

  // 3) Set app as initialized
  this.initialized = true;
}

/**
  Enables a specific feature.

  Makes available through `app.supports`.

  E.g. `app.enable('session')` will provide
  `app.supports.session` with true

  @param {string} feature
  @param {object} config
  @public
 */

Application.prototype.enable = function(feature, config) {
  this.supports[feature] = true;
  this.__enableFeatures[feature].call(this, config);
}

 /**
  Registers an enable event

  @param {string} feature
  @param {function} callback
  @public
 */

Application.prototype.registerEnable = function(feature, callback) {
  if (feature in this.__enableFeatures) this.debug('The feature "' + feature + '" has been replaced.');
  this.__enableFeatures[feature] = callback;
}

/**
  Requires an application's module, relative to the application's path

  @param {string} module
  @returns {object}
  @public
 */

Application.prototype.require = function(module) {
  try {
    return require(this.path + "/node_modules/" + module);
  } catch (e) {
    module = module.replace(this.regex.relPath, '');
    return require(this.path + "/" + module);
  }
}

/**
  Loads an addon

  @param {string} component
  @param {object} options
  @param {boolean} skipCheck
  @returns {object} instance of the component's function
  @public
 */

Application.prototype.use = function(component, options, skipCheck) {

  if (typeof skipCheck === 'undefined' && typeof options === 'boolean') skipCheck = options;

  if (this.initialized || skipCheck) {
    // use modules after initialization
    var callback,
      path = this.path + "/addons/" + component + ".js";
    if ( pathModule.existsSync(path) ) {
      callback = require(path);
    } else {
      path = framework.path + "/addons/" + component + ".js";
      if ( !pathModule.existsSync(path) ) {
        throw new Error("Component can't be found: " + component);
      }
      callback = require(path);
    }
    callback.call(null, this, options);
  } else {
    // Queue modules to be used on init
    this.useQueue.push([component, options, true]);
  }

  // Enable chaining
  return this;
}

/**
  Routes a request based on the application's controllers, routes & static views

  @param {object} req
  @param {object} res
  @private
 */

Application.prototype.routeRequest = function(req, res) {

  var method, queryData,
    urlData = parseUrl(req.url),
    url = urlData.pathname,
    controller;

  // Set request properties
  res.__app = req.__app = this;
  res.__request = req;
  res.__setCookie = [];
  req.__response = res;
  req.__route = {};
  req.__urlData = urlData;
  req.__params = {};
  req.__session = {};
  req.__isAjax = req.__isStatic = null;
  req.__handledRoute = false;
  res.__headers = _.extend({}, this.config.headers);

  // Emit  the `request` event.
  this.emit('request', req, res);
  if (req.__stopRoute === true) return;


  /* === MVC REQUESTS === */

  if ( this.mvcMethods.indexOf(req.method) >= 0 ) {

    // GET & POST requests

    if (req.__stopRoute === true) return;

    this.emit('pre_mvc_request', req, res);

    if (req.__stopRoute === true) return;

    if (req.method === 'GET') this.emit('pre_mvc_get', req, res);
    if (req.method === 'POST') this.emit('pre_mvc_post', req, res);

    if (req.__stopRoute === true) return;

    // Load query data
    if ( framework.util.isTypeOf(req.__urlData.query, 'string') ) {
      queryData = qs.parse(req.__urlData.query);

      if ( (queryData.ajax != null) && parseInt(queryData.ajax, 10) == 1 ) {
        req.__isAjax = true;
      }
      delete queryData.ajax;
      req.__queryData = queryData;

    } else {
      req.__queryData = {};
    }

    // Strict routing, account for case sensitivity
    if (!this.config.server.strictRouting) {
      url = req.__urlData.pathname = req.__urlData.pathname.toLowerCase();
    }

    this.emit('mvc_request', req, res);
    this.emit('mvc_get', req, res);
    this.emit('mvc_post', req, res);

    if (req.__stopRoute === true) return;

    if (url === '/' || this.regex.singleParam.test(url)) {

      req.__isMainRequest = true;

      controller = (url !== '/')
      ? (this.controller.getControllerByAlias(url) || this.controller) 
      : this.controller;

      controller.processRoute.call(controller, urlData, req, res, this);

    } else {

      req.__isMainRequest = null;
      this.controller.exec.call(this.controller, urlData, req, res, this);

    }

  }

  // If route has been handled, return
  if (req.__handledRoute) return;

  /* === STATIC FILE REQUESTS === */

  if ( req.method === 'GET' && (this.staticFileRegex.test(url) || this.regex.fileWithExtension.test(url)) ) {

      console.exit(this.staticFileRegex);

      // Static file requests

      if (this.regex.dotFile.test(pathModule.basename(url))) {
        this.notFound(res);
        return;
      }

      req.__isStatic = true;
      this.emit('static_file_request', req, res);

      if (req.__stopRoute === true) return;

      var filePath = this.path + "/" + this.paths.public + url;

      this.serveStatic(filePath, req, res);

    /* === STATIC FILE REQUESTS === */

    } else if (req.method == 'HEAD') {

      if (this.listeners('restful_head').length !== 0) {

        // Manually handle request
        this.emit('restful_head', req, res);

      } else {

        // Automatically handle request
        res.statusCode = 302;
        var location;
        if (typeof this.config.server.headRedirect == 'string') {
          location = this.url(this.config.server.headRedirect);
        } else {
          location = this.url(req.url);
        }
        res.setHeaders({Location: location, Connection: 'close'});
        res.sendHeaders();
        res.end();
        req.connection.destroy();
      }


  /* === RESTFUL HTTP METHODS === */

  } else if (this.otherMethods.indexOf(req.method) >= 0) {

    // Other HTTP Methods

    // Allow the use of restful methods, such as `restful_put`, `restful_delete`, and others.

    method = "restful_" + req.method.toLowerCase();
    if (this.listeners(method).length !== 0) this.emit(method, req, res);
    else res.rawHttpMessage(400);

  }

}

/**
  Creates the application server. Handles requests and routes them accordingly.

  @param {object} req
  @param {object} res
  @private
 */

Application.prototype.createServer = function(req, res) {
  var server, self = this;
  server = http.createServer(function(req, res) {
    self.routeRequest(req, res);
  });
  this.server = server;
  this.server.domain = this.domain;
  return this.server;
}

/**
  Serves a static file

  @param {string} path
  @param {object} req
  @param {object} res
  @private
 */

Application.prototype.serveStatic = function(path, req, res) {

  var callback, self = this;

  fs.stat(path, callback = function(err, stats) {

    if (!(err || stats.isDirectory())) {
      var date = new Date(),
        now = date.toUTCString(),
        lastModified = stats.mtime.toUTCString(),
        contentType = mime.lookup(path),
        maxAge = self.config.cacheControl.maxAge;

      date.setTime(date.getTime() + maxAge * 1000);

      var expires = date.toUTCString(),
        isCached = ( (req.headers['if-modified-since'] != null) 
        && lastModified === req.headers['if-modified-since'] );

      if (isCached) res.statusCode = 304;

      // Static headers
      var headers = {
        'Content-Type': contentType,
        'Cache-Control': self.config.cacheControl.static + ", max-age=" + maxAge,
        'Last-Modified': lastModified,
        'Content-Length': stats.size,
        Expires: expires
      };

      var acceptRanges = self.config.staticServer.acceptRanges;

      if (acceptRanges) headers['Accept-Ranges'] = 'bytes';

      var enableEtags = self.config.staticServer.eTags;

      // Etags
      if (enableEtags === true) {
        headers.Etag = JSON.stringify([stats.ino, stats.size, Date.parse(stats.mtime)].join('-'));
      } else if (typeof enableEtags === 'function') {
        headers.Etag = enableEtags(stats);
      }

      if (isCached) {

        // Do nothing if resource cached

        self.emit('static_file_headers', req, res, headers, stats, path);
        res.setHeaders(headers);
        res.sendHeaders();
        res.end();

      } else {

        var stream, streamArgs = [path];

        if (acceptRanges && (req.headers.range != null)) {

          // Handle partial range requests

          var start, end, len,
            ranges = framework.util.parseRange(stats.size, req.headers.range)[0];

          if (ranges != null) {
            start = ranges.start;
            end = ranges.end;
            streamArgs.push({start: start, end: end});
            len = end - start + 1;
            res.statusCode = 206;
            res.setHeaders({
              'Content-Range': "bytes " + start + "-" + end + "/" + stats.size
            });
          } else {
            res.rawHttpMessage(416);
            return;
          }

        }

        // Prepare an asyncrhonous file stream
        stream = fs.createReadStream.apply(null, streamArgs);

        stream.on('error', function(err) {
          self.serverError(res, ["Unable to read " + self.relPath(path) + ": " + err.toString()]);
        });

        // When stream is ready
        stream.on('open', function() {
          self.emit('static_file_headers', req, res, headers, stats, path);
          res.setHeaders(headers);
          res.sendHeaders();
          stream.pipe(res);
        });

      }

    } else {

      // File not found
      self.emit('static_not_found', path, req, res);
      if (req.__stopRoute === true) return;
      self.notFound(res);
      return;
    }

  });

}

/**
  Validates request data (both for GET & POST), against the validation rules 
  provided when defining the route.

  If the validation is not successful, a response of HTTP/400 is given.

  @param {object} req
  @param {object} fields
  @param {boolean} onlyCheck
  @returns {boolean}, if onlyCheck is true  
  @private
 */

Application.prototype.validate = function(req, fields, onlyCheck) {
  var msg, regex, param, exclude,
    res = req.__response,
    route = req.__route,
    messages = route.messages,
    paramKeys = route.paramKeys,
    valid = true,
    counter = 0;

  if (route.validation != null) {

    for (param in fields) {
      fields[param] = fields[param].trim();
      if (route.validation[param] != null) {
        counter++;

        if ( _.isString(route.validation[param]) 
        && this.regexKeys.indexOf(route.validation[param]) >= 0 ) {
          regex = this.regex[route.validation[param]];
        } else regex = route.validation[param];

        if ( regex.test(fields[param]) ) {
          fields[param] = framework.util.typecast(fields[param]);
          continue;
        } else {
          req.__invalidParam = [ param, fields[param] ];
          if (req.method === 'POST') {
            this.controller.cleanupFilesUploaded(req.__postData.files, true);
          }

          if (onlyCheck) return false;

          if ( messages != null && messages[param] != null ) {

            if (typeof messages[param] === 'function') {
              msg = messages[param].call(this, fields[param]);
            } else msg = messages[param];

          } else msg = "Invalid: " + fields[param];

          res.rawHttpMessage(400, msg);
          return false;
        }
      } else {
        continue;
      }
    }

    exclude = 0;
    var key, val;
    for (key in req.__params) {
      val = req.__params[key];
      if (val !== undefined) exclude++;
    }

    if (counter !== (paramKeys.length - exclude)) {
      if (req.method === 'POST') {
        this.controller.cleanupFilesUploaded(req.__postData.files, true);
      }

      if (onlyCheck) return false;

      res.rawHttpMessage(400, 'Please fill in all the required values');

      return false;

    } else {
      return valid;
    }
  } else {

    return true;

  }
}

/**
  Returns the web application's URL of a relative path

  @param {string} path
  @returns {string}
  @public
 */

Application.prototype.url = function(path) {
  var baseUrl;
  if (path == null) path = '';
  baseUrl = this.baseUrl 
  + "/" 
  + (path.replace(this.config.regex.startsWithSlash, '')
  .replace(this.config.regex.multipleSlashes, '/'));
  return baseUrl;
}

/**
  Redirects to the login location, specified in app.loginUrl

  @param {object} res
  @public
 */

Application.prototype.login = function(res) {
  var controller = res.__controller,
    req = res.__request,
    route = req.__route;

  if (controller.constructor.name === 'MainController' && route.path === this.loginUrl) {
    route.callback.call(controller, req, res);
  } else {
    res.redirect(this.loginUrl);
  }
}

/**
  Redirects to the web application's home url

  @param {object} res
  @public
 */

Application.prototype.home = function(res) {
  res.redirect("/");
}

/**
  Logging facility for the application with timestamp.

  Can be disabled by setting `app.logging` to false.

  @param {string} context
  @param {string} msg
  @public
 */

Application.prototype.log = function(msg) {
  if ( !this.logging || typeof msg == 'undefined') return;
  var log = util.format('%s (%s) - %s', this.domain, this.date(), msg);
  if (msg instanceof Error) console.trace(log);
  else console.log(log);
}

/**
  Prints debugging messages when on Debug Mode.

  Debug Mode can be enabled by setting `app.debugMode` to true.

  @param {string} msg
  @public
 */

Application.prototype.debug = function(msg) {
  if ( this.debugMode !== true ) return;
  msg = util.format('\u001b[%sm%s (%s) - %s\u001b[0m', this.debugColor, this.domain, this.date(), msg);
  console.log(msg);
}

/**
  Returns a path relative to the application's path

  @param {string} path
  @param {string} offset
  @returns {string} relative path without offset
  @public
 */

Application.prototype.relPath = function(path, offset) {
  var p = this.path + "/";
  if (offset !== void 0) {
    p += offset.replace(this.regex.startOrEndSlash, '') + '/';
  }
  return path.replace(p, '');
}

/**
  Returns the absolute path for an application's relative path

  @param {string} path
  @returns {string}
  @public
 */

Application.prototype.fullPath = function(path) {
  path = path.replace(this.regex.startOrEndSlash, '');
  return this.path + "/" + path;
}

/**
  Returns the current date without extra timezone information

  @returns {string}
  @public
 */

Application.prototype.date = function() {
  var date = (new Date()).toString(),
    match = date.match(this.regex.dateFormat);
  return match[0];
}

/**
  Checks if a static view exists

  @param {string} url
  @returns {boolean}
  @private
 */

Application.prototype.staticViewExists = function(url) {
  var exists = false,
      staticViews = this.views.static;

  url = url.replace(this.regex.startOrEndSlash, '');

  for (var ext,i=0; i < this.templateExtensions.length; i++) {
    ext = this.templateExtensions[i];
    if (staticViews.indexOf(url + '.' + ext) >= 0) {
      exists = true;
      break;
    }
  }

  return exists;
}

/**
  Returns an HTTP/404 Response

  @param {object} res
  @public
 */

Application.prototype.notFound = function(res) {
  var cb, self = this;
  this.loadCookies(res.__request);

  cb = function() {
    res.render('#404', self.config.rawViews);
  }

  if (this.session) {
    this.session.loadSession(res.__request, res, cb);
  } else {
    cb.call(this);
  }
}

/**
  Returns an HTTP/400 Response

  @param {object} res
  @param {array} logData
  @public
 */

Application.prototype.badRequest = function(res, logData) {
  this.loadCookies(res.__request);
  var cb = function() {
    res.rawHttpMessage(400, logData);
  }
  if (this.session) {
    this.session.loadSession(res.__request, res, cb);
  } else {
    cb.call(this);
  }
}

/**
  Returns an HTTP/500 Response

  @param {object} res
  @param {array} logData
  @public
 */

Application.prototype.serverError = function(res, logData) {
  var cb, self = this;
  if (logData && !util.isArray(logData)) logData = [logData];
  this.loadCookies(res.__request);

  cb = function() {
    res.render('#500', {}, true);
    if (logData != null) {
      logData[0] = "[SERVER ERROR] - " + logData[0];
      self.log.apply(self, logData);
      self.emit('server_error', logData);
    }
  }

  if (this.session) {
    this.session.loadSession(res.__request, res, cb);
  } else {
    cb.call(this);
  }
}

/**
  Returns a raw HTTP/500 Response

  @param {object} res
  @param {string} message
  @param {array} logData
  @public
 */

Application.prototype.rawServerError = function(res, message, logData) {
  if (logData == null) {
    logData = message;
    message = null;
  }
  if (message == null) message = 'Internal Server Error';
  if (!util.isArray(logData)) logData = [logData];
  this.loadCookies(res.__request);

  var cb = function() {
    res.rawHttpMessage(500, message, logData);
  }

  if (this.session) {
    this.session.loadSession(res.__request, res, cb);
  } else {
    cb.call(this);
  }
}

/**
  Creates a class instance.

  If the class if it is available in /classes. If it doesn't exist, then will
  use the framework class instead.

  @param {string} className
  @private
 */

Application.prototype.createClassInstance = function(className) {
  var instance;
  if (this.constructors.classes[className] != null) {
    instance = new this.constructors.classes[className](this);
    if (typeof instance.initialize === "function") instance.initialize();
    return instance;
  } else {
    return new framework.classes["C" + className](this);
  }
}

/**
  Returns a string representation of the application object

  @returns {string}
  @public
 */

Application.prototype.toString = function() {
  return console.log("{ Application " + this.domain + " " + this.path + "}");
}

/**
  Loads request cookies

  @param {object} req
  @return {object}
  @private
 */

Application.prototype.loadCookies = function(req) {
  if (req.__cookies != null) return;
  return req.__cookies = getRequestCookies(req);
}

/**
  Gets the instance of a specific class

  If the class is not available in app/lib/, then the class will be created 
  from framework/lib.

  @param {string} cname
  @private
 */

Application.prototype.getClassInstance = function(cname) {
  var lib = this.lib[cname];
  if (typeof lib == 'object') {
    return lib;
  } else {
    return (this.lib[cname] = new framework.lib[cname](this))
  }
}

/**
  Builds a partial view and caches its function

  @param {string} path
  @private
 */

Application.prototype.buildPartialView = function(path) {
  var pos = path.indexOf('.'),
      ext = path.substr(pos+1),
      engine = this.enginesByExtension[ext],
      func = engine.renderPartial(path),
      id = func.id = this.relPath(path.substr(0,pos), '/views')
        .replace(/\/(_)?/g,'_').replace(/^__/, '');
  this.views.partials[id] = func;
}

/**
  Returns a new driver instance

  @param {string} driver
  @param {object} config
  @public
 */

Application.prototype.driver = function(driver, config) {
  return new framework.drivers[driver](this, config || {});
}

/**
  Returns a new storage instance

  @param {string} driver
  @param {object} config
  @public
 */

Application.prototype.storage = function(storage, config) {
  return new framework.storage[storage](this, config || {});
}

/**
  Gets a resource (driver or storage), using the config schema

  example:

    app.getResource('drivers/mysql');
    app.getResource('storages/redis:queryCache');

  @param {string} driver
  @returns {object} driver in app.drivers
  @private
 */

Application.prototype.getResource = function(scheme) {
  var db, section, source;
  scheme = scheme.split('/');
  source = scheme[0];
  scheme = scheme[1];

  if (scheme.indexOf(':') > 0) {
    scheme = scheme.split(':');
    db = scheme[0].trim();
    section = scheme[1].trim();
    return this[source][db][section];
  } else {
    return this[source][scheme];
  }
}

/**
  Creates a multi asynchronous wrapper from an object

  @param {object} object
  @returns {object} Multi-wrapped object
  @public
 */

Application.prototype.createMulti = function(object, options) {
  return new Multi(object, options);
}


/**
  Gets the static directories available in the application's public

  @returns {array}
  @private
 */

function getStaticDirs() {
  var files = fs.readdirSync(this.path + '/' + this.paths.public),
    dirs = [];
  for (var file, stat, i=0; i < files.length; i++) {
    file = files[i];
    stat = fs.lstatSync(this.path + '/' + this.paths.public + file);
    if ( stat.isDirectory() ) dirs.push(file);
  }
  return dirs;
}

/**
  Helper function, equivalent to url.parse()

  @param {string} url
  @returns {object}
  @public
 */

function parseUrl(url) {
  return urlModule.parse(url);
}

/**
  Parses the request cookies

  @param {object} req
  @returns {object}
  @private
 */

function getRequestCookies(req) {
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
}

/**
  Enhances the controller function, allowing it to inherit the Controller class. Also allows 
  the controller to locally use the static routing functions.

  @param {function} func
  @returns {function}
  @private
 */

function monkeyPatchController(func) {

  var context, newFunc, compile;
  var code = func.toString()
      .trim()
      .replace(/^function\s+(.*?)(\s+)?\{(\s+)?/, '')
      .replace(/(\s+)?\}$/, '');

  // Controller code

  var fnCode = "\n\
with (locals) {\n\n\
function "+ func.name +"(app) {\n\
  this.constructor.call(this, app);\n\
  this.constructor = " + func.name + ";\n\
  this.className = this.constructor.name;\n\
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

}

/**
  Parses the application configuration

  @private
 */

function parseConfig() {
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
}

/**
  Creates database drivers from config
 */

function createDrivers() {
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
}

/**
  Creates storages from config
 */

function createStorages() {
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

module.exports = Application;
