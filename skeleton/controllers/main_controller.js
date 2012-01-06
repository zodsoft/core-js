
function MainController() {

  get('/', function(req, res) {
    res.render('index');
  })

}

module.exports = MainController;