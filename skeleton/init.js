
function Initialize(app) {

  var storage = new framework.storage.redis(app, {host: 'localhost', port: 6379});
  
  console.exit(app);
    
}

module.exports = Initialize;
