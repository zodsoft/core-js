
/* Driver */

function Driver(app) {
  
  this.constructor.prototype.__construct.call(this, app);
  
}

/* Driver::prototype */

framework.extend(Driver.prototype, new function() {
  
  var _ = require('underscore'),
      util = require('util'),
      extract = framework.util.extract,
      Multi = framework.require('./lib/multi'),
      slice = Array.prototype.slice;
  
  // Model API methods, provided by driver
  this.__modelMethods = {};

  // Cache Storage
  this.storage = null;
  
  // Cache timeout
  this.maxCacheTimeout = 1 * 365 * 24 * 3600;
  
  // Cache keys. The array must remain order
  this.cacheKeys = ['cacheId', 'cacheTimeout', 'cacheInvalidate'];
  
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
    context.__driver = this;
    this.__clientQuery = context[method];
    context[method] = cachedQuery;
    // TODO: Add db scheme in caching, to separate cache from drivers
    this.__cachePrefix = this.constructor.name.toLowerCase() + '_cache:';
  }
  
  /**
    Prepends cache data to an arguments array
    
    @param {object} o
    @param {array|object} args
    @private
   */
   
  this.addCacheData = function(o, args) {
    if (this.storage) {
      if (util.isArray(args)) {
        // Prepend cache object to array
        var cacheData = extract(o, this.cacheKeys, true);
        if (cacheData) args.unshift(cacheData);
      } else {
        // Transfer cacheKeys to object
        var key,i,cKeys = this.cacheKeys;
        for (i=0; i < cKeys.length; i++) {
          key = cKeys[i];
          args[key] = o[key] || null; 
        }
      }
    }
  }
  
  /**
    Internal query caching function
    
    @private
   */

  function cachedQuery() {
    
    // TODO: Convert dates
    
    var cacheID, cdata, invalidate, multi, params, timeout, 
        self = this.__driver || this,
        cachePrefix = self.__cachePrefix,
        cacheKeys = self.cacheKeys,
        cid = cacheKeys[0],
        cto = cacheKeys[1],
        cin = cacheKeys[2];
    
    params = (2 <= arguments.length) ? slice.call(arguments, 1) : [];
    
    cdata = arguments[0];
    cacheID = cdata[cid];
    timeout = cdata[cto];
    invalidate = cdata[cin];
    
    if (typeof cdata != 'object' || (cacheID == null && invalidate == null)) {
      self.__clientQuery.apply(self.client, [cdata].concat(slice.call(params)));
      return;
    }
    
    if (invalidate != null) {
      if (!util.isArray(invalidate)) invalidate = [invalidate];
      
      for (var i=0; i < invalidate.length; i++) {
        cacheID = invalidate[i];
        invalidate[i] = cachePrefix + cacheID;
      }

      self.storage.delete(invalidate, function(err) {
        var callback;
        if (err) {
          self.app.log(err);
          callback = params.pop();
          if (callback instanceof Function) callback.apply(self, [err, null, null]);
        } else {
          self.app.debug(util.format("Invalidated cacheID '%s'", invalidate));
          self.__clientQuery.apply(self.client, params);
        }
      });
      
    } else {
      
      self.storage.get(cachePrefix + cacheID, function(err, cache) {
        var callback, origCallback;
        if (err) {
          self.app.log(err);
          callback = params.pop();
          if (callback instanceof Function) callback.apply(self, [err, null, null]);
        } else {
          if (cache != null) {
            self.app.debug(util.format("Using cache for cacheID '%s'", cacheID));
            cache = JSON.parse(cache);
            origCallback = params.pop();
            if (origCallback instanceof Function) origCallback.apply(self, cache);
          } else {
            origCallback = params.pop();
            params.push(function(err, results, fields) {
              var cacheKey, queryResults;
              if (err) {
                self.app.log(err);
                callback = params.pop();
                if (callback instanceof Function) callback.apply(self, [err, null, null]);
              } else {
                cacheKey = cachePrefix + cacheID;
                if (!(timeout > 0)) timeout = self.maxCacheTimeout;
                queryResults = [err, results, fields];
                
                /* TODO: Cache timeout */
                
                var multi = self.storage.multi();
                
                multi.set(cacheKey, JSON.stringify(queryResults));
                multi.expire(cacheKey, timeout);
                multi.exec(function(err, results) {
                  if (err) {
                    self.app.log(err);
                    callback = params.pop();
                    if (callback instanceof Function) callback.apply(self, [err, null, null]);
                  } else {
                    var expires = (new Date(Date.now() + timeout * 1000)).toString();
                    self.app.debug(util.format("Stored new cache for cacheID '%s'. Expires %s", cacheID, expires));
                    origCallback.apply(self, queryResults);
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
  
  /**
    Provides the Model Hooks to a specific model object
  
    @param {object} context
    @private
   */
  
  this.provideTo = function(context) {
    _.extend(context, this.__modelMethods);
  }
  
  /* 
  
    MODEL API 
  
    The Model API methods run in the model context. 
    The `this` object points to the model instance.
    
    The driver instance attached to the model can be 
    accessed via `this.driver`.
    
    This is a work in progress, and things may be 
    added or removed in the future.
    
    The API should be implemented in every driver.
    
  */

  this.__modelMethods = {
    
    /** 
      Creates a new model object. Saves into the
      datbase, then creates the model with the provided data.
      
      Validation should be performed against the values in `o`,
      throwing an Error if not satisfied.
      
      An optional `cdata` object can be used to specify cache data,
      such as {cacheID, cacheTimeout, cacheInvalidate}.
      
      Provides: [err]
      
      @param {object} o
      @param {object} cdata
      @param {function} callback
      @public
     */
     
    new: function(o, cdata, callback) {},
    
    /** 
      Gets an new model object.
      
      Data should be automatically typecasted, based on
      its defined type (`this.properties`).
      
      An optional `cdata` object can be used to specify cache data,
      such as {cacheID, cacheTimeout, cacheInvalidate}.
      
      Provides: [err, model]
    
      @param {object} o
      @param {object} cdata
      @param {function} callback
      @public
    */
    
    get: function(o, cdata, callback) {},
    
    /**
      Saves the model data into the Database
      
      Validation should be performed before saving, throwing
      an Error if not satisfied.
      
      An optional `cdata` object can be used to specify cache data,
      such as {cacheID, cacheTimeout, cacheInvalidate}.
      
      Provides: [err]
      
      @param {function} callback
      @public
     */
     
    save: function(cdata, callback) {}
    
  }
  
});

module.exports = Driver;
