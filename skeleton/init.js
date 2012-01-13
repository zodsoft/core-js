
function Initialize(app) {

  app.debugMode = true;

  // app.usersModel.new({
  //   user: 'ernie', 
  //   pass: 'abcd1234',
  // }, function(err) {
  //   if (err) app.log(err);
  //   else {
  //     console.exit('Successfully created user\n');
  //   }
  // });
  
  app.usersModel.get({id: 55}, function(err, model) {
    if (err) app.log(err);
    else {
      var rand = '_' + Math.random().toString().slice(15);
      model.user = 'howdy' + rand;
      model.pass = 'secret'
      model.save(function(err) {
        if (err) app.log(err);
        else console.exit('Successfully saved ' + model.className);
      });
    }
  });

}

module.exports = Initialize;