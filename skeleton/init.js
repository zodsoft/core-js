
function Initialize(app) {

  var cacheStore = new framework.storage.redis(app, {host: 'localhost', port: 6379});

  var db = new framework.drivers.mysql(app, {
    host: 'localhost',
    port: 3306,
    user: 'test_db',
    password: 'root',
    database: 'passme',
    storage: cacheStore
  });
  
  console.exit(db);
  
}

module.exports = Initialize;
