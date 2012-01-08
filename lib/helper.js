
/* Helper */

function Helper(app) {
  
  this.constructor.prototype.__construct.call(this, app);
  
}

/* Helper::prototype */

framework.extend(Helper.prototype, new function() {
  
  // Constructor
  this.__construct = function(app) {
    this.app = app;
    this.className = this.constructor.name;
    framework.util.onlySetEnumerable(this, ['className']);
  }
  
  // Common helper functionality
  
});

module.exports = Helper;
