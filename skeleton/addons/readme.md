
Application Addons
===

This directory is optional, and contains the addons provided by the application.

To load the sample addon provided by the framework, do:

  app.use('sample-addon');
  
The application will then search for its `addons/` directory (if available) and load the
requested addons. If the addon does not exist, then it will try to load the addon in the
`framework/addons` directory.

An exception will be thrown if the addon can't be found.