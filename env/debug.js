
/* Debugging Environment */

var running = (require.main === module);

if (running) {
  // Start node debugger
  console.log('');
  require('child_process').spawn('kill', ['-s', 'SIGUSR1', process.pid]);
}

var CFramework = require('./common.js')

.configure('environment', 'DEBUG')

.configure('inspector_port', 3000)

.configure('server', {
  listenPort: 8080,
  multiProcess: false,
  stayUp: false
})

/* Application Initialization */

.on('app_init', function(app) {
  app.debugMode = false;
  app.viewCaching = false;
  app.responseCaching = false;
})

/* Framework Initialization */

.on('init', function() {});

if (running) {
  new CFramework();
} else {
  module.exports = CFramework;
}