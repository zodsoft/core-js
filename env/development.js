
/* Development Environment */

var CoreJS = require('./common.js')

.configure('environment', 'DEVELOPMENT')

.configure('server', {
  listenPort: 8080,
  multiProcess: false,
  stayUp: false
})

.on('app_init', function(app) {
  app.debugMode = false;
  app.viewCaching = false;
  app.responseCaching = false;
})

.on('init', function() {});

new CoreJS();