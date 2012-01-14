
function MainController() {
  
  var util = require('util');
  
  get('/', function(req, res) {
    res.render('index');
  });

}

module.exports = MainController;