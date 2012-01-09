
function Initialize(app) {

  app.storage.cache = new framework.storage.redis(app, {});
  
  new framework.helpers.session(app);
  
}

module.exports = Initialize;