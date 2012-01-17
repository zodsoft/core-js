
/**
  Multi

  Allows methods from context to be queued and executed in asynchronously
  in order, returning the results & errors of all operations.
  
  Provides: [err, results]
  
  @param {object} context
  @param {object} config
  @private
 */

var _ = require('underscore'),
    slice = Array.prototype.slice;

function Multi(context, config) {
  
  /** {
    interrupt: false
  } */
  
  config = config || {};
  
  var self = this,
      counter = 0,
      restricted = ['exec', 'multi', 'constructor', 'extends'];
      errored = false,
      errors = [],
      stack = [],
      results = [],
      properties = _.uniq(Object.getOwnPropertyNames(context).concat(_.methods(context)));
      
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
    return function() {
      queue.call({caller: caller}, slice.call(arguments, 0));
      return self;
    }
  }
  
  // Create the queuing functions for the storage methods of the multi
  for (var key,i=0; i < properties.length; i++) {
    key = properties[i];
    if (context[key] instanceof Function) {
      if (restricted.indexOf(key) >= 0) continue;
      this[key] = dummy(key);
    }
  }
  
  // Get Prototype methods
  
  // Prevent conflicts with context's `exec` method if it exists.
  // Move original `exec` method from context into `__exec`.
  
  if (context.exec instanceof Function) {
    this.__exec = dummy('exec');
  }
  
}

module.exports = Multi;
