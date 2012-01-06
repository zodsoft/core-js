
/* Driver */

function Driver(app) {
  
  this.constructor.prototype.__construct.call(this, app);
  
}

/* Driver::prototype */

var _ = require('underscore');

_.extend(Driver.prototype, new function() {
  
  // Constructor
  this.__construct = function(app) {
    this.app = app;
    this.className = this.constructor.name;
    framework.util.onlySetEnumerable(this, ['className']);
  }
  
  // API to be designed soon
  
  this.hello = 99;
  
});

module.exports = Driver;
