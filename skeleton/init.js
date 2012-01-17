
function Initialize(app) {

  app.debugMode = true;
  
  app.enable('session', {storage: 'redis', guestSessions: true});
  
}

module.exports = Initialize;