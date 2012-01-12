
/* MySQL */

function MySQL(app, config) {
  
  /** {
    host: 'localhost',
    port: 3306,
    user: 'db_user',
    password: 'db_password',
    database: 'db_name',
    debug: false,
    storage: 'redis'
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

  // Constructor
  this.__construct = function(app, config) {
    config = config || {};
    this.className = this.constructor.name;
    this.app = app;
    this.config = config;
    
    // 1. Set client
    this.client = mysql.createClient(config);
    
    // 2. Assign storage
    if (typeof config.storage == 'string') {
      this.storage = app.getResource('storages/' + config.storage);
    }
    
    // 3. Set calling context (used by caching mechanism)
    this.context = (this.storage) ? this : this.client;
    
    // 4. Set caching function
    if (this.storage != null) this.setCacheFunc(this.client, 'query');
    
    // 5. Only set important properties enumerable
    framework.util.onlySetEnumerable(this, ['className']);
  }
  
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

  this.query = function(o, callback) {
    var args, cdata,
        sql = o.sql || '',
        params = o.params || [],
        appendSql = o.appendSql || '';
    
    if (typeof sql != 'string') cdata = sql, sql = sql.param;
    
    if (!util.isArray(params)) params = [params];
    
    args = [(sql + " " + appendSql).trim(), params, callback];
    if (cdata != null) args.unshift(cdata);
    this.client.query.apply(this.context, args);
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

  this.exec = function(o, callback) {
    var args, cdata, 
        self = this,
        sql = o.sql || '',
        params = o.params || [];
    
    if (typeof sql != 'string') cdata = sql, sql = query.param;
    if (!util.isArray(params)) params = [params];
    
    args = [sql, params];
    args.push(function(err, info) {
      callback.call(self.app, err, info);
    });
    
    if (cdata != null) args.unshift(cdata);
    this.client.query.apply(this.context, args);
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

  this.queryWhere = function(o, callback) {
    var args, cdata, 
        self = this,
        condition = o.condition || '',
        params = o.params || [],
        table = o.table || '',
        columns = o.columns || '*',
        appendSql = o.appendSql || '',
        cacheID = o.cacheId,
        cacheTimeout = o.cacheTimeout;
    
    if (!util.isArray(params)) params = [params];
    
    args = [("SELECT " + columns + " FROM " + table + " WHERE " + condition + " " + appendSql).trim(), params];
    args.push(function(err, results, fields) {
      callback.call(self.app, err, results, fields);
    });
    if (cdata != null) args.unshift(cdata);
    
    this.client.query.apply(this.context, args);
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

  this.queryAll = function(o, callback) {
    var args, cdata, 
        self = this,
        columns = o.columns || '*',
        table = o.table || '',
        appendSql = o.appendSql || '';
    
    if (typeof columns != 'string') cdata = columns, columns = columns.param;
    
    args = [("SELECT " + columns + " FROM " + table + " " + appendSql).trim()];
    args.push(function(err, results, columns) {
      callback.call(self.app, err, results, columns);
    });
    if (cdata != null) args.unshift(cdata);
    this.client.query.apply(this.context, args);
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

  this.queryById = function(o, callback) {
    var args, cdata,
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
    
    if (cdata != null) cdata.param = args[0], args[0] = cdata;
      
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

  this.insertInto = function(o, callback) {
    var args, cdata, params, query, 
        self = this,
        table = o.table || '',
        values = o.values || {};
    
    if (typeof table != 'string') cdata = table, table = table.param;
    
    if (util.isArray(values)) {
      params = framework.util.strRepeat('?, ', values.length).replace(regex.endingComma, '');
      args = ["INSERT INTO " + table + " VALUES(" + params + ")", values];
    } else {
      query = "INSERT INTO " + table + " SET ";
      if (values.id == undefined) values.id = null;
      for (var key in values) {
        query += key + "=?, ";
      }
      query = query.replace(regex.endingComma, '');
      args = [query, _.values(values)];
    }
    args.push(function(err, info) {
      callback.call(self.app, err, info);
    });
    if (cdata != null) args.unshift(cdata);
    this.client.query.apply(this.context, args);
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

  this.deleteById = function(o, callback) {
    var args, cdata,
        id = o.id,
        table = o.table || '',
        appendSql = o.appendSql || '';
    
    if (typeof id == 'number') id = [id];
    
    args = [{
      condition: "id IN (" + (id.toString()) + ")",
      table: table,
      appendSql: appendSql
    }, callback]
    
    if (cdata != null) cdata.param = args[0], args[0] = cdata;
    
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

  this.deleteWhere = function(o, callback) {
    var args, cdata, 
        self = this,
        condition = o.condition || '',
        params = o.params || [],
        table = o.table || '',
        appendSql = o.appendSql || '';
        
    if (typeof condition != 'string') cdata = condition, condition = condition.param;
    
    if (!util.isArray(params)) params = [params];
    
    args = ["DELETE FROM " + table + " WHERE " + condition + " " + appendSql, params];
    
    args.push(function(err, info) {
      callback.call(self.app, err, info);
    });
    
    if (cdata != null) args.unshift(cdata);
    this.client.query.apply(this.context, args);
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

  this.updateById = function(o, callback) {
    var args, cdata,
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
    
    if (cdata != null) cdata.param = args[0], args[0] = cdata;
    
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

  this.updateWhere = function(o, callback) {
    var args, cdata, query, 
        self = this,
        condition = o.condition || '',
        params = o.params || [],
        table = o.table || '',
        values = o.values || {},
        appendSql = o.appendSql || '';
    
    if (typeof condition != 'string') cdata = condition, condition = condition.param;
    
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
    
    if (cdata != null) args.unshift(cdata);
    
    this.client.query.apply(this.context, args);
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

  this.countRows = function(o, callback) {
    var args, cdata, 
        self = this,
        table = o.table || '';
        
    if (typeof table != 'string') cdata = table, table = table.param;
    
    args = ["SELECT COUNT('') AS total FROM " + table, []];
    args.push(function(err, results, fields) {
      args = err ? [err, null] : [err, results[0].total];
      callback.apply(self.app, args);
    });
    
    if (cdata != null) args.unshift(cdata);
    
    this.client.query.apply(this.context, args);
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

  this.idExists = function(o, callback) {
    var args, cdata, 
        self = this,
        id = o.id,
        table = o.table || '',
        columns = o.columns || '*',
        appendSql = o.appendSql || '';
    
    if (! (typeof id == 'number' || util.isArray(id)) ) cdata = id, id = id.param;
    
    if (typeof id == 'number') id = [id];
    
    args = [o];
    
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
    
    if (cdata != null) cdata.param = args[0], args[0] = cdata;
    
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

  this.recordExists = function(o, callback) {
    var args, cdata, 
        self = this,
        condition = o.condition || '',
        params = o.params || [],
        table = o.table || '',
        columns = o.columns || '*',
        appendSql = o.appendSql || '';
    
    if (typeof condition != 'string') cdata = condition, condition = condition.param;
    
    if (!util.isArray(params)) params = [params];
    
    args = [o];
    
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
    
    if (cdata != null) cdata.param = args[0], args[0] = cdata;
      
    this.queryWhere.apply(this, args);
  }

});

module.exports = MySQL;
