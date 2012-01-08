
/* Driver */

function Driver(app) {
  
  this.constructor.prototype.__construct.call(this, app);
  
}

/* Driver::prototype */

framework.extend(Driver.prototype, new function() {
  
  var _ = require('underscore'),
      Multi = framework.require('./lib/multi');
      
  this.maxCacheTimeout = 1 * 365 * 24 * 3600;
  
  // Constructor
  this.__construct = function(app) {
    this.app = app;
    this.className = this.constructor.name;
    framework.util.onlySetEnumerable(this, ['className']);
  }
  
  /**
    Sets the function that generates the cache
    
    @param {object} context
    @param {string} method
    @private
   */
  
  this.setCacheFunc = function(context, method) {
    this.__clientQuery = context[method];
    context[method] = cachedQuery;
    this.__cachePrefix = 'driver:' + this.constructor.name.toLowerCase() + '_cache_';
  }
  
  /**
    Internal query caching function
    
    @private
   */

  function cachedQuery() {
    var cacheID, cdata, invalidate, multi, params, timeout, 
        self = this,
        cachePrefix = this.__cachePrefix;
    
    cdata = arguments[0];
    params = (2 <= arguments.length) ? Array.prototype.slice.call(arguments, 1) : [];
    
    // If no caching data is specified, perform normal query
    // TODO: Also return if storage is not available
    if (typeof cdata != 'object' || (cdata.cacheID == undefined && cdata.invalidate == undefined)) {
      this.__clientQuery.apply(this.client, [cdata].concat(Array.prototype.slice.call(params)));
      return;
    }
    cacheID = cdata.cacheID, timeout = cdata.timeout, invalidate = cdata.invalidate;
    if (invalidate != null) {
      if (!util.isArray(invalidate)) invalidate = [invalidate];
      
      for (var i=0; i < invalidate.length; i++) {
        cacheID = invalidate[i];
        invalidate[i] = cachePrefix + cacheID;
      }

      this.storage.delete(invalidate, function(err) {
        var callback;
        if (err) {
          self.app.log(err);
          callback = params.pop();
          (typeof callback.apply == "function") 
          ? callback.apply(self, [err, null, null]) 
          : undefined;
        } else {
          self.app.debug("Invalidated cacheID '" + (invalidate.toString()) + "'");
          self.__clientQuery.apply(self.client, params);
        }
      });
      
    } else {
      
      this.storage.get(cachePrefix + cacheID, function(err, cache) {
        var callback, origCallback;
        if (err) {
          self.app.log(err);
          callback = params.pop();
          return typeof callback.apply == "function" ? callback.apply(self, [err, null, null]) : undefined;
        } else {
          if (cache != null) {
            self.app.debug("Using cache for cacheID '" + cacheID + "'");
            cache = JSON.parse(cache);
            origCallback = params.pop();
            return typeof origCallback.apply == "function" ? origCallback.apply(self, cache) : undefined;
          } else {
            origCallback = params.pop();
            params.push(function(err, results, fields) {
              var cacheKey, queryResults;
              if (err) {
                self.app.log(err);
                callback = params.pop();
                if (typeof callback.apply == "function") {
                  callback.apply(self, [err, null, null]);
                }
              } else {
                cacheKey = cachePrefix + cacheID;
                if (!(timeout > 0)) timeout = self.maxCacheTimeout;
                queryResults = [err, results, fields];
                
                /* TODO: Cache timeout */
                
                self.storage.set(cacheKey, JSON.stringify(queryResults), function(err) {
                  if (err) {
                    self.app.log(err);
                    callback = params.pop();
                    return typeof callback.apply == "function" ? callback.apply(self, [err, null, null]) : undefined;
                  } else {
                    self.app.debug("Stored new cache for cacheID '" + cacheID + "'. Expires " 
                    + ((new Date(Date.now() + timeout * 1000)).toString()));
                    return origCallback.apply(self, queryResults);
                  }
                });
              }
            });
            self.__clientQuery.apply(self.client, params);
          }
        }
      });
    }
  }
  
  /**
    Multi support. See lib/multi.js
    
    @param {object} context
    @param {object} config
    @public
   */
   
  this.multi = function(config) {
    return new Multi(this, config);
  }
    
  
});

module.exports = Driver;
