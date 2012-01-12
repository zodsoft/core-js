
function UsersModel(app) {
  
  this.properties = {
    id    : {type: 'integer'},
    user  : {type: 'string', unique: true, required: true, validates: 'alpha'},
    pass  : {type: 'string', required: true, validates: 'password'},
    date  : {type: 'timestamp', validates: 'timestamp'}
  }

  this.relationships = {
    hasOne  : ['job', 'car', 'dog'],
    hasMany : ['friends', 'colleagues']
  }
  
}

module.exports = UsersModel;