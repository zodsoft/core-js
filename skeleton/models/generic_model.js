
function GenericModel(app) {

  /* Query Params: Defines how models are retrieved */

  this.queryBy = 'id';

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