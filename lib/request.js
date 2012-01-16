
/* http.IncomingMessage */

var _ = require('underscore'),
    http = require('http'),
    formidable = require('formidable'),
    IncomingMessage = http.IncomingMessage;

IncomingMessage.prototype.__saveSession = null;
IncomingMessage.prototype.__sessionQueue = {};

/**
  Checks if cookie exists
  
  @param {string} cookie
  @return {boolean}
  @public
 */

IncomingMessage.prototype.hasCookie = function(cookie) {
  if (this.__cookies == null) this.__app.loadCookies(this);
  return this.__cookies[cookie.toLowerCase()] != null;
}

/**
  Gets a cookie value
  
  @param {string} cookie
  @returns {string}
  @public
 */

IncomingMessage.prototype.getCookie = function(cookie) {
  if (this.__cookies == null) this.__app.loadCookies(this);
  return this.__cookies[cookie.toLowerCase()];
}

/**
  Removes a cookie
  
  @param {string} cookie
  @public
 */

IncomingMessage.prototype.removeCookie = function(cookie) {
  return this.__response.removeCookie(cookie);
}

/**
  Removes several cookies
  
  @param {array} cookies
  @public
 */

IncomingMessage.prototype.removeCookies = function(cookies) {
  return this.__response.removeCookies(cookies);
}

/**
  Saves the session if it has changed
  
  @param {function} callback
  @private
 */

IncomingMessage.prototype.saveSessionState = function(callback) {
  
  var app = this.__app;
  
  if (!app.supports.session) {
    callback.call(app);
    return;
  }
  
  var self = this,
    session = this.__session,
    multi = app.redisClients.sessionStore.multi(),
    sessId = this.getCookie(app.session.sessCookie);

  if (session.user != null) {
    expires = (session.pers ? app.session.config.permanentExpires : app.session.config.temporaryExpires);
  } else {
    expires = app.session.config.guestExpires;
  }
  multi.hmset(sessId, session);
  for (key in this.__origSessionState) {
    if (session[key] == null) multi.hdel(sessId, key);
  }
  multi.expire(sessId, expires);
  multi.exec(function(err, replies) {
    if (err || replies[0] !== 'OK') {
      return app.serverError(self.__response, ['REDIS SERVER', err]);
    } else {
      return callback.call(app);
    }
  });
  return null;
}

/**
  Checks if the session has changed
  
  @returns {boolean}
  @private
 */

IncomingMessage.prototype.sessionChanged = function() {
  var app = this.__app;
  
  if (!app.supports.session) return false;
  
  var curSessionJson = JSON.stringify(this.__session);
  return (this.hasCookie(this.__app.session.sessCookie) 
  && curSessionJson !== this.__sessionJson && curSessionJson !== '{}');
}

/**
  Gets POST data & files
  
  @param {function} callback
  @private
 */

IncomingMessage.prototype.getPostData = function(callback) {
  var req = this,
    res = this.__response,
    app = this.__app,
    form;
  if (req.headers['content-type'] != null) {
    form = req.__incomingForm = new formidable.IncomingForm();
    form.uploadDir = (app.path + '/') + app.paths.upload.replace(app.regex.startOrEndSlash, '') + "/";
    form.maxFieldsSize = app.config.server.maxFieldSize;
    form.encoding = 'utf-8';
    form.keepExtensions = app.config.server.keepUploadExtensions;
    form.parse(req, function(err, fields, files) {
      if (err) {
        app.serverError(res, err);
      } else {
        callback.call(req, fields, files);
      }
    });
  } else {
    app.badRequest(res);
  }
}

/**
  Checks if the upload limit has exceeded
  
  @returns {boolean}
  @private
 */

IncomingMessage.prototype.exceededUploadLimit = function() {
  if (this.headers['content-length'] != null) {
    var bytesExpected = parseInt(this.headers['content-length'], 10),
      uploadSize = this.__app.config.server.maxUploadSize;
    if (bytesExpected > uploadSize) {
      this.__app.emit('upload_limit_exceeded', this, this.__response);
      if (this.__stopRoute === true) return true;
      this.__response.rawHttpMessage({
        statusCode: 400,
        message: "Upload limit exceeded: " + (uploadSize / (1024 * 1024)) + " MB.",
        raw: true
      });
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

/**
  Prevents the route from running.
  
  If this function is used, the response needs to be sent manually
  
  @private
 */

IncomingMessage.prototype.stopRoute = function() {
  this.__stopRoute = true;
}