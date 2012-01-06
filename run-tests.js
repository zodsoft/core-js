
var CFramework = require('./lib/CFramework')

.configure('environment', 'TEST')

/* Virtual Hosts */

.configure('vhosts', {
  'localhost': {
    path: 'skeleton',
    redis: {
      sessionStore: 0,
      cacheStore: 1
    },
    mysql: {}
  }
})

/* Database Config */

.configure('common_config', {
  'redis': {
    host: 'localhost',
    port: 6379
  },
  'mysql': {
    host: 'localhost',
    port: 3306,
    user: 'db_user',
    password: 'db_password',
    database: 'db_name',
    debug: false
  }
})

/* Server Config */

.configure('server', {
  listenPort: 8080,
  multiProcess: false,
  stayUp: false
})

/* Application Initialization */

.on('app_init', function(app) {
  app.debugMode = false;
  app.viewCaching = false;
  return app.responseCaching = false;
})

/* Framework Initialization */

.on('init', function() {
  var TestSuite = this.require('./test/classes/TestSuite');
  new TestSuite();
});

new CFramework();
