
function MainController() {

  this.authRequired = true;
  
  get('/', function(req, res) {
    res.render('index');
  });
  
  public_get('/login', function(req, res) {
    if (req.__session.user) app.home(res)
    else res.rawHttpMessage('Please <a href="/auth">authenticate</a>');
  });
  
  public_get('/auth', function(req ,res) {
    if (req.__session.user) app.home(res);
    else {
      app.session.create(req, res, {user: 'ernie'}, true, function(session) {
       app.home(res);
      });
   }
  });
  
  get('/logout', function(req, res) {
    app.session.destroy(req, res, function() {
      app.home(res);
    });
  });

}

module.exports = MainController;