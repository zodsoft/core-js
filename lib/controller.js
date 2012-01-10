
/* Controller */

function Controller(app) {
  
  this.constructor.prototype.__construct.call(this, app);
  
}

/* Controller::static */

var _ = require('underscore'),
    _s = require('underscore.string'),
    fs = require('fs');

framework.extend(Controller, new function() {
  
  this.authRequired = false;
  
  /* TODO: add aliases for the other HTTP methods */

  /**
    Routing functions, accepting the following parameters:
    
    @param {string} route, route to add
    @param {object} arg2, route validation (optional)
    @param {object} arg3, route validation messages (optional, requires arg2)
    @param {function} arg4, callback to run if route is resolved
    @public
   */

  this.routingFunctions = new function() {
    
    /**
      Adds a generic route, matching only GET requests.

      The route will be public or private, depending on the value of `authRequired`.
      
      @static
     */
    
    this.get 
    = function(route, arg2, arg3, arg4) {
      var routeArr = [this, framework.regex.getMethod, this.authRequired, route];
      registerRoute(routeArr, arg2, arg3, arg4);
    };

    /**
      Adds a generic route, matching only POST requests.

      The route will be public or private, depending on the value of `authRequired`.
      
      @static
     */

    this.post 
    = function(route, arg2, arg3, arg4) {
      var routeArr = [this, framework.regex.postMethod, this.authRequired, route];
      registerRoute(routeArr, arg2, arg3, arg4);
    };

    /**
      Adds a generic route, matching both GET & POST requests.

      The route will be public or private, depending on the value of `authRequired`.
      
      @static
     */

    this.getpost 
    = this.postget 
    = function(route, arg2, arg3, arg4) {
      var routeArr = [this, framework.regex.getPostMethod, this.authRequired, route];
      registerRoute(routeArr, arg2, arg3, arg4);
    };
    
    /**
      Adds a public route, matching only GET requests.

      The route will always be public, regardless of the value of `authRequired`.
      
      @static
     */

    this.publicGet
    = this.public_get
    = function(route, arg2, arg3, arg4) {
      var routeArr = [this, framework.regex.getMethod, false, route];
      registerRoute(routeArr, arg2, arg3, arg4);
    };

    /**
      Adds a public route, matching only POST requests.

      The route will always be public, regardless of the value of `authRequired`.
      
      @static
     */

    this.publicPost
    = this.public_post
    = function(route, arg2, arg3, arg4) {
      var routeArr = [this, framework.regex.postMethod, false, route];
      registerRoute(routeArr, arg2, arg3, arg4);
    };

    /**
      Adds a public route, matching both GET & POST requests.
      
      This route will always be public, regardless of the value of `authRequired`.
      
      @static
     */

    this.publicGetPost
    = this.publicPostGet
    = this.public_getpost
    = this.public_postget
    = function(route, arg2, arg3, arg4) {
      var routeArr = [this, framework.regex.getPostMethod, false, route];
      registerRoute(routeArr, arg2, arg3, arg4);
    };
    
    /**
      Adds a private route, matching only GET requests.
      
      This route will be public or private, depending on the value of `authRequired`.
      
      @static
     */

    this.privateGet
    = this.private_get
    = function(route, arg2, arg3, arg4) {
      var routeArr = [this, framework.regex.getMethod, true, route];
      registerRoute(routeArr, arg2, arg3, arg4);
    };
    
    /**
      Adds a private route, matching only POST requests
      
      This route will always be private, regardless of the value of `authRequired`.
      
      @static
     */

    this.privatePost
    = private_post
    = function(route, arg2, arg3, arg4) {
      var routeArr = [this, framework.regex.postMethod, true, route];
      registerRoute(routeArr, arg2, arg3, arg4);
    };
    
    /**
      Adds a private route, matching both GET & POST requests.
      
      This route will always be private, regardless of the value of `authRequired`.
      
      @static
     */

    this.privateGetPost
    = this.privatePostGet
    = this.private_getpost
    = this.private_postget
    = function(route, arg2, arg3, arg4) {
      var routeArr = [this, framework.regex.getPostMethod, true, route];
      registerRoute(routeArr, arg2, arg3, arg4);
    };
    
  }
  
});

/* Controller::prototype */

framework.extend(Controller.prototype, new function() {
  
  var aliasRegex = {
    re1: /Controller$/,
    re2: /^-/
  };
  
  this.authRequired = false;
  this.queuedRoutes = {};
  
  // Constructor
  this.__construct = function(app) {
    this.app = app;
    
    this.className = this.constructor.name;
    var queuedRoutes = this.queuedRoutes[this.app.domain]
    for (var args,i=0; i < queuedRoutes.length; i++) {
      args = queuedRoutes[i];
      registerRoute.apply(this, args);
    }
    framework.util.onlySetEnumerable(this, ['className', 'authRequired']);
  }
  
  /**
    Retrieves GET parameters, with field validation & CSRF protection.
    
    If the CSRF token is specified, the request will be validated against it. On failure to
    validate, an HTTP/400 response will be sent.
    
    The query parameters from the request will be validated against the route's validation rules.
    
    @param {object} req
    @param {string} token (optional)
    @param {function} callback
    @public
   */

  this.get = function(req, token, callback) {
    var badVal, csrf_check_passed, field, fields, key, msg, res;
    res = req.__response;
    if (typeof this.app.csrf === 'undefined') token = undefined;
    if (callback == undefined) { callback = token, token = undefined; }
    fields = req.__queryData;
    if (req.method === 'GET') {
      if (token) {
        if (fields[token + "_key"] != null) {
          csrf_check_passed = this.app.csrf.checkToken(req, token, fields[token + "_key"]);
          if (csrf_check_passed) {
            if (this.app.validate(req, fields, true)) {
              for (key in fields) {
                if (req.__params[key] == undefined) delete req.__params[key];
              }
              callback.call(this, fields);
            } else if (req.__route.messages != null) {
              field = req.__invalidParam[0];
              badVal = req.__invalidParam[1];
              if ((msg = req.__route.messages[field]) != null) {
                res.rawHttpMessage(400, msg);
              } else {
                this.app.notFound(res);
              }
            } else {
              this.app.notFound(res);
            }
          } else {
            res.rawHttpMessage(400);
          }
        } else {
          res.rawHttpMessage(400);
        }
      } else if (this.app.validate(req, fields, true)) {
        for (key in fields) {
          if (req.__params[key] == undefined) delete req.__params[key];
        }
        callback.call(this, fields);
      } else if ((req.__route.messages != null) && (req.__invalidParam != null)) {
        field = req.__invalidParam[0];
        badVal = req.__invalidParam[1];
        if ((msg = req.__route.messages[field]) != null) {
          res.rawHttpMessage(400, msg);
        } else {
          this.app.notFound(res);
        }
      } else {
        this.app.notFound(res);
      }
    } else if (req.method === 'POST') {
      res.rawHttpMessage(400);
    } else {
      this.app.notFound(res);
    }
  }
  
  /**
    Retrieves POST fields & files, with validation & CSRF protection.
    
    If the CSRF token is specified, the request will be validated against it. On failure to
    validate, an HTTP/400 response will be sent.
    
    The request fields will be validated against the route's validation rules.
    
    The files uploaded are stored by default on /private/incoming.
    
    @param {object} req
    @param {string} token (optional)
    @param {function} callback
    @public
   */

  this.post = function(req, token, callback) {
    var csrf_check_passed, fields, files, postData, res, self;
    res = req.__response;
    if (callback == undefined) { callback = token, token = null; }
    if (req.method === 'POST') {
      self = this;
      postData = req.__postData;
      fields = postData.fields;
      files = postData.files;
      if (token) {
        if (fields[token + "_key"] != null) {
          csrf_check_passed = this.app.csrf.checkToken(req, token, fields[token + "_key"]);
          if (csrf_check_passed) {
            if (this.app.validate(req, fields)) {
              callback.call(self, fields, files);
            }
          } else {
            this.cleanupFilesUploaded(files, true);
            res.rawHttpMessage(400);
          }
        } else {
          this.cleanupFilesUploaded(files, true);
          res.rawHttpMessage(400);
        }
      } else {
        if (this.app.validate(req, fields)) {
          callback.call(self, fields, files);
        }
      }
    } else {
      this.cleanupFilesUploaded(files, true);
      res.rawHttpMessage(400);
    }
  }

  /**
    Returns a controller by its alias
    
    @param {string} name
    @return {object}
    @private
   */

  this.getControllerByAlias = function(name) {
    // TODO: ignore /main
    var controller, controllerName;
    name = name.replace(this.app.regex.startOrEndSlash, '');
    controllerName = name + '_controller'
    controller = this.app.controllers[controllerName];
    if (controller == undefined) return null;
    else return controller;
  }

  /**
    Gets a controller alias
    
    @param {string} controllerClass (optional)
    @return {string}
    @private
   */

  this.getAlias = function(controllerClass) {
    if (!controllerClass) controllerClass = this.constructor.name;
    return (_s.dasherize(controllerClass
    .replace(aliasRegex.re1, ''))
    .replace(aliasRegex.re2, ''));
  }

  /**
    Determines which route to use and which callback to call, based on
    the request's method & pathname.
    
    @param {object} urlData
    @param {object} res
    @param {object} req
    @private
   */

  this.processRoute = function(urlData, req, res) {
    var cb, alias, controller, match, regex, route, routes, self, url;
    var self = this,
        app = this.app;
    
    res.__controller = this;
    key = route = regex = match = controller = alias = undefined;
    self = this;
    routes = this.app.routes[this.constructor.name] || [];
    url = urlData.pathname;
    
    for (var key in routes) {
      route = routes[key];
    
      // Matched route without validation
      
      if (route.path === url && _.isEmpty(route.validation)) {
        if (route.method.test(req.method)) {
          req.__route = route;
          if (req.method === 'POST') {
            if (req.exceededUploadLimit()) return;
            req.getPostData(function(fields, files) {
              if ((fields.ajax != null) && parseInt(fields.ajax) === 1) {
                req.__isAjax = true;
              }
              delete fields.ajax;
              files = self.cleanupFilesUploaded(files);
              req.__postData = {
                fields: fields,
                files: files
              };
              
              // Preload callback
              req.__handledRoute = true;
              cb = function() {
                if (app.session && route.authRequired) {
                  if (req.__session.user != null) {
                    route.callback.call(self, req, res);
                  } else {
                    app.controller.cleanupFilesUploaded(files, true);
                    app.login(res);
                  }
                } else {
                  route.callback.call(self, req, res);
                }
              }
              
              // Check if session is enabled, otherwise proceed normally with prepared callback
              if (app.session) {
                 self.app.session.loadSession(req, res, cb);
              } else {
                cb.call(this);
              }
              
            });
          } else if (req.method === "GET") {
            
            // Preload callback
            req.__handledRoute = true;
            cb = function() {
              if (app.session && route.authRequired) {
                if (req.__session.user != null) {
                  route.callback.call(self, req, res);
                } else {
                  app.login(res);
                }
              } else {
                route.callback.call(self, req, res);
              }
            }
            
            // Check if session is enabled, otherwise proceed normally with prepared callback
            if (app.session) {
              app.session.loadSession(req, res, cb);
            } else {
              cb.call(this);
            }
            
          }
        } else {
          this.app.notFound(res);
        }
        
        return; // Exit function early
        
      } else if (route.regex.test(urlData.pathname)) {
        
        if (route.method.test(req.method)) {
          req.__route = route;
          if (route.validation != null) {
            match = urlData.pathname.match(route.regex);
            var i = 1;
            for (key in route.validation) {
              req.__params[key] = match[i];
              i++;
            }
          }
          if (req.method === 'POST') {
            if (req.exceededUploadLimit()) return;
            req.getPostData(function(fields, files) {
              if ( fields.ajax != null && parseInt(fields.ajax) == 1) {
                req.__isAjax = true;
              }
              delete fields.ajax;
              files = self.cleanupFilesUploaded(files);
              req.__postData = {
                fields: fields,
                files: files
              };

              // Preload callback
              req.__handledRoute = true;
              cb = function() {
                if (app.session && route.authRequired) {
                  if (req.__session.user != null) {
                    route.callback.call(self, req, res);
                  } else {
                    app.controller.cleanupFilesUploaded(files, true);
                    app.login(res);
                  }
                } else {
                  route.callback.call(self, req, res);
                }
              }
              
              // Check if session is enabled, otherwise proceed normally with prepared callback
              if (app.session) {
                self.app.session.loadSession(req, res, cb);
              } else {
                cb.call(this);
              }
              
            });
          } else if (req.method === 'GET') {
            
            // Preload callback
            req.__handledRoute = true;
            cb = function() {
              if (app.session && route.authRequired) {
                if (req.__session.user != null) {
                  route.callback.call(self, req, res);
                } else {
                  app.login(res);
                }
              } else {
                route.callback.call(self, req, res);
              }
            }
            
            // Check if session is enabled, otherwise proceed normally with prepared callback
            if (app.session) {
              self.app.session.loadSession(req, res, cb);
            } else {
              cb.call(this);
            }
            
          }
          
        } else {
          this.app.notFound(res);
        }
        
        return; // Exit function early
      }
    }
    
    /*
    
    ROUTE PROCESSING ORDER

    '/' and Single Parameter routes:
    
      a) If a controller is found associated with the route (and a route in it matches), render it 
      b) If a route is found in MainController that matches, render it 
      c) If there's a static view that matches the route, render it 
      d) Render 404

    Multiple Parameter routes:
    
      a) If a controller is found associated with the route (and a route in it matches), render it 
      b) If a route is found in MainController that matches, render it 
      c) Render 404
    
    */
    
    if (this.constructor.name === 'MainController') {
      if (req.__isMainRequest) {
        alias = url.replace(this.app.regex.startOrEndSlash, '');
        controller = alias !== 'main' ? this.getControllerByAlias(alias) : null;
        if ((controller != null) && (this.app.routes[this.constructor.name] != null)) {
          controller.processRoute.call(controller, urlData, req, res);
        
        // If there's no controller, and there's no static view to render. Try loading 
        // static resource, render 404 if not available
        } else if (this.app.staticViewExists(url)) {
          renderStaticView.call(this, url, req, res);
        } else {
          this.app.serveStatic(this.app.path + "/" + this.app.paths.public + url, req, res);
        }
      } else if (this.app.staticViewExists(url)) {
        renderStaticView.call(this, url, req, res);
      } else {
        this.app.serveStatic(this.app.path + "/" + this.app.paths.public + url, req, res);
      }
      
    // If there's no controller, and there's no static view to render. Try loading 
    // static resource, render 404 if not available
    } else if (this.app.staticViewExists(url)) {
      renderStaticView.call(this, url, req, res);
    } else {
      if (req.__isMainRequest) {
        this.app.serveStatic(this.app.path + "/" + this.app.paths.public + url, req, res);
      } else {
        // If it's a Main Request (e.g. /test), then go through main
        this.app.controller.processRoute.call(this.app.controller, urlData, req, res);
      }
    }
  }

  /**
    Determines which controller to use for a request URL
    
    @param {object} urlData
    @param {object} req
    @param {object} res
    @private
   */
    
    

  this.exec = function(urlData, req, res) {
    var url = urlData.pathname,
      matches = url.match(this.app.regex.controllerAlias),
      controller = (matches 
      ? this.app.controller.getControllerByAlias(matches[1]) || this.app.controllers.main_controller 
      : this.app.controllers.main_controller);
      
    if (controller != null) {
      controller.processRoute.call(controller, urlData, req, res);
    } else {
      this.app.notFound(res);
    }

  }
  
  /**
    Deletes uploaded files from /private/incoming.
    
    By default, uploaded files are stored in /private/incoming. This function removes files in such
    directory, depending on the removeAll argument.
    
    Only files with zero size are removed (if removeAll is set to false).
    
    If removeAll is set to true, then all files uploaded will be deleted, regardless of their size.
    
    @param {object} files
    @param {boolean} removeAll
    @public
   */

  this.cleanupFilesUploaded = function(files, removeAll) {
    var fileData, filename,
      filtered = {};
    if (removeAll) {
      for (filename in files) {
        fileData = files[filename];
        fs.unlink(fileData.path);
      }
    } else {
      for (filename in files) {
        fileData = files[filename];
        if (fileData.size === 0) {
          fs.unlink(fileData.path);
        } else {
          filtered[filename] = fileData;
        }
      }
    }
    return filtered;
  }
  
  /**
    Renders a static view
    
    @param {string} url
    @param {object} req
    @param {object} res
    @private
   */

  function renderStaticView(url, req, res) {
    var template, app = this.app;
    url = url.replace(this.app.regex.endsWithSlash, '');
    this.app.emit('static_view', req, res, url);
    if (req.__stopRoute === true) return;
    var cb = function() {
      template = app.views.staticAsoc[url];
      if (typeof template === 'string') {
        res.render('/' + template);
      } else {
        app.serverError(res, [new Error('Unable to load template for ' + url)]);
      }
    }
    if (app.session) {
      app.session.loadSession(req, res, cb);
    } else {
      cb.call(this);
    }

  }

});

/**
  Route registration function, used both in Static & Prototype methods
  
  @params {mixed} specified in the `Routing Functions` section on this file
  @private
 */

function registerRoute(route, arg2, arg3, arg4) {
  
  /*
    Route registration happens in 2 iterations:

    1) The routes are added in the Application's controller (routes are queued) 
    2) On instantiation, the routes are registered
  */
  
  if (this.app == null) {
    Controller.prototype.queuedRoutes[framework.currentDomain].push([route, arg2, arg3, arg4]);
    return;
  }

  var controller = route[0],
    caller = controller.name,
    method = route[1],
    authRequired = route[2],
    route = route[3];
  
  var validation, messages, callback

  if (arg3 == undefined && typeof arg2 == 'function') {
    validation = null, messages = null, callback = arg2;
  } else if (arg4 == undefined && typeof arg2 == 'object' && typeof arg3 == 'function') {
    messages = null, validation = arg2, callback = arg3;
  } else if (typeof arg2 == 'object' && typeof arg3 == 'object' && typeof arg4 == 'function') {
    validation = arg2, messages = arg3, callback = arg4;
  } else {
    throw new Error("[" + this.app.domain + "] Unable to process route on " + caller + ": " + route);
    return;
  }

  if ( !this.app.regex.startsWithSlash.test(route) ) route = "/" + route;
  if (caller !== 'MainController') {
    route = "/" + (this.getAlias(caller)) + route;
  }
  if (this.app.routes[caller] == null) this.app.routes[caller] = [];
  if (route !== '/') route = route.replace(this.app.regex.endsWithSlash, '');

  try {
    if (validation == null) {
      // allow an optional slash at the end
      regex = new RegExp('^' + route.replace(this.app.regex.regExpChars, '\\$1') + '\\/?$');
    } else {
      regex = route.replace(this.app.regex.regExpChars, '\\$1');
      for (key in validation) {
        if (_.isString(validation[key]) && this.app.regexKeys.indexOf(validation[key]) >= 0) {
          validation[key] = this.app.regex[validation[key]];
        }
        regex = regex.replace(new RegExp(':' + key, 'g'), '(' 
        + validation[key]
        .toString()
        .replace(this.app.regex.startOrEndSlash, '')
        .replace(this.app.regex.startOrEndRegex, '') + ')');
      }
      regex = new RegExp('^' + regex + '\\/?$');
    }
  } catch (e) {
    throw new Error("[" + this.app.domain + "] " + caller + ' ' + route + ': ' + e);
    return;
  }

  var paramKeys = ( validation ) ? _.keys(validation) : [];

  this.app.routes[caller].push({
    path: route,
    method: method,
    regex: regex,
    validation: validation || {},
    paramKeys: paramKeys,
    messages: messages,
    authRequired: authRequired,
    callback: callback,
    caller: caller
  });

}

module.exports = Controller;
