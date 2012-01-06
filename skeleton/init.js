
function Initialize(app) {

  var storage = new framework.storage.redis(app, {host: 'localhost', port: 6379, db: 1});

  storage.set('hello', 'world', function(err) {
    if (err) throw err
    else {
      console.log('successfully set value');
    }
  });

}

module.exports = Initialize;
