
function Initialize(app) {

  var driver = app.getResource("drivers/mysql"),
      multi = driver.multi();
  
  console.exit(multi.exec.toString());

  app.debugMode = true;

  app.usersModel.new({
    user: 'ernie', 
    pass: 'abcd1234',
  }, {
    cacheID: 'mycache',
    cacheTimeout: 60
  }, function(err, user) {
    console.exit([err, user]);
  });

}

module.exports = Initialize;