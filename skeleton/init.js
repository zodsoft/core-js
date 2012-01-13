
function Initialize(app) {

  app.debugMode = true;

  // app.usersModel.get(
  // {user: 'ernie'},
  // {cacheID: 'mycache', timeout: 3600},
  // function(err, model) {
  //   if (err) app.log(err);
  //   else {
  //     console.exit(model);
  //   }
  // });
  
  // app.usersModel.delete(78, 
  // {cacheInvalidate: 'mycache'},
  // function(err) {
  //   console.exit(err);
  // });

  // app.usersModel.get(
  // {user: 'ernie'}, 
  // {cacheID: 'mycache', timeout: 3600},
  // function(err, model) {
  //   if (err) app.log(err);
  //   else if (model) {
  //     // Delete model
  //     model.delete({cacheInvalidate: 'mycache'}, function(err) {
  //       if (err) app.log(err);
  //       else {
  //         console.exit('Successfully removed model');
  //       }
  //     });
  //   } else {
  //     console.exit('No Model Found');
  //   }
  // });

  // app.usersModel.insert({
  //   user: 'ernie',
  //   pass: 'abc123'
  // }, function(err, id) {
  //   console.exit([err, id]);
  // });

  // app.usersModel.new(
  // {user: 'ernie', pass: 'abc123'}, 
  // {cacheInvalidate: 'mycache'}, 
  // function(err, model) {
  //   console.exit([err, model]);
  // });
  
}

module.exports = Initialize;