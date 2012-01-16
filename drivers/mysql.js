
/* MySQL */

var _ = require('underscore'),
    mysql = require('mysql'),
    util = require('util'),
    regex = { endingComma: /, ?$/};

function MySQL(app, config) {
  
  /** config: {
    host: 'localhost',
    port: 3306,
    user: 'db_user',
    password: 'db_password',
    database: 'db_name',
    debug: false,
    storage: 'redis'
  } */
  
  var self = this;
  
  config = config || {};
  config.host = config.host || 'localhost';
  config.port = config.port || 3369;
  
  this.className = this.constructor.name;
  this.app = app;
  this.config = config;
  
  framework.util.checkPort(config.port, function(err) {
    if (err) {
      app.log(util.format("MySQL [%s:%s] %s", config.host, config.port, err.code));
    } else {
      // Set client
      self.client = mysql.createClient(config);

      // Assign storage
      if (typeof config.storage == 'string') {
        self.storage = app.getResource('storages/' + config.storage);
      }

      // Set caching function
      if (self.storage != null) self.setCacheFunc(self.client, 'query');
    }
  });
  
  // Only set important properties enumerable
  framework.util.onlySetEnumerable(this, ['className']);
  
}

util.inherits(MySQL, framework.lib.driver);

/**
  Performs a manual SQL Query

  Provides [err, results, fields]

  Cache: Store / {cacheId, timeout, param}
  
  @example
  
    db.query({
      sql: 'SELECT * FROM table WHERE id=? AND user=?',
      params: [id, user],
      appendSql: ''
    }, function(err, results, fields) {
      callback.call(err, results, fields);
    })

  @param {object} o
  @param {function} callback
  @public
*/

MySQL.prototype.query = function(o, callback) {
  var args,
      sql = o.sql || '',
      params = o.params || [],
      appendSql = o.appendSql || '';
  
  if (!util.isArray(params)) params = [params];
  
  args = [(sql + " " + appendSql).trim(), params, callback];
  
  this.addCacheData(o, args);
  
  this.client.query.apply(this.client, args);
}

/**
  Performs a query that returns no results. Usually affecting tables/rows

  Provides: [err, info]

  Cache: Invalidate / {invalidate, param}
  
  @example

    db.exec({
      sql: 'SHOW TABLES',
    }, function(err, info) {
      console.exit([err, info]);
    });

  @param {object} o
  @param {function} callback
  @public
*/

MySQL.prototype.exec = function(o, callback) {
  var args, 
      self = this,
      sql = o.sql || '',
      params = o.params || [];
  
  if (!util.isArray(params)) params = [params];
  
  args = [sql, params];
  args.push(function(err, info) {
    callback.call(self.app, err, info);
  });
  
  this.addCacheData(o, args);
  
  this.client.query.apply(this.client, args);
}

/**
  Performs a SELECT ... WHERE ... query

  Provides: [err, results, fields]

  Cache: Store / {cacheId, timeout, param}

  @example

    db.queryWhere({
      condition: 'id=?',
      params: [1],
      table: 'users'
    }, function(err, results, fields) {
      console.exit([err, results, fields]);
    });

  @param {object} o
  @param {function} callback
  @public
 */

MySQL.prototype.queryWhere = function(o, callback) {
  var args, 
      self = this,
      condition = o.condition || '',
      params = o.params || [],
      table = o.table || '',
      columns = o.columns || '*',
      appendSql = o.appendSql || '';

  if (!util.isArray(params)) params = [params];
  
  args = [("SELECT " + columns + " FROM " + table + " WHERE " + condition + " " + appendSql).trim(), params];
  
  args.push(function(err, results, fields) {
    callback.call(self.app, err, results, fields);
  });
  
  this.addCacheData(o, args);
  
  // console.exit(args);
  
  this.client.query.apply(this.client, args);
}

/**
  Queries all entries from a table. Optionally fetches specific columns

  Provides: [err, results, fields]

  Cache: Store / {cacheId, timeout, param}

  @example

    db.queryAll({
      columns: 'user, pass',
      table: 'users'
    }, function(err, results, fields) {
      console.exit([err, results, fields]);
    });

  @param {object} o
  @param {function} callback
  @public
 */

MySQL.prototype.queryAll = function(o, callback) {
  var args, cdata, 
      self = this,
      columns = o.columns || '*',
      table = o.table || '',
      appendSql = o.appendSql || '';
  
  args = [("SELECT " + columns + " FROM " + table + " " + appendSql).trim()];
  
  args.push(function(err, results, columns) {
    callback.call(self.app, err, results, columns);
  });
  
  this.addCacheData(o, args);

  this.client.query.apply(this.client, args);
}

/**
  Queries fields by ID

  Provides: [err, results, fields]

  Cache: Store / {cacheId, timeout, param}
  
  @example

    db.queryById({
      id: [1,3],
      table: 'users'
    }, function(err, results, fields) {
      console.exit([err, results, fields]);
    });
  
  @param {object} o
  @param {function} callback
  @public
 */

MySQL.prototype.queryById = function(o, callback) {
  var args,
      id = o.id,
      table = o.table || '',
      columns = o.columns || '*',
      appendSql = o.appendSql || '';
  
  if (typeof id == 'number') id = [id];
  
  args = [{
    condition: "id IN (" + (id.toString()) + ")",
    table: table,
    columns: columns,
    appendSql: appendSql
  }, callback];
  
  // Transfer cache keys to object in first arg
  this.addCacheData(o, args[0]);
  
  this.queryWhere.apply(this, args);
}

/**
  Inserts values into a table

  Provides:  [err, info]

  Cache: Invalidate / {invalidate, param}
  
  @example

    db.insertInto({
      table: 'users',
      values: {user: 'hello', pass: 'passme'}
    }, function(err, info) {
      console.exit([err, info]);
    });

  @param {object} o
  @param {function} callback
  @public
 */

MySQL.prototype.insertInto = function(o, callback) {
  var args, params, query, 
      self = this,
      table = o.table || '',
      values = o.values || {};
  
  if (util.isArray(values)) {
    params = framework.util.strRepeat('?, ', values.length).replace(regex.endingComma, '');
    args = ["INSERT INTO " + table + " VALUES(" + params + ")", values];
  } else {
    query = "INSERT INTO " + table + " SET ";
    if (values.id == null) values.id = null;
    for (var key in values) {
      query += key + "=?, ";
    }
    query = query.replace(regex.endingComma, '');
    args = [query, _.values(values)];
  }
  
  args.push(function(err, info) {
    callback.call(self.app, err, info);
  });
  
  this.addCacheData(o, args);
  
  this.client.query.apply(this.client, args);
}

/**
  Deletes records by ID

  Provides: [err, info]

  Cache: Invalidate / {invalidate, param}
  
  @example

    db.deleteById({
      id: 4,
      table: 'users'
    }, function(err, info) {
      console.exit([err, info]);
    });

  @param {object} o
  @param {function} callback
  @public
  */

MySQL.prototype.deleteById = function(o, callback) {
  var args,
      id = o.id,
      table = o.table || '',
      appendSql = o.appendSql || '';
  
  if (typeof id == 'number') id = [id];
  
  args = [{
    condition: "id IN (" + (id.toString()) + ")",
    table: table,
    appendSql: appendSql
  }, callback]
  
  // Transfer cache keys to object in first arg
  this.addCacheData(o, args[0]);
  
  this.deleteWhere.apply(this, args);
}

/**
  Performs a DELETE ... WHERE ... query
  
  Provides: [err, info]

  Cache: Invalidate / {invalidate, param}
  
  @example

    db.deleteWhere({
      condition: 'id=?',
      params: [5],
      table: 'users'
    }, function(err, info) {
      console.exit([err, info]);
    });

  @param {object} o
  @param {function} callback
  @public
 */

MySQL.prototype.deleteWhere = function(o, callback) {
  var args, 
      self = this,
      condition = o.condition || '',
      params = o.params || [],
      table = o.table || '',
      appendSql = o.appendSql || '';
      
  if (!util.isArray(params)) params = [params];
  
  args = ["DELETE FROM " + table + " WHERE " + condition + " " + appendSql, params];
  
  args.push(function(err, info) {
    callback.call(self.app, err, info);
  });
  
  this.addCacheData(o, args);
  
  this.client.query.apply(this.client, args);
}

/**
  Updates records by ID

  Provides: [err, info]

  Cache: Invalidate / {invalidate, param}
  
  @example

    db.updateById({
      id: 1,
      table: 'users',
      values: {user: 'ernie'}
    }, function(err, info) {
      console.exit([err, info]);
    });

  @param {object} o
  @param {function} callback
  @public
 */

MySQL.prototype.updateById = function(o, callback) {
  var args,
      id = o.id,
      table = o.table || '',
      values = o.values || {},
      appendSql = o.appendSql || '';
  
  if (typeof id == 'number') id = [id];
  
  args = [{
    condition: "id IN (" + (id.toString()) + ")",
    table: table,
    values: values,
    appendSql: appendSql
  }, callback]
  
  // Transfer cache keys to first arg
  this.addCacheData(o, args[0]);
  
  this.updateWhere.apply(this, args);
}

/**
  Performs an UPDATE ... WHERE ... query
  
  Provides: [err, info]

  Cache: Invalidate / {invalidate, param}
  
  @example

    db.updateWhere({
      condition: 'id=?',
      params: [1],
      table: 'users',
      values: {user: 'ernie'}
    }, function(err, info) {
      console.exit([err, info]);
    });
  
  @param {object} o
  @param {function} callback
  @public
 */

MySQL.prototype.updateWhere = function(o, callback) {
  var args,query, 
      self = this,
      condition = o.condition || '',
      params = o.params || [],
      table = o.table || '',
      values = o.values || {},
      appendSql = o.appendSql || '';
  
  query = "UPDATE " + table + " SET ";
  
  if (!util.isArray(params)) params = [params];
  
  for (var key in values) {
    query += key + "=?, ";
  }
  
  query = query.replace(regex.endingComma, '');
  query += " WHERE " + condition + " " + appendSql;
  
  args = [query, _.values(values).concat(params)];
  
  args.push(function(err, info) {
    callback.call(self.app, err, info);
  });
  
  this.addCacheData(o, args);
  
  this.client.query.apply(this.client, args);
}

/**
  Counts rows in a table

  Provides: [err, count]

  Cache: Store / {cacheId, timeout, param}
  
  @example

    db.countRows({table: 'users'}, callback);

  @param {object} o
  @param {function} callback
  @public
 */

MySQL.prototype.countRows = function(o, callback) {
  var args, 
      self = this,
      table = o.table || '';
      
  args = ["SELECT COUNT('') AS total FROM " + table, []];
  
  args.push(function(err, results, fields) {
    args = err ? [err, null] : [err, results[0].total];
    callback.apply(self.app, args);
  });
  
  this.addCacheData(o, args);
  
  this.client.query.apply(this.client, args);
}

/**
  Performs a query by ID, returning an object with the found ID's.

  Provides: [err, results]

  Cache: Store / {cacheId, timeout, param}
  
  @example

    db.idExists({
      id: [1,2],
      table: 'users'
    }, callback);

  @param {object} o
  @param {function} callback
  @public
 */

MySQL.prototype.idExists = function(o, callback) {
  var args, 
      self = this,
      id = o.id,
      table = o.table || '',
      columns = o.columns || '*',
      appendSql = o.appendSql || '';
  
  if (typeof id == 'number') id = [id];
  
  args = [o]; // Passing unmodified `o`
  
  args.push(function(err, results, fields) {
    if (err) {
      callback.call(self.app, err, null);
    } else {
      if (id.length == 1) {
        callback.call(self.app, null, results[0]);
      } else {
        var num,
            found = [],
            records = {},
            exists = {};
        for (var result, i=0; i < results.length; i++) {
          result = results[i];
          found.push(result.id);
          records[result.id] = results[i];
        }
        for (i=0; i < id.length; i++) {
          num = id[i];
          exists[num] = (found.indexOf(num) >= 0) ? records[num] : null;
        }
        callback.apply(self.app, [null, exists]);
      }
    }
  });
  
  // No need to transfer cache keys, since `o` is passed unmodified
  
  this.queryById.apply(this, args);
}

/**
  Checks if a record exists

  Provides: [err, exists, found]

  Cache: Store / {cacheId, timeout, param}
  
  @example

    db.recordExists({
      condition: 'id=?',
      params: [1],
      table: 'users'
    }, callback);
  
  @param {object} o
  @param {function} callback
  @public
 */

MySQL.prototype.recordExists = function(o, callback) {
  var args, 
      self = this,
      condition = o.condition || '',
      params = o.params || [],
      table = o.table || '',
      columns = o.columns || '*',
      appendSql = o.appendSql || '';
  
  if (!util.isArray(params)) params = [params];
  
  args = [o]; // Passing unmodified `o`
  
  args.push(function(err, results, fields) {
    if (err) {
      callback.call(self.app, err, null, null);
    } else {
      if (results.length === 0) {
        callback.call(self.app, err, false, results);
      } else {
        callback.call(self.app, err, true, results);
      }
    }
  });
  
  // No need to transfer cache keys, since `o` is passed unmodified
    
  this.queryWhere.apply(this, args);
}


MySQL.prototype.__modelMethods = {
  
  /** Model API insert */
  
  insert: function(o, cdata, callback) {
    var self = this;
    
    // Process callback & cache Data
    if (typeof callback == 'undefined') { callback = cdata; cdata = {}; }
    
    // Validate, throw error on failure
    this.__validateProperties(o);

    // Save data into the database
    this.driver.insertInto(_.extend({
      table: this.context,
      values: o
    }, cdata), function(err, results) {
      if (err) callback.call(self, err, null);
      else {
        callback.call(self, null, results.insertId);
      }
    });
  },
  
  /** Model API get */
  
  get: function(o, cdata, callback) {
    var self = this;
    
    // Process callback & cache data
    if (typeof callback == 'undefined') { callback = cdata; cdata = {}; }
    
    if (typeof o == 'number') { 
      // If `o` is number: Convert to object
      o = {id: o};
    } else if (util.isArray(o)) {
      
      // If `o` is an array of params, process args recursively using multi
      var arr = o, 
          multi = this.multi();
      for (var i=0; i < arr.length; i++) {
        multi.get(arr[i], cdata);
      }
      multi.exec(function(err, results) {
        callback.call(self, err, results);
      });
      return;
      
    } else if (typeof o == 'object') {
      
      // IF `o` is object: Validate without checking required fields
      this.__propertyCheck(o);
      
    } else {
      
      callback.call(self, new Error(util.format("%s: Wrong value for `o` argument", this.className)), null);
      return;
      
    }
      
    // Prepare custom query
    var condition, key, value,
        keys = [], values = [];
    
    for (key in o) {
      keys.push(key);
      values.push(o[key]);
    }
    
    // Prevent empty args
    if (keys.length === 0) {
      callback.call(self, new Error(util.format("%s: Empty arguments", this.className)));
      return;
    } else {
      condition = keys.join('=? AND ') + '=?';
    }
    
    // Get model data & return generated model (if found)
    this.driver.queryWhere(_.extend({
      condition: condition,
      params: values,
      table: this.context,
    }, cdata), function(err, results) {
      if (err) callback.call(self, err, null);
      else {
        if (results.length === 0) callback.call(self, null, null);
        else {
          var model = self.__createModel(results[0]);
          callback.call(self, null, model);
        }
      }
    });
  },
  
  /** Model API getAll */
  
  getAll: function(cdata, callback) {
    var self = this, models = [];

    // Process callback & cache data
    if (typeof callback == 'undefined') { callback = cdata; cdata = {}; }

    this.driver.queryAll(_.extend({
      table: this.context
    }, cdata), function(err, results) {
      if (err) callback.call(self, err, null);
      else {
        for (var i=0; i < results.length; i++) {
          models.push(self.__createModel(results[i]));
        }
        callback.call(self, null, models);
      }
    });

  },
  
  /** Model API save */
  
  save: function(o, cdata, callback) {
    var id, self = this;
    
    // Process callback & cache data
    if (typeof callback == 'undefined') { callback = cdata; cdata = {}; }
    
    // Update data. Validation has already been performed by ModelObject
    id = o.id; 
    delete o.id;
    this.driver.updateById(_.extend({
      id: id,
      table: this.context,
      values: o
    }, cdata), function(err, results) {
      callback.call(self, err);
    });
  },
  
  /** Model API delete */
  
  delete: function(id, cdata, callback) {
    var self = this;
    
    // Process callback & cache data
    if (typeof callback == 'undefined') { callback = cdata; cdata = {}; }

    if (typeof id == 'number') {
      
      // Remove entry from database
      this.driver.deleteById(_.extend({
        id: id,
        table: this.context,
        appendSql: 'LIMIT 1'
      }, cdata), function(err, results) {
        callback.call(self, err);
      });
      
    } else if (util.isArray(id)) {
      
      // Remove multiple entries
      var i, arr = id,
          multi = this.multi();
      
      for (i=0; i < arr.length; i++) {
        id = arr[i];
        multi.delete(id);
      }
      
      multi.exec(function(err, results) {
        callback.call(self, err, results);
      })
      
      return;
      
    } else {
      
      callback.call(self, new Error(util.format("%s: Wrong value for `id` parameter", this.className)));
      
    }

  }
  
}

module.exports = MySQL;
