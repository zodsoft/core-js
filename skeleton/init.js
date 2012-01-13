
function Initialize(app) {

  app.debugMode = true;
  
  var multi = app.createMulti(app.usersModel);

  console.exit(multi);

}

module.exports = Initialize;