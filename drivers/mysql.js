
/* MySQL */

function MySQL(app, config) {
  
  /** {
    host: 'localhost',
    port: 3306,
    user: 'db_user',
    password: 'db_password',
    database: 'db_name',
    debug: false,
    storage: [Storage object]
  } */
  
  this.constructor.prototype.__construct.call(this, app, config);
  
}

/* MySQL::prototype */

framework.extend(MySQL.prototype, framework.driverProto);

framework.extend(MySQL.prototype, new function() {
  
  var _ = require('underscore'),
      mysql = require('mysql'),
      util = require('util'),
      regex = { endingComma: /, ?$/};

  this.maxCacheTimeout = 1 * 365 * 24 * 3600;

  // Constructor
  this.__construct = function(app, config) {
    config = config || {};
    this.className = this.constructor.name;
    this.app = app;
    this.config = config;
    this.storage = config.storage;
    delete config.storage; // prevent conflicts with original config
    this.client = mysql.createClient(config);
    this.client.__query = this.client.query;
    this.client.query = cachedQuery;
    framework.util.onlySetEnumerable(this, ['className'], framework.driverProto);
  }

  /**
    Performs a manual SQL Query
  
    Provides [err, results, fields]

    Cache: Store / {cacheId, timeout, param}
  
    @example

      db.query('SELECT * FROM table WHERE id=? AND user=?', [id, user], function(err, results, fields) {
        callback.call(err, results, fields);
      });
  
    @param {string} sql
    @param {array} params
    @param {string} appendSql
    @param {function} callback
    @public
  */

  this.query = function(sql, params, appendSql, callback) {
    var args, cdata;
    if (typeof sql != 'string') {
      cdata = sql;
      sql = sql.param;
    }
    if (callback == null) {
      callback = appendSql;
      appendSql = '';
    }
    if (!util.isArray(params)) params = [params];
    args = [(sql + " " + appendSql).trim(), params, callback];
    if (cdata != null) args.unshift(cdata);
    this.client.query.apply(this, args);
  }

  /**
    Performs a query that returns no results. Usually affecting tables/rows
  
    Provides: [err, info]

    Cache: Invalidate / {invalidate, param}
    
    @example

      db.exec('CREATE TABLE test_db (id AUTO_INCREMENT NOT NULL, PRIMARY KEY (id)', [], function(err, info) {
        console.log([err, info]);
      });

      db.exec('CREATE TABLE test_db (id AUTO_INCREMENT NOT NULL, PRIMARY KEY (id)', function(err, info) {
        console.log([err, info]);
      });
  
    @param {string} query
    @param {array} params
    @param {function} callback
    @public
  */

  this.exec = function(query, params, callback) {
    var args, cdata, self = this;
    if (typeof query != 'string') {
      cdata = query;
      query = query.param;
    }
    if (callback == null) {
      callback = params;
      params = [];
    } else if (!util.isArray(params)) {
      params = [params];
    }
    args = [query, params];
    args.push(function(err, info) {
      callback.call(self.app, err, info);
    });
    if (cdata != null) args.unshift(cdata);
    this.client.query.apply(this, args);
  }

  /**
    Performs a SELECT ... WHERE ... query
  
    Provides: [err, results, fields]

    Cache: Store / {cacheId, timeout, param}

    @example

      db.queryWhere('user=?, pass=?', [user, pass], 'users', 'id,user,pass,info', function(err, results, fields) {
        console.log([err, results, fields]);
      });

      db.queryWhere('user=?, pass=?', [user, pass], 'users', function(err, results, fields) {
        console.log([err, results, fields]);
      });
  
    @param {string} cond
    @param {array} params
    @param {string} table
    @param {string} columns
    @param {string} appendSql
    @param {function} callback
    @public
   */

  this.queryWhere = function(cond, params, table, columns, appendSql, callback) {
    var args, cdata, self = this;
    if (typeof cond != 'string') {
      cdata = cond;
      cond = cond.param;
    }
    if (appendSql == null) {
      callback = columns;
      columns = '*';
      appendSql = '';
    } else if (callback == undefined) {
      callback = appendSql;
      appendSql = '';
    }
    if (!util.isArray(params)) params = [params];
    args = [("SELECT " + columns + " FROM " + table + " WHERE " + cond + " " + appendSql).trim(), params];
    args.push(function(err, results, fields) {
      callback.call(self.app, err, results, fields);
    });
    if (cdata != null) args.unshift(cdata);
    this.client.query.apply(this, args);
  }

  /**
    Queries specific columns from a table
  
    Provides: [err, results, fields]

    Cache: Store / {cacheId, timeout, param}

    @example

      db.queryField 'username', 'users', function(err, results, fields) {
        console.log([err, results, fields]);
      });
  
    @param {string} columns
    @param {string} appendSql
    @param {function} callback
    @public
   */

  this.queryField = function(columns, table, appendSql, callback) {
    var args, cdata, self = this;
    if (typeof columns != 'string') {
      cdata = columns;
      columns = columns.param;
    }
    if (callback == null) {
      callback = appendSql;
      appendSql = '';
    }
    args = [("SELECT " + columns + " FROM " + table + " " + appendSql).trim()];
    args.push(function(err, results, fields) {
      callback.call(self.app, err, results, fields);
    });
    if (cdata != null) args.unshift(cdata);
    this.client.query.apply(this, args);
  }

  /**
    Queries fields by ID
  
    Provides: [err, results, fields]

    Cache: Store / {cacheId, timeout, param}
    
    @example

      db.queryById([1,2,3], 'users', 'id,username,password', function(err, results, fields) {
        console.log([err, results, fields]);
      });

      db.queryById(1, 'users', 'id,username,password', function(err, results, fields) {
        console.log([err, results, fields]);
      });

      db.queryById(1, 'users', function(err, results, fields) {
        console.log([err, results, fields]);
      });
    
    @param {array|int} id
    @param {string} table
    @param {string} columns
    @param {string} appendSql
    @param {function} callback
    @public
   */

  this.queryById = function(id, table, columns, appendSql, callback) {
    var args, cdata;
    if (!(typeof id == 'number' || util.isArray(id))) {
      cdata = id;
      id = id.param;
    }
    if (appendSql == null) {
      callback = columns;
      columns = '*';
      appendSql = '';
    } else if (callback == undefined) {
      callback = appendSql;
      appendSql = '';
    }
    if (typeof id == 'number') id = [id];
    args = ["id IN (" + (id.toString()) + ")", [], table, columns, appendSql, callback];
    if (cdata != null) {
      cdata.param = args[0];
      args[0] = cdata;
    }
    this.queryWhere.apply(this, args);
  }

  /**
    Queries all the entries from a table
  
    Provides: [err, results, fields]

    Cache: Store / {cacheId, timeout, param}
    
    @example

      db.queryAll('users', 'id, username, password', 'DESC', function(err, results, fields) {
        console.log([err, results, fields]);
      });

      db.queryAll('users', 'id, username, password', function(err, results, fields) {
        console.log([err, results, fields]);
      });

      db.queryAll('users', function(err, results, fields) {
        console.log([err, results, fields]);
      });
  
    @param {string} table
    @param {string} columns
    @param {string} appendSql
    @param {function} callback
    @public
   */

  this.queryAll = function(table, columns, appendSql, callback) {
    var args, cdata, self = this;
    if (typeof table != 'string') {
      cdata = table;
      table = table.param;
    }
    if (appendSql == null) {
      callback = columns;
      columns = '*';
      appendSql = '';
    } else if (callback == undefined) {
      callback = appendSql;
      appendSql = '';
    }
    args = [("SELECT " + columns + " FROM " + table + " " + appendSql).trim(), []];
    args.push(function(err, results, fields) {
      callback.call(self.app, err, results, fields);
    });
    if (cdata != null) args.unshift(cdata);
    this.client.query.apply(this, args);
  }

  /**
    Inserts values into a table
  
    Provides:  [err, info]

    Cache: Invalidate / {invalidate, param}
    
    @example

      db.insertInto('users', [null, 'ernie', 'password'], function(err, info) {
        console.log([err, info]);
      };

      db.insertInto('users', {name: 'ernie', password: 'password'}, function(err, info) {
        console.log([err, info]);
      };
  
    @param {string} table
    @param {object} fields
    @param {function} callback
    @public
   */

  this.insertInto = function(table, fields, callback) {
    var args, cdata, params, query, self = this;
    if (typeof table != 'string') {
      cdata = table;
      table = table.param;
    }
    if (util.isArray(fields)) {
      params = framework.util.strRepeat('?, ', fields.length).replace(regex.endingComma, '');
      args = ["INSERT INTO " + table + " VALUES(" + params + ")", fields];
    } else {
      query = "INSERT INTO " + table + " SET ";
      if (fields.id == undefined) fields.id = null;
      for (var key in fields) {
        query += key + "=?, ";
      }
      query = query.replace(regex.endingComma, '');
      args = [query, _.values(fields)];
    }
    args.push(function(err, info) {
      callback.call(self.app, err, info);
    });
    if (cdata != null) args.unshift(cdata);
    this.client.query.apply(this, args);
  }

  /**
    Deletes records by ID
  
    Provides: [err, info]

    Cache: Invalidate / {invalidate, param}
    
    @example

      db.deleteById([1,2,3], 'users', function(err, info) {
        console.log([err, info]);
      });

      db.deleteById(1, 'users', function(err, info) {
        console.log([err, info]);
      });
  
    @param {array|int} id
    @param {string} table
    @param {string} appendSql
    @param {function} callback
    @public
    */

  this.deleteById = function(id, table, appendSql, callback) {
    var args, cdata;
    if (!(typeof id == 'number' || util.isArray(id))) {
      cdata = id;
      id = id.param;
    }
    if (callback == null) {
      callback = appendSql;
      appendSql = '';
    }
    if (typeof id == 'number') id = [id];
    args = ["id IN (" + (id.toString()) + ")", [], table, appendSql, callback];
    if (cdata != null) {
      cdata.param = args[0];
      args[0] = cdata;
    }
    this.deleteWhere.apply(this, args);
  }

  /**
    Performs a DELETE ... WHERE ... query
    
    Provides: [err, info]

    Cache: Invalidate / {invalidate, param}
    
    @example

      db.deleteWhere('user=?, pass=?', [user, pass], 'users', function(err, info) {
        console.log([err, info]);
      });
  
    @param {string} cond
    @param {array} params
    @param {string} table
    @param {string} appendSql
    @param {function} callback
    @public
   */

  this.deleteWhere = function(cond, params, table, appendSql, callback) {
    var args, cdata, self = this;
    if (typeof cond != 'string') {
      cdata = cond;
      cond = cond.param;
    }
    if (callback == null) {
      callback = appendSql;
      appendSql = '';
    }
    if (!util.isArray(params)) params = [params];
    args = ["DELETE FROM " + table + " WHERE " + cond + " " + appendSql, params];
    args.push(function(err, info) {
      callback.call(self.app, err, info);
    });
    if (cdata != null) args.unshift(cdata);
    this.client.query.apply(this, args);
  }

  /**
    Updates records by ID
  
    Provides: [err, info]

    Cache: Invalidate / {invalidate, param}
    
    @example

      db.updateById([1,2,3], 'users', {user: 'ernie', pass: 'password'}, 'LIMIT 1', function(err, info) {
        console.log([err, info]);
      });

      db.updateById([1,2,3], 'users', {user: 'ernie', pass: 'password'}, function(err, info) {
        console.log([err, info]);
      });
  
    @param {int} id
    @param {string} table
    @param {object} values
    @param {string} appendSql
    @param {function} callback
    @public
    
   */

  this.updateById = function(id, table, values, appendSql, callback) {
    var args, cdata;
    if (!(typeof id == 'number' || util.isArray(id))) {
      cdata = id;
      id = id.param;
    }
    if (callback == null) {
      callback = appendSql;
      appendSql = '';
    }
    if (typeof id == 'number') id = [id];
    args = ["id IN (" + (id.toString()) + ")", [], table, values, appendSql, callback];
    if (cdata != null) {
      cdata.param = args[0];
      args[0] = cdata;
    }
    this.updateWhere.apply(this, args);
  }

  /**
    Performs an UPDATE ... WHERE ... query
    
    Provides: [err, info]

    Cache: Invalidate / {invalidate, param}
    
    @example

      db.updateWhere('user=?, pass=?', [user, pass], 'users', {user: 'ernie', pass: 'password'}, 'LIMIT 1',
        function(err, info) {
          console.log([err, info]);
        });

      db.updateWhere('user=?, pass=?', [user, pass], 'users', {user: 'ernie', pass: 'password'}, 
        function(err, info) {
          console.log([err, info]);
        });
    
    @param {string} cond
    @param {array} params
    @param {string} table
    @param {object} values
    @param {string} appendSql
    @param {function} callback
    @public
   */

  this.updateWhere = function(cond, params, table, values, appendSql, callback) {
    var args, cdata, query, self = this;
    if (typeof cond != 'string') {
      cdata = cond;
      cond = cond.param;
    }
    query = "UPDATE " + table + " SET ";
    if (callback == null) {
      callback = appendSql;
      appendSql = '';
    }
    if (!util.isArray(params)) params = [params];
    for (var key in values) {
      query += key + "=?, ";
    }
    query = query.replace(regex.endingComma, '');
    query += " WHERE " + cond + " " + appendSql;
    args = [query, _.values(values).concat(params)];
    args.push(function(err, info) {
      callback.call(self.app, err, info);
    });
    if (cdata != null) args.unshift(cdata);
    this.client.query.apply(this, args);
  }

  /**
    Counts rows in a table
  
    Provides: [err, count]

    Cache: Store / {cacheId, timeout, param}
    
    @example

      db.countRows('users', function(err, count) {
        console.log([err, count]);
      });

    @param {string} table
    @param {function} callback
    @public
   */

  this.countRows = function(table, callback) {
    var args, cdata, self = this;
    if (typeof table != 'string') {
      cdata = table;
      table = table.param;
    }
    args = ["SELECT COUNT('') AS total FROM " + table, []];
    args.push(function(err, results, fields) {
      args = err ? [err, null] : [err, results[0].total];
      callback.apply(self.app, args);
    });
    if (cdata != null) args.unshift(cdata);
    this.client.query.apply(this, args);
  }

  /**
    Performs a query by ID, returning an object with the found ID's.

    Provides: [err, exists]

    This function's behavior varies depending on input:

      a) If id is int: exists is boolean
      b) If id is array: exists is object
    
    Cache: Store / {cacheId, timeout, param}
    
    @example

      db.idExists([1,2,3], 'users' function(err, exists) {
        console.log([err, exists]);
      });

      db.idExists(1, 'users', function(err, exists) {
        console.log([err, exists]);
      });
  
    @param {int} id
    @param {string} table
    @param {string} columns
    @param {function} callback
    @public
   */

  this.idExists = function(id, table, columns, callback) {
    var args, cdata, self = this;
    if (!(typeof id == 'number' || util.isArray(id))) {
      cdata = id;
      id = id.param;
    }
    if (callback == null) {
      callback = columns;
      columns = '*';
    }
    if (typeof id == 'number') id = [id];
    args = [id, table, columns];
    args.push(function(err, results, fields) {
      if (err) {
        callback.call(self.app, err, null);
      } else {
        if (id.length == 1) {
          callback.call(self.app, null, results[0]);
        } else {
          var found = [],
              records = {},
              exists = {};
          for (var result, i=0; i < results.length; i++) {
            result = results[i];
            found.push(result.id);
            records[result.id] = results[i];
          }
          for (var num,i=0; i < id.length; i++) {
            num = id[i];
            exists[num] = (found.indexOf(num) >= 0) ? records[num] : null;
          }
          callback.apply(self.app, [null, exists]);
        }
      }
    });
    if (cdata != null) {
      cdata.param = args[0];
      args[0] = cdata;
    }
    this.queryById.apply(this, args);
  }

  /**
    Checks if a record exists
  
    Provides: [err, exists, found]

    Cache: Store / {cacheId, timeout, param}
    
    @example

      db.recordExists('id=?', [1], 'users', 'id, user, pass', 'LIMIT 1', function(err, exists, found) {
        console.log([err, exists, found]);
      });

      db.recordExists('id=?', [1], 'users', 'LIMIT 1', function(err, exists, found) {
        console.log([err, exists, found]);
      });
    
    @param {string} cond
    @param {array} params
    @param {string} table
    @param {string} columns
    @param {string} appendSql
    @param {function} callback
    @public
   */

  this.recordExists = function(cond, params, table, columns, appendSql, callback) {
    var args, cdata, self = this;
    if (typeof cond != 'string') {
      cdata = cond;
      cond = cond.param;
    }
    if (appendSql == null) {
      callback = columns;
      columns = '*';
      appendSql = '';
    } else if (callback == undefined) {
      callback = appendSql;
      appendSql = '';
    }
    if (!util.isArray(params)) params = [params];
    args = [cond, params, table, columns, appendSql];
    args.push(function(err, results, fields) {
      if (err) {
        callback.call(self.app, err, null, null);
      } else {
        if (results.length == 0) {
          callback.call(self.app, err, false, results);
        } else {
          callback.call(self.app, err, true, results);
        }
      }
    });
    if (cdata != null) {
      cdata.param = args[0];
      args[0] = cdata;
    }
    this.queryWhere.apply(this, args);
  }

  
  /* Private functions */
  
  
  /**
    Internal query caching function
    
    @private
   */

  function cachedQuery() {
    var cacheID, cdata, invalidate, multi, params, timeout, 
        self = this;
    
    cdata = arguments[0];
    params = (2 <= arguments.length) ? Array.prototype.slice.call(arguments, 1) : [];
    
    // If no caching data is specified, perform normal query
    // TODO: Also return if storage is not available
    if (typeof cdata != 'object' || (cdata.cacheID == undefined && cdata.invalidate == undefined)) {
      this.client.__query.apply(this.client, [cdata].concat(Array.prototype.slice.call(params)));
      return;
    }
    cacheID = cdata.cacheID, timeout = cdata.timeout, invalidate = cdata.invalidate;
    if (invalidate != null) {
      if (!util.isArray(invalidate)) invalidate = [invalidate];
      
      for (var i=0; i < invalidate.length; i++) {
        cacheID = invalidate[i];
        invalidate[i] = "mysql_cache_" + cacheID;
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
          self.client.__query.apply(self.client, params);
        }
      });
      
    } else {
      
      this.storage.get("mysql_cache_" + cacheID, function(err, cache) {
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
                cacheKey = "mysql_cache_" + cacheID;
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
            self.client.__query.apply(self.client, params);
          }
        }
      });
    }
  }

});

module.exports = MySQL;
