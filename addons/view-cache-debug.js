
/**
  Enables view cache debugging
 */

function ViewCacheDebug(app) {
  
  framework.on('startup_message', function() {
    app.debug('Using view-cache-debug');
  });  
  
  app.on('view_cache_access', function(app, relPath) {
    app.debug("Using cached function for " + relPath);
  });
  
  app.on('view_cache_store', function(app, relPath) {
    app.debug("Storing new function for " + relPath);
  });
  
  app.on('mvc_request', function(req, res) {
    res.on('finish', function() {
      if (app.debugMode) console.log('');
    });
  });

}

module.exports = ViewCacheDebug;
