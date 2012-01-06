
function MainController() {
  
  get('/', function() {
    res.end('OK');
  });
  
}

module.exports = MainController;