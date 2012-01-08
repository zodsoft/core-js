
/* Storage */

function Storage() {
  
}

/* Storage::prototype */

framework.extend(Storage.prototype, new function() {
  
  /* Storage API */
  
  var _ = require('underscore'),
      slice = Array.prototype.slice;
  
  // Backend configuration
  this.config = {};
  
  // Backend client
  this.client = null;
  
  /**
    Retrieves one or more records from the storage backend
    
    a) If a key is a string: provides [err, value]
    b) If a key is an array: provides [err, results] 
    
    @param {string|array} key
    @param {function} callback
    @public
   */
  
  this.get = function(key, callback) {
    
    /* TODO: add automatic typecasting */
    
  }

  /**
    Retrieves a hash from the storage backend
    
    @param {string|array} key
    @param {function} callback
    @public
   */
  
  this.getHash = function(key, callback) {
    
    /* TODO: add automatic typecasting */
    
  }
  
  /**
    Inserts one or more records into the storage backend
    
    Provides: [err]
    
    Key can be either a string or an object containing key/value pairs
    
    @param {string|object} key
    @param {string} value (optional)
    @param {function} callback
    @public
   */
  
  this.set = function(key, value, callback) {

  }
  
  /**
    Inserts a hash (object) into the storage backend
    
    Provides: [err]
    
    @param {string} key
    @param {object} hash
    @param {function} callback
    @public
   */
   
  this.setHash = function(key, object, callback) {
    
  }
  
  /**
    Deletes one or more records from the storage backend
    
    Provides: [err]
    
    @param {string|array} key
    @param {function} callback
    @public
   */
  
  this.delete = function(key, callback) {

  }
  
  /**
    Makes a specific key expire in a certain amount of time
    
    @param {string} key
    @param {int} timeout
    @public
   */
   
   this.expire = function(key, timeout) {
     
   }
   
   /**
     Allows execution of multiple storage operations
    */
    
   this.multi = function(config) {
     return new Multi(this, config || {});
   }
   
  /**
    Multi Constructor
   */  
  
  function Multi(context, config) {
    
    /** {
      interrupt: false
    } */
    
    var self = this,
        counter = 0,
        errored = false,
        errors = [],
        stack = [],
        results = [],
        methods = _.methods(context).slice(1); // remove first method (constructor);
    
    // Executes the queue, provides [err, results]
    this.exec = function(callback) {
      self.callback = callback;
      if (stack.lenght == 0) callback.call(context, null, []);
      else {
        var first = stack[0];
        context[first.caller].apply(context, first.args);
      }
    }
    
    // Handles the internal async execution loop
    function resultsCallback() {
      var args = slice.call(arguments, 0),
          err = args.shift();
          
      if (err) {
        if (config.interrupt === true) {
          errors.push(err);
          results.push(null);
          self.callback.call(context, errors, results);
          return;
        } else {
           errored = true, args = null;
        }
      } else if (args.length == 0) args = 'OK';
      else if (args.length == 1) args = args[0];
      
      errors.push(err);
      results.push(args);
      
      if (++counter == stack.length) {
        err = (errored ? errors : null);
        self.callback.call(context, err, results);
      } else {
        var next = stack[counter];
        context[next.caller].apply(context, next.args);
      }
    }
    
    // Queues the callback
    function queue(args) {
      args.push(resultsCallback);
      stack.push({caller: this.caller, args: args});
    }
    
    // Generates the queuing function
    function dummy(caller) {
      return function() { queue.call({caller: caller}, slice.call(arguments, 0)); }
    }
    
    // Create the queuing functions for the storage methods of the multi
    for (var method, i=0; i < methods.length; i++) {
      method = methods[i];
      this[method] = dummy(method);
    }
    
  }
  
});

module.exports = Storage;
