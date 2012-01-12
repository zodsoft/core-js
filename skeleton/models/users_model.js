
function UsersModel(app) {

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