
/* Driver */

function Driver(app) {
  
  this.constructor.prototype.__construct.call(this, app);
  
}

/* Driver::prototype */

var _ = require('underscore');

_.extend(Driver.prototype, new function() {
  
  // Constructor
  this.__construct = function(app) {
    if (typeof app == 'undefined') return;
    this.app = app;
    this.className = this.constructor.name;
    framework.util.onlySetEnumerable(this, ['className']);
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
  
});

module.exports = Driver;
