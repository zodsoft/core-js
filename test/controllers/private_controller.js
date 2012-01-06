
function PrivateController() {
  
  // this.authRequired = true;
  // 
  // function ok(req, res) { res.end('ok') }
  // 
  // this.get('/', ok);
  // 
  // this.private_get('/priv_get', ok);
  // 
  // this.private_post('/priv_post', ok);
  // 
  // this.public_get('/get/token', function(req, res) {
  //   res.end(app.csrf.getToken('token'));
  // });
  // 
  // this.public_post('/upload/:action/:csrf', {
  //   action: /^(keep|delete)$/,
  //   csrf: '/^(token|notoken)$/',
  //   val1: 'integer',
  //   val2: 'boolean',
  //   val3: /^(a|b)$/,
  // }, {
  //   action: 'Invalid action',
  //   val1: 'invalid val',
  //   val2: 'invalid val',
  //   val3: function(param) { return (param.length == 0) ? "Can't be empty" : "invalid val" }
  // }, function(req, res) {
  //   var util = require('util'),
  //       token = (req.__params.token == 'token') ? 'token' : undefined,
  //       keep = (req.__params.action == 'keep');
  //   this.post(req, token, function(fields, files) {
  //     if (! keep) this.cleanupFilesUploaded(files, true);
  //     res.end(inspect(fields));
  //   });
  // });
  
}

module.exports = PrivateController;