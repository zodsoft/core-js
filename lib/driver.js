
/* Driver */

var _ = require('underscore'),
    util = require('util'),
    extract = framework.util.extract,
    Multi = framework.require('./lib/multi'),
    slice = Array.prototype.slice;


function Driver() {

}

// Cache Storage
Driver.prototype.storage = null;

// Cache timeout
Driver.prototype.maxCacheTimeout = 1 * 365 * 24 * 3600;

// Cache keys. If overridden, these should be specified in the same order
Driver.prototype.cacheKeys = ['cacheID', 'cacheTimeout', 'cacheInvalidate'];

/**
  Sets the function that generates the cache
  
  @param {object} context
  @param {string} method
  @private
 */

Driver.prototype.setCacheFunc = function(context, method) {
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
 
Driver.prototype.addCacheData = function(o, args) {
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
  Multi support. See lib/multi.js
  
  @param {object} context
  @param {object} config
  @public
 */
 
Driver.prototype.multi = function(config) {
  return new Multi(this, config);
}

/**
  Provides the Model Hooks to a specific model object

  @param {object} context
  @private
 */

Driver.prototype.provideTo = function(context) {
  // Provide aliases from driver prototype
  _.extend(context, framework.driverProto.__modelMethods);
  
  // Provide methods from self
  _.extend(context, this.__modelMethods);
}

/**
  Internal query caching function
  
  @private
 */

function cachedQuery() {
  
  var cacheID, cdata, invalidate, multi, params, timeout, validTimeout,
      self = this.__driver || this,
      app = self.app,
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
  
  validTimeout = (typeof timeout == 'number' && timeout > 0);
  
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
        app.log(err);
        callback = params.pop();
        if (callback instanceof Function) callback.apply(self, [err, null, null]);
      } else {
        app.debug(util.format("Invalidated cacheID '%s'", cacheID));
        self.__clientQuery.apply(self.client, params);
      }
    });
    
  } else {
    
    self.storage.get(cachePrefix + cacheID, function(err, cache) {
      var callback, origCallback;
      if (err) {
        app.log(err);
        callback = params.pop();
        if (callback instanceof Function) callback.apply(self, [err, null, null]);
      } else {
        if (cache != null) {
          app.debug(util.format("Using cache for cacheID '%s'", cacheID));
          cache = JSON.parse(cache);
          origCallback = params.pop();
          if (origCallback instanceof Function) origCallback.apply(self, cache);
        } else {
          origCallback = params.pop();
          params.push(function(err, results, fields) {
            var cacheKey, queryResults;
            if (err) {
              app.log(err);
              callback = params.pop();
              if (callback instanceof Function) callback.apply(self, [err, null, null]);
            } else {
              cacheKey = cachePrefix + cacheID;
              if (typeof timeout == 'number' && timeout > self.maxCacheTimeout) {
                timeout = self.maxCacheTimeout;
              }
              queryResults = [err, results, fields];
              
              var multi = self.storage.multi();
              
              multi.set(cacheKey, JSON.stringify(queryResults));
              if (validTimeout) multi.expire(cacheKey, timeout);
              multi.exec(function(err, results) {
                if (err) {
                  app.log(err);
                  callback = params.pop();
                  if (callback instanceof Function) callback.apply(self, [err, null, null]);
                } else {
                  if (app.debugMode) {
                    if (validTimeout) {
                      var expires = (new Date(Date.now() + timeout * 1000)).toString();
                      app.debug(util.format("Stored new cache for cacheID '%s'. Expires %s", cacheID, expires));
                    } else {
                      app.debug(util.format("Stored new cache for cacheID '%s'.", cacheID));
                    }
                  }
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


/* 

  MODEL API 

  The Model API methods run in the model context. 
  The `this` object points to the model instance that
  inherited the methods below.
  
  The driver instance attached to the model can be 
  accessed via `this.driver`.
  
  
  IMPLEMENTATION
  
  Only the empty functions should be implemented in the
  drivers. The ones that provide common functionality 
  & aliases are passed over to the model and integrate 
  seamlessly with it.
  
  
  CACHING
  
  Model caching is done by the underlying driver, which 
  abstracts the caching functionality from the model.
  
  All the model methods in the API receive a `cdata`
  parameter, which is used to control the driver's cache
  mechanism.
  
*/

Driver.prototype.__modelMethods = {
  
  /** 
    Creates a new model object. Saves into the
    database, then creates the model with the provided data.
    
    Validation should be performed against the values in `o`,
    throwing an Error if not satisfied.
    
    Provides: [err, model]
    
    @param {object} o
    @param {object} cdata
    @param {function} callback
    @public
   */

  new: function(o, cdata, callback) {
    var self = this;

    // Process callback & cache Data
    if (typeof callback == 'undefined') { callback = cdata; cdata = {}; }

    // Model::insert > Get ID > Create Model
    this.insert(o, cdata, function(err, id) {
      if (err) callback.call(self, err, null);
      else {
        self.get(id, function(err, model) {
          if (err) callback.call(self, err, null);
          else {
            callback.call(self, null, model);
          }
        })
      }
    });
  },
  
  create: function() { this.new.apply(this, arguments); },
  
  /** 
    Same behavior as new, but instead of returning a new object,
    returns the ID for the new database entry.
    
    Provides: [err, id]
    
    @param {object} o
    @param {object} cdata
    @param {function} callback
    @public
   */
   
  insert: function(o, cdata, callback) {},
  
  add: function() { this.insert.apply(this, arguments); },
  
  /** 
    Gets an new model object.
    
    Type coercion is performed automatically, based on the
    type definition settings in the model's `properties`.
    
    The `o` argument can also contain an array of arguments,
    which can either be objects or integers. In this case,
    an array of models will be provided.
    
    Provides: [err, model]
  
    @param {object|int|array} o
    @param {object} cdata
    @param {function} callback
    @public
  */
  
  get: function(o, cdata, callback) {},

  find: function() { this.get.apply(this, arguments); },

  /** 
    Gets all records from the database
    
    @param {object} cdata
    @param {function} callback
    @public
  */
  
  getAll: function(cdata, callback) {},
  
  findAll: function() { this.getAll.apply(this, arguments); },

  /**
    Saves the model data into the Database.
    
    Since this method is called directly by the `ModelObject`s, 
    there is no need to validate, since the data provided in `o`
    has been properly validated.
    
    The item's ID to update is available on `o.id`.

    Provides: [err]
    
    @param {object} o
    @param {function} callback
    @public
   */
   
  save: function(o, cdata, callback) {},
  
  update: function() { this.save.apply(this, arguments); },
  
  /**
    Deletes the model data from the database.
    
    The `id` argument can also contain an array of id's
    to remove from the database.

    Provides: [err]
    
    @param {int|array} id
    @param {object} cdata
    @param {function} callback
    @public
   */
   
  delete: function(id, cdata, callback) {},
  
  destroy: function() { this.delete.apply(this, arguments); }
  
}

module.exports = Driver;
