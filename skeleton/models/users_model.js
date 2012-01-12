
function UsersModel(app) {
  
  this.properties = {
    id    : {type: 'integer', unique: true},
    user  : {type: 'string', required: true, validates: 'alpha'},
    pass  : {type: 'string', required: true, validates: 'password'},
    date  : {type: 'timestamp', validates: 'timestamp'}
  }

  this.relationships = {
    hasOne  : ['job', 'car', 'dog'],
    hasMany : ['friends', 'colleagues']
  }
  
}

module.exports = UsersModel;