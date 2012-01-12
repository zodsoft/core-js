
function anonymous(locals) {

with (locals) {

/* MainController */

function MainController(app) {
  this.__construct.call(this, app);
}

/* Extend static methods */

MainController.prototype = app.controllerProto;

framework.extend(MainController, framework.lib.controller);

/* Route functions available locally */

function get() { MainController.routingFunctions.get.apply(MainController, arguments); }
function getpost() { MainController.routingFunctions.getpost.apply(MainController, arguments); }
function post() { MainController.routingFunctions.post.apply(MainController, arguments); }
function postget() { MainController.routingFunctions.postget.apply(MainController, arguments); }
function privateGet() { MainController.routingFunctions.privateGet.apply(MainController, arguments); }
function privateGetPost() { MainController.routingFunctions.privateGetPost.apply(MainController, arguments); }
function privatePost() { MainController.routingFunctions.privatePost.apply(MainController, arguments); }
function privatePostGet() { MainController.routingFunctions.privatePostGet.apply(MainController, arguments); }
function private_get() { MainController.routingFunctions.private_get.apply(MainController, arguments); }
function private_getpost() { MainController.routingFunctions.private_getpost.apply(MainController, arguments); }
function private_postget() { MainController.routingFunctions.private_postget.apply(MainController, arguments); }
function publicGet() { MainController.routingFunctions.publicGet.apply(MainController, arguments); }
function publicGetPost() { MainController.routingFunctions.publicGetPost.apply(MainController, arguments); }
function publicPost() { MainController.routingFunctions.publicPost.apply(MainController, arguments); }
function publicPostGet() { MainController.routingFunctions.publicPostGet.apply(MainController, arguments); }
function public_get() { MainController.routingFunctions.public_get.apply(MainController, arguments); }
function public_getpost() { MainController.routingFunctions.public_getpost.apply(MainController, arguments); }
function public_post() { MainController.routingFunctions.public_post.apply(MainController, arguments); }
function public_postget() { MainController.routingFunctions.public_postget.apply(MainController, arguments); }

/* Controller's code, running in closure */

(function() {

  get('/', function(req, res) {
    res.render('index');
  });

}).call(MainController);

return MainController;

}

}

module.exports = anonymous;