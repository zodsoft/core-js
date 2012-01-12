
function Initialize(app) {

  app.usersModel.new({name: 'ernie', age: 25}, function(err, user) {
    console.exit([err, user]);
  });

}

module.exports = Initialize;