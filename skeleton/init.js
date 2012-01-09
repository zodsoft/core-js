
function Initialize(app) {

  app.storage.cache = new framework.storage.redis(app, {});
  
  app.enable('session', {});
  
}

module.exports = Initialize;