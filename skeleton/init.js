
function Initialize(app) {

  app.debugMode = true;

  app.drivers.mysql.queryById({
    id: 1,
    table: 'users'
  }, function(err, results) {
    console.log(results);
  });

}

module.exports = Initialize;