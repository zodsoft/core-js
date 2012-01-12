
function Initialize(app) {

  app.usersModel.new({name: 'ernie', email: '1@2.com', age: 25}, function(err, user) {
    console.exit([err, user]);
  });

}

module.exports = Initialize;