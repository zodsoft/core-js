
function MainController() {
  
  get('/', function(req, res) {
    res.end('index');
  });
  
}

module.exports = MainController
