
function Initialize(app) {

  var storage = new framework.storage.redis(app, {}),
      multi = storage.multi();
      
  multi.setHash('hash', {name: 'ernie', age: 28});
  multi.updateHash('ernie', {age: 99});
  multi.exec(function(err, results) {
    console.exit([err, results]);
  })
  
}

module.exports = Initialize;