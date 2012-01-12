
function Initialize(app) {

  app.debugMode = true;

  app.drivers.mysql.queryById({
    id: 1,
    table: 'users',
    cacheID: 'my_cache',
    cacheTimeout: 3000
  }, function(err, results) {
    console.log(results);
  });

}

module.exports = Initialize;