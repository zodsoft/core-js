
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
    return function() { 
      queue.call({caller: caller}, slice.call(arguments, 0));
      return self;
    }
  }
  
  // Create the queuing functions for the storage methods of the multi
  for (var method, i=0; i < methods.length; i++) {
    method = methods[i];
    if (method == 'multi') continue;
    this[method] = dummy(method);
  }
  
  // Relocate this.exec if `exec` is found on context.
  // If this is the case, multi.exec will be available via multi.__exec
  
  if (typeof context.exec == 'function') {
    this.__exec = this.exec;
    this.exec = dummy('exec');
  }
  
}

module.exports = Multi;
