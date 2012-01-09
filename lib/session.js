
/* Session */

function Session(app, config) {
  
  /** { 
    guestSessions: false,
    regenInterval: 5 * 60,
    permanentExpires: 30 * 24 * 3600,
    temporaryExpires: 24 * 3600,
    guestExpires: 7 * 24 * 3600,
    storage: [Object storage]
  } */
  
  this.constructor.prototype.__construct.call(this, app, config);
  
}

/* Session::prototype */

framework.extend(Session.prototype, new function() {
  
  var _ = require('underscore'),
      crypto = require('crypto'),
      node_uuid = require('node-uuid');
  
  // Session defaults
  this.typecastVars = [];
  this.sessCookie = "_sess";
  this.hashCookie = "_shash";
  this.defaultUserAgent = "Mozilla";
  this.salt = "$28b28fc2ebcd355ca1a2be8881e888a.67a42975e1626d59434e576b5c63f3483!";

  // Constructor
  this.__construct = function(app, config) {
    
    config = config || {};
    this.app = app;
    
    this.config = _.extend({
      guestSessions: false,
      regenInterval: 5 * 60,
      permanentExpires: 30 * 24 * 3600,
      temporaryExpires: 24 * 3600,
      guestExpires: 7 * 24 * 3600,
    }, config);
    
    this.storage = (config.storage || app.cache.session || app.cache.default);
    if (typeof this.storage == 'undefined') throw new Error('Session requires a storage');
    this.className = this.constructor.name;
    
    framework.util.onlySetEnumerable(this, ['className', 'sessCookie', 'hashCookie', 'salt', 'storage']);
  }

  /**
    Creates a session
    
    @param {object} req
    @param {object} res
    @param {object} data
    @param {boolean} persistent
    @param {function} callback
    @public
   */
    
  this.create = function(req, res, data, persistent, callback) {
    var expires, guest, hashes, multi, self, userAgent, userAgentMd5, self = this;
    guest = null;
    if (persistent == 'guest') {
      guest = true;
      persistent = 1;
    }
    this.app.debug( guest ? 'Creating guest session' : 'Creating session' );
    userAgent = req.headers['user-agent'] || this.defaultUserAgent;
    userAgentMd5 = this.md5(userAgent);
    hashes = this.createHash(userAgent, guest);
    
    expires = (persistent) 
    ? this.config.permanentExpires 
    : (guest ? this.config.guestExpires : this.config.temporaryExpires);
    
    if (!guest) {
      data = _.extend(data, {
        fpr: hashes.fingerprint,
        ua_md5: userAgentMd5,
        pers: (persistent ? 1 : 0)
      });
    }
    
    multi = this.storage.multi();
    if (!guest && req.__session.guest && req.hasCookie(this.sessCookie)) {
      multi.delete(req.getCookie(this.sessCookie));
    }
    multi.setHash(hashes.sessId, data);
    multi.expire(hashes.sessId, expires);
    
    multi.exec(function(err, replies) {
      if (err) app.log(err);
      else {
        res.setCookie(self.sessCookie, hashes.sessId, {
          expires: (persistent ? self.config.permanentExpires : null)
        });
        if (!guest) {
          res.setCookie(self.hashCookie, hashes.fingerprint, {
            expires: self.config.regenInterval
          });
        }
        if (guest) data.guest = parseInt(data.guest);
        data = self.typecast(data);
        req.__session = data;
        req.__origSessionState = _.extend({}, data);
        req.__sessionJson = JSON.stringify(data);
        self.app.emit('session_load', req, res);
        callback.call(self, data);
      }
    });
  }

  /**
    Destroys a session
    
    @param {object} req
    @param {object} res
    @param {function} callback
    @public
   */

  this.destroy = function(req, res, callback) {
    var fingerprint, sessId, self = this;
    this.app.debug('Destroying session');
    if (req.hasCookie(this.sessCookie) && req.__session) {
      sessId = req.getCookie(this.sessCookie);
      fingerprint = this.getFingerprint(req, sessId);
      if (fingerprint == req.__session.fpr) {
        this.storage.delete(sessId, function(err) {
          if (err) app.serverError(res, [err]);
          else {
            res.removeCookies([self.sessCookie, self.hashCookie]);
            return callback.call(self);
          }
        });
      } else {
        res.removeCookies([this.sessCookie, this.hashCookie]);
        this.app.login(res);
      }
    } else {
      this.app.login(res);
    }
  }

  /**
    Loads the session
    
    @param {object} req
    @param {object} res
    @param {function} callback
    @private
   */
    
  this.loadSession = function(req, res, callback) {
    var fingerprint, sessHash, sessId, self = this;
    if (req.__loadedSession == true) {
      callback.call(this);
      return;
    } else {
      req.__loadedSession = true;
    }
    sessId = req.getCookie(this.sessCookie);
    sessHash = req.getCookie(this.hashCookie);
    fingerprint = self.getFingerprint(req, sessId);
    if (sessId) {
      this.storage.getHash(sessId, function(err, data) {
        if (err) {
         self.app.serverError(res, [err]);
         return;
        }
        var expires, guest, hashes, multi, newHash, newSess, ua_md5, userAgent;
        guest = !(data.user != null);
        if (err) {
          self.app.serverError(res, ['REDIS SERVER', err]);
        } else if (_.isEmpty(data)) {
          res.removeCookie(self.hashCookie);
          self.createGuestSession(req, res, callback);
        } else {
          if (guest) data.guest = parseInt(data.guest);
          if (!guest) data.pers = parseInt(data.pers);
          data = self.typecast(data);
          if (guest) {
            self.app.debug('Loading guest session');
            req.__session = data;
            req.__origSessionState = _.extend({}, data);
            req.__sessionJson = JSON.stringify(data);
            self.app.emit('session_load', req, res);
            callback.call(self);
          } else if (sessHash) {
            if (sessHash == fingerprint && sessHash == data.fpr) {
              self.app.debug('Loading session');
              req.__session = data;
              req.__origSessionState = _.extend({}, data);
              req.__sessionJson = JSON.stringify(data);
              self.app.emit('session_load', req, res);
              callback.call(self);
            } else {
              req.removeCookies([self.sessCookie, self.hashCookie]);
              self.app.login(res);
            }
          } else {
            userAgent = req.headers['user-agent'] || self.defaultUserAgent;
            ua_md5 = self.md5(userAgent);
            if (ua_md5 == data.ua_md5) {
              hashes = self.createHash(userAgent);
              newSess = hashes.sessId;
              newHash = hashes.fingerprint;
              expires = self.config[(data.pers ? 'permanentExpires' : (data.user ? 'temporaryExpires' : 'guestExpires'))];
              multi = self.storage.multi();
              multi.updateHash(sessId, {fpr: newHash});
              multi.rename(sessId, newSess);
              multi.expire(newSess, expires);
              multi.exec(function(err, replies) {
                if (err) {
                  self.app.serverError(res, ['REDIS SERVER', err]);
                } else {
                  res.setCookie(self.sessCookie, newSess, {
                    expires: (data.pers ? expires : void 0)
                  });
                  res.setCookie(self.hashCookie, newHash, {
                    expires: self.config.regenInterval
                  });
                  req.__cookies[self.sessCookie.toLowerCase()] = newSess;
                  data.fpr = req.__cookies[self.hashCookie.toLowerCase()] = newHash;
                  req.__session = data;
                  req.__origSessionState = _.extend({}, data);
                  req.__sessionJson = JSON.stringify(data);
                  self.app.emit('session_load', req, res);
                  self.app.debug('Regenerating session');
                  callback.call(self);
                }
              });
            } else {
              res.removeCookies([self.sessCookie, self.hashCookie]);
              self.app.login(res);
            }
          }
        }
      });
    } else if (this.config.guestSessions) {
      res.removeCookie(this.hashCookie);
      this.createGuestSession(req, res, callback);
    } else {
      if (sessHash) res.removeCookie(this.hashCookie);
      req.__session = req.__origSessionState = {};
      req.__sessionJson = '';
      this.app.emit('session_load', req, res);
      callback.call(self);
    }
  }

  /**
    Creates a guest session
    
    @param {object} req
    @param {object} res
    @param {function} callback
    @public
   */
  
  this.createGuestSession = function(req, res, callback) {
    var self = this;
    this.create(req, res, {guest: '1'}, "guest", function(data) {
      return callback.call(self);
    });
  }

  /**
    Generates a session fingerprint for a given session ID
    
    @param {object} req
    @param {string} sessId
    @returns {string} fingerprint hash
    @private
   */

  this.getFingerprint = function(req, sessId) {
    var userAgent = (req.headers['user-agent'] || this.defaultUserAgent);
    return this.md5(userAgent + sessId + this.salt);
  }

  /**
    Generates an MD5 hash of a given string
    
    @param {string} string
    @returns {string} md5 hash
    @private
   */
   
  this.md5 = function(string) {
    return crypto.createHash('md5').update(string).digest('hex');
  }

  /**
    Creates a session hash
    
    @param {string} userAgent
    @param {boolean} guest
    @returns {object}
    @private
   */
  
  this.createHash = function(userAgent, guest) {
    var sessId = this.md5(node_uuid());
    if (guest) {
      return {sessId: sessId};
    } else {
      var fingerprint = this.md5(userAgent + sessId + this.salt);
      return {sessId: sessId, fingerprint: fingerprint};
    }
  }

  /**
    Performs automatic type coercion on session data.
    
    The session variables that will be converted, are specified in the `typecastVars` array.
    
    @param {object} data
    @returns {object} with data converted
    @private
   */

  this.typecast = function(data) {
    for (var key,i=0; i < this.typecastVars.length; i++) {
      key = this.typecastVars[i];
      if (data[key] != null) data[key] = framework.util.typecast(data[key]);
    }
    return data;
  }
  
});

module.exports = Session;
