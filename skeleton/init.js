
function Initialize(app) {

  app.debugMode = true;

  app.usersModel.new({
    user: 'ernie', 
    pass: 'abcd1234',
  }, {
    cacheID: 'mycache',
    cacheTimeout: 60 * 1000
  }, function(err, user) {
    console.exit([err, user]);
  });

}

module.exports = Initialize;