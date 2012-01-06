
/* Example Addon */

function ExampleAddon(app, config) {
  
  // All addons take an `app` and an optional `config` parameter
  
  framework.on('startup_message', function() {
    console.log('Loaded sample addon.');
  })
  
}

module.exports = ExampleAddon;
 