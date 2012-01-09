
function MainController() {

  this.authRequired = false;
  
  get('/', function(req, res) {
    res.render('index');
  });
  
  get('/login', function(req, res) {
    res.rawHttpMessage('Please <a href="/auth">authenticate</a>');
  });
  
  get('/auth', function(req ,res) {
   if (req.__session.user) app.home(res);
   else {
     app.session.create(req, res, {user: 'ernie'}, true, function(session) {
       app.home('res');
     });
   }
  });
  
  get('/logout', function(req, res) {
    if (req.__session.user) {
      app.session.destroy(function() {
        app.home(res);
      });
    } else app.home(res);
  });

}

module.exports = MainController;