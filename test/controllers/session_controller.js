
function SessionController() {
  
  get('/', function(req, res) {
    res.end('/');
  });
  
}

module.exports = SessionController;