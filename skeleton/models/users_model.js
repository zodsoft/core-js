
function UsersModel(app) {

  this.driver = app.driver('mysql', {
    user: 'db_user', 
    password: 'db_pass', 
    database: 'test_db'});

  this.properties = {
    id    : {type: 'integer', unique: true},
    name  : {type: 'string'},
    email : {type: 'string'},
    date  : {type: 'timestamp'}
  }

  this.relationships = {
    hasOne  : ['job', 'car', 'dog'],
    hasMany : ['friends', 'colleagues']
  }
  
}

module.exports = UsersModel;