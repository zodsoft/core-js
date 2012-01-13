
function Initialize(app) {

  app.debugMode = true;
  
  // var multi = app.usersModel.multi();
  // multi.insert({user: 'ernie', pass: 'abc123'});
  // multi.insert({user: 'howdy', pass: 'def456'});
  // multi.insert({user: 'heya' , pass: 'ghi789'});
  // multi.exec(function(err, results) {
  //   console.exit([err, results]);
  // });
  
  // app.usersModel.get([85, {user: 'howdy'}, 87], function(err, models) {
  //   console.exit([err, models]);
  // });
  
  app.usersModel.delete([85, 86, 87], function(err, results) {
    console.exit([err, results]);
  });

}

module.exports = Initialize;