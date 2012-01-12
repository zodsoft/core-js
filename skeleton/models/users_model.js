
function UsersModel(app) {
  
  this.properties = {
    id    : {type: 'integer', unique: true},
    name  : {type: 'string', required: true, validates: 'alpha'},
    email : {type: 'string', required: true, validates: 'email'},
    date  : {type: 'timestamp', validates: 'timestamp'}
  }

  this.relationships = {
    hasOne  : ['job', 'car', 'dog'],
    hasMany : ['friends', 'colleagues']
  }
  
}

module.exports = UsersModel;