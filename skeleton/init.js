
function Initialize(app) {

  app.debugMode = true;
  
  var multi = app.usersModel.multi();

  console.exit(multi);

}

module.exports = Initialize;