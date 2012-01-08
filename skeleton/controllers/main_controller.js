
function MainController() {

  get('/', function(req, res) {
    res.useCache('hello');
    res.render('index');
  })

}

module.exports = MainController;