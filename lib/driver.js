
/* Driver */

function Driver(app) {
  
  this.constructor.prototype.__construct.call(this, app);
  
}

/* Driver::prototype */

framework.extend(Driver.prototype, new function() {
  
  var _ = require('underscore');
  
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
    Loads several queries asynchronously
  
    The order object should contain keys/values, belonging to both the name of the callback
    from the MySQL class and an array containing the parameters from such callback.
    
    The callback (receiving `err, results`) will be called upon completion of all queries, asynchronously.
    
    @param {object} order
    @param {function} callback
    @public
   */
  
  this.load = function(order, callback) {
    var params = {
          vars: _.keys(order),
          args: {},
          methods: _.values(order),
          results: {},
          errorCount: 0,
          errors: {},
          current: 0,
          callback: callback
        };
    for (var key,cb,args,length,arr,i=0; i < param.vars.length; i++) {
      key = param.vars[i];
      cb = params.methods[i];
      if (util.isArray(cb)) {
        length = cb.length;
        if (length == 0) {
          throw new Error("MySQL::load() No param given for '" + key + "'");
        } else {
          arr = cb;
          cb = arr[0];
          args = (2 <= arr.length) ? arr.slice(1) : []
          params.methods[i] = cb;
          params.args[key] = args;
        }
      } else {
        params.methods[i] = cb;
        params.args[key] = [];
      }
    }
    return loadNext.call(this, params);
  }
  
  /**
    Internal load function. Handles asynchronous queries
    
    @param {object} params
    @private
   */

  function loadNext(params) {
    var self = this;
    if (params.current == params.methods.length) {
      
      var errorCount = params.errorCount, 
          errors = params.errors, 
          results = params.results, 
          callback = params.callback;
          
      if (errorCount > 0) {
        var key, error, err = '';
        for (key in errors) {
          error = errors[key];
          err += key + ": " + (error.toString()) + "\n";
        }
        err = new Error(err);
      } else {
        err = null;
      }
      return callback.call(this, err, results);
    } else {
      var current = params.current,
          cb = this[params.methods[current]],
          key = params.vars[current],
          args = (params.args[params.vars[current]] || []);
      args.push(function() {
        var retvals;
        retvals = (1 <= arguments.length) ? Array.prototype.slice.call(arguments, 0) : [];
        if (err = retvals[0]) {
          params.errorCount++;
          params.errors[key] = err;
        }
        retvals.shift();
        params.results[key] = (retvals.length == 1) ? retvals[0] : retvals;
        params.current++;
        loadNext.call(self, params);
      });
      cb.apply(this, args);
    }
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
  
});

module.exports = Driver;
