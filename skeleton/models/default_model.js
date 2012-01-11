
function DefaultModel(app) {

  // Property Definitions

  this.name = '';
  this.email = '';
  this.limit = 3;
  this.hello = true;
  this.stuff = null;

  // Relationships
  
  this.hasOne('friend');
  this.hasMany('colleagues');

  // Methods
  
  

}

module.exports = DefaultModel;