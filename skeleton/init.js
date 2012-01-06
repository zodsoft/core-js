
function Initialize(app) {

  var redis = new framework.storage.redis(app, {host: 'localhost', port: 6379});

  console.exit(redis);

}

module.exports = Initialize;
