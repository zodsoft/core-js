
# Application Addons

This directory is optional and contains the addons provided by the application.

To load the sample addon provided by the framework:

    app.use('sample-addon');
    
You can also pass an optional configuration object:

    app.use('sample-addon', {debug: true, msg: 'Hello World'});
  
The application will then search for its `addons/` directory (if available) and load the
requested addons. If the addon does not exist it will try to load the addon in the
`framework/addons` directory.

An exception will be thrown if the addon can't be found.