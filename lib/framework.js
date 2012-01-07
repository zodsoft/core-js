
/**
  Framework
  
  Configures the framework, and is in charge of assembling all the applications together. 
  Provides the master server that handles and routes all of the virtual host requests.

  Available globally as framework.
  
  @extends EventEmitter
 */

initialSetup();

var _ = require('underscore'),
    events = require('events'),
    net = require('net'),
    child_process = require('child_process'),
    cluster = require('cluster'),
    os = require('os'),
    http = require('http'),
    util = require('util'),
    pathModule = require('path');

/* Framework::constructor */

function Framework(noserver) {
  
  this.constructor.prototype.__construct.call(this, noserver);
  
}

/* Framework::static */

_.extend(Framework, new function() {
  
  // Framework version
  this.version = '0.0.0'
  
  // Inherit from events.EventEmitter
  _.extend( this, new events.EventEmitter() );
  
  // Stores the configuration settings for the framework
  this.config = {};
  
  /**
    Configures the framework.
    
    @param {string} context 
    @param {string|object} value
    @returns {self} for chaining
    @static
   */
  
  this.configure = function(context, value) {
    if (this.config[context] == null) this.config[context] = value;
    else {
      var extend = _.extend;
      extend(this.config[context], value);
      console.log(this.config[context]);
      process.exit();
    }
    return this;
  }
  
});

/* Framework::prototype */

_.extend(Framework.prototype, new function() {
  
  // Cluster configuration
  var clusterConfig = {
    listenPort: null,
    multiProcess: 0,
    masterProcess: 'node [master]',
    singleProcess: 'node [single process]',
    workerProcess: 'node worker'
  };
  
  // Expose _.extend
  this.extend = _.extend;
  
  // Internals
  this.drivers = {};
  this.engines = {};
  this.storage = {};
  this.helpers = {};
  this.lib = {};
  this.templateProto = {};

  // Regular expressions
  this.regex = require('./regex');
  
  // Constructor
  this.__construct = function(noserver) {
    
    var path = require('path'),
        self = this;
    
    // Initialize `framework` global
    global.framework = this;
    
    // Inherit Framework's properties & EventEmitter
    // Events are shared both in Function and Instance
    for (var key in this.constructor) {
      this[key] = this.constructor[key];
    }
    
    // Instance properties
    this.apps = {};
    this.vhosts = {};
    this.path = path.resolve(__dirname, '../');
    this.masterPath = process.cwd();
    this.className = Framework.name;
    this.environment = this.config['environment'] || 'GENERIC';

    // Server options, provided by environment
    this.serverOptions = null;

    // Preload Utility
    var utility = require('./utility'),
        skipFromLib = ['request.js', 'response.js', 'framework.js'];
        
    this.util = new utility(this);
        
    // Lib
    this.util.getFiles(this.path + '/lib', function(file) {
      var key = file.replace(self.regex.jsFile, '');
      if (skipFromLib.indexOf(file) >= 0) return;
      self.lib[key] = require(self.path + '/lib/' + file);
    });

    // Model proto
    this.modelProto = new this.lib.model();

    // Helper proto
    this.helperProto = new this.lib.helper();
    
    // Driver proto
    this.driverProto = new this.lib.driver();
    
    // Storage proto
    this.storageProto = new this.lib.storage();
    
    // Helpers
    this.util.getFiles(this.path + '/helpers', function(file) {
      var key = file.replace(self.regex.jsFile, '');
      self.helpers[key] = require(self.path + '/helpers/' + file);
    });
    
    // Storage
    this.util.getFiles(this.path + '/storage', function(file) {
      var key = file.replace(self.regex.jsFile, '');
      self.storage[key] = require(self.path + '/storage/' + file);
    });
    
    // Database drivers
    this.util.getFiles(this.path + '/drivers', function(file) {
      var key = file.replace(self.regex.jsFile, '');
      self.drivers[key] = require(self.path + '/drivers/' + file);
    });

    // Template engine prototype
    this.engineProto = new this.lib.engine();
    
    // Template Engines
    this.util.getFiles(this.path + '/engines', function(file) {
      var key = file.replace(self.regex.jsFile, '');
      self.engines[key] = require(self.path + '/engines/' + file);
    });
    
    // Enhance request/response
    require('./response');
    require('./request');    
    
    // Add vhosts
    this.addVhosts(this.config['vhosts']);

    // Initialization event, used by environments
    this.emit('init');

    // Allow using framework standalone
    if (noserver) return;

    // Start the debugger if on DEBUG environment
    if (this.config.environment == 'DEBUG') this.checkInspectorStatus();
    
    // Start main server
    this.startServer();
    
  }

  /**
    Requires a module relative to the framework's path
    
    @param {string} module
    @returns {object}
    @public
   */

  this.require = function(module) {
    return require('../' + module);
  }
  
  /**
    Starts the master server, which handles all the virtual host requests
    
    @public
  */
  
  this.startServer = function() {
    var options = this.config['server'];
    
    var apps = framework.apps,
      vhosts = framework.vhosts,
      defaultHost = vhosts[_.keys(framework.vhosts)[0]],
      allCPUS = os.cpus();
    
    // Extend local options with options provided by environment
    options = this.serverOptions = _.extend(clusterConfig, options);
      
    if (typeof options.multiProcess == 'number') {
      allCPUS = options.multiProcess || 1;
      options.multiProcess = true;
    } else allCPUS = os.cpus().length;
    
    
    // Handles requests for the virtual hosts
    function requestHandler(req, res) {
      var defaultApp, host, hostAddr;
      if (req.headers.host == null) req.headers.host = '';
      host = vhosts[hostAddr = req.headers.host.split(':')[0]];
      if (host != null) {
        if (req.url === '/favicon.ico' && req.method === 'GET') {
          apps[host.domain].emit('favicon_request', req, res);
          if (req.__stopRoute === true) return;
          res.end('');
        } else host.emit('request', req, res);
      } else {
        defaultApp = framework.defaultApp;
        req.__stopRoute = true;
        defaultApp.routeRequest(req, res);
        res.redirect(defaultApp.url());
      }
    }
    
    // Convenience function, to avoid repetition
    function commonStartupOperations() {
      if (this.config.environment === 'TEST') this.emit('unit_tests');
      else {
        if (options.stayUp) {
          process.on('uncaughtException', function(e) {
            var msg = '[' + (framework.defaultApp.date()) + '] CRITICAL SERVER ERROR - ' + e.toString()
            console.trace(msg);
          });
        }
        this.emit('server_start', options);
        startupMessage.call(this, options);
        this.emit('startup_message');
        
        for (domain in this.aps) {
          this.apps[domain].emit('init');
        }
      }
    }
    
    var interProcess = this;
    
    
    if (options.multiProcess && cluster.isMaster) {
      
      // Master
      
      process.title = options.masterProcess;
      for (var worker, i=0; i < allCPUS; i++) {
        worker = cluster.fork();
        worker.on('message', function(data) {
          if (data.cmd != null) interProcess.emit('worker_message', data);
          if (data.response != null) worker.send({response: data.response});
        });
      }
      cluster.on('death', function(worker) {
        var msg = framework.defaultApp.date() + ' - Worker process ' + worker.pid + ' died. Restarting...'
        console.log('');
        cluster.fork();
      });
      commonStartupOperations.call(this);
      console.log('\n' + (framework.defaultApp.date()) + ' - Master running...');
      
    } else {
      
      // Worker
      
      var server = http.createServer(requestHandler);
      server.listen(options.listenPort);
      if (options.multiProcess) {
        process.title = options.workerProcess;
        console.log(framework.defaultApp.date() + " - Worker running...");
      } else {
        process.title = options.singleProcess;
        commonStartupOperations.call(this);
        autoCurlRequest();
      }
    }
  }
  
  /**
    Attaches an event handler to all applications
    
    @param {string} event
    @param {function} callback
    @public
   */

  this.onAppEvent = function(event, callback) {
    for (var host in this.apps) {
      this.apps[host].on(event, callback);
    }
  }
  
  /**
    Initializes applications, and configures virtual hosts
    
    @param {object} servers
    @private
   */
  
  this.addVhosts = function(servers) {
    var Application, app, appInit, data, host, initFunction, path, controllerProto;
    for (host in servers) {
      path = pathModule.resolve(this.masterPath, servers[host]);
      
      // Enable inheritance within Application
      Application = require(path + '/app');
      
      // Current domain, used when initializing app classes
      this.currentDomain = host;
      
      // Initialize app routes
      this.lib.controller.prototype.queuedRoutes[host] = [];
      
      // Provide new app prototype
      Application.prototype = new this.lib.application(host, path);
      
      // Construct new app
      app = new Application(host, path);

      // Create app server
      this.vhosts[host] = app.createServer();
      
      if (this.vhosts['default'] == null) {
        this.vhosts['default'] = this.vhosts[host];
      }

      // Run init function, if available
      this.util.runInitFunction(app);

      // Set app as initialized
      app.initialized = true;

      // Separates init code from app code
      app.require('init').call(null, app);
      
      // Assign framework.defaultApp. This is the first app defined in config
      if (this.defaultApp == null) this.defaultApp = app;
    }
    delete this.currentDomain;
  }
  
  /**
    Checks the status of the node inspector
    
    @private
   */
  
  this.checkInspectorStatus = function() {
    
    var port = this.config.inspector_port || 3000;
        conn = net.createConnection(port, function() {
          console.log('Node Inspector running on http://0.0.0.0:' + port);
        });
    
    conn.on('error', function() {
      console.log('Node Inspector is not running.\n\nStart it with `./tools/run-inspector.js`\n');
      process.exit();
    });
    
  }
  
  /* Private Functions */
  
  /**
    Prints the framework's startup message
    
    @param {object} options
    @private
   */
  
  function startupMessage(options) {
    if (process.argv.length >= 3) return; // Disable startup message
    var workerStr = options.multiProcess ? "running " + os.cpus().length + " workers" : '(Single process)',
        portStr = options.listenPort !== 80 ? ":" + options.listenPort : '';
      
    console.log("\nStarted " + this.environment + " Server " + workerStr + "\n\nVirtual Hosts:\n--------------");
    
    for (host in framework.vhosts) {
      if (host !== 'default') console.log("http://" + host + portStr);
    }
    
    console.log('');
  }
  
  /**
    Handles automatic curl requests on environments, by passing its command line options for a new request.
    
    If a relative path is used, the default application's (the first you have defined on the environment) url
    will be used, and the path attached to it.
    
    An URL can also be used.
    
    @private
   */

  function autoCurlRequest() {
    if (process.argv.length >= 3) {
      var exec = require('child_process').exec,
        args = process.argv.slice(2),
        url = args[args.length - 1],
        portStr = framework.config.server.listenPort !== 80 ? ":" + framework.config.server.listenPort : '';
      
      if (framework.regex.startsWithSlash.test(url)) {
        url = "http://" + framework.defaultApp.domain + portStr + url;
      }
      
      switches = args.slice(0, (args.length - 1)).join(' ');
      
      exec("curl " + switches + " " + url, function(err, stdout, stderr) {
        console.log(err ? stderr : stdout);
        process.exit();
      });
    }
  }
  
});

/**
  Performs the initial setup before instantiating Framework
  
  @private
 */

function initialSetup() {

  /**
    Prints a message or inspected object and exits

    @param {string} msg
    @public
   */

  console.exit = function(msg) {
    if (typeof msg == 'string') console.log(msg);
    else console.log(util.inspect(msg))
    process.exit();
  }
  
}

module.exports = Framework
