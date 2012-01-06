
function Example(app, config) {

  /*
    Addons API
    
    These are just functions that perform operations or modify the application's
    behavior. These can either be bundled by the framework or by each application.
    
    To use an addon:
    
      app.use('example');
      
      -or-
      
      app.use('example', {name: 'nodejs', cool: true});
      
    Here's the search process:
    
    1) Search `app/addons/example.js`
    2) If nothing found on the location above, search `framework/addons/example.js` 
   */
   
   framework.on('startup_message', function() {
     app.debug('Using example addon');
   });
   
   app.on('request', function(req, res) {
     app.log('A new request has just been received');
   });

}

module.exports = Example;
