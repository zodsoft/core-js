
function GenericModel(app) {

  this.properties = {
    id    : {type: 'integer', unique: true}
    name  : {type: 'string'},
    email : {type: 'string'},
    limit : {type: 'integer', default: 3},
    hello : {type: 'boolean', default: true},
    date  : {type: 'timestamp'}
  }

  this.relationships = {
    hasOne  : ['job', 'car', 'dog'],
    hasMany : ['friends', 'colleagues']
  }
  
}

module.exports = GenericModel;