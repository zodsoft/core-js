
function GenericModel(app) {

  /* Properties. The default value sets the type */

  this.properties = {
    name: '',
    email: '',
    limit: 3,
    hello: true,
    stuff: null
  }

  /* Relationships: Take string/array */

  this.relationships = {
    hasOne: ['job', 'car', 'dog'],
    hasMany: ['friends', 'colleagues']
  }
  
}

module.exports = GenericModel;