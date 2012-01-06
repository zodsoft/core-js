
/**
  Ignores the listen port from being accessed directly
 */

function ListenportIgnore(app) {

  framework.on('startup_message', function() {
    app.debug('Using listenport-ignore');
  });

  app.on('request', function(req, res) {
    if (req.headers.host.indexOf(':') >= 0) return req.stopRoute();
  });

}

module.exports = ListenportIgnore;
