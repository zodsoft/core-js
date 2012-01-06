
function MainController() {
  
  get('/', function(req, res) {
    res.end('index');
  });
  
  get('/login/test', function(req, res) {
    app.login(res);
  });
  

  get('/home/test', function(req, res) {
    app.home(res);
  });
  

  get('/not/found', function(req, res) {
    app.notFound(res);
  });
  

  get('/bad/request', function(req, res) {
    app.badRequest(res);
  });
  

  get('/server/error', function(req, res) {
    app.serverError(res);
  });
  

  get('/raw/server/error', function(req, res) {
    app.serverError(res);
  });
  

  get('/load/cookies', function(req, res) {
    res.end(req.getCookie('myCookie'));
  });
  
  post('/post', {id: 'integer',text: /[a-z]+/}, function(req, res) {
    this.post(req, function(fields, files) {
      var out, path, util = require('util');
      out = [fields, files.readme.name];
      path = files.readme.path;
      this.cleanupFilesUploaded(files, true);
      setTimeout(function() {
        require("path").exists(path, function(exists) {
          out.push(exists);
          res.end(util.inspect(out));
        });
      }, 50);
    });
  });
  

  post('/post/file', function(req, res) {
    this.post(req, function(fields, files) {
      res.end("If this shows up, then there's a problem.");
    });
  });
  

  post('/post/field', function(req, res) {
    this.post(req, function(fields, files) {
      res.end(fields.field);
    });
  });
  
  
}

module.exports = MainController
