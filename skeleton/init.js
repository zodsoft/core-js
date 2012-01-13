
function Initialize(app) {

  app.debugMode = true;

  app.usersModel.get(55, {
    cacheId: 'mycache',
    cacheTimeout: 3600
  }, function(err, model) {
    if (err) app.log(err);
    else {
      console.exit(model);
    }
  });

}

module.exports = Initialize;