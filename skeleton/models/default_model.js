
function DefaultModel(app) {

  // Property Definitions

  this.properties = {
    name: '',
    email: '',
    limit: 3,
    hello: true,
    stuff: null
  }

  // Relationships
  
  this.hasOne('friend');
  this.hasMany('colleagues');

  // Methods
  
  

}

module.exports = DefaultModel;