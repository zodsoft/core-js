
/* General Configuration*/

var config = {
  title: 'My Application',
  language: 'en-US',
  encoding: 'utf-8',
  rawViews: false
};


/* Regular Expressions */

config['regex'] = {};


/* Custom & Dynamic Headers */

config['headers'] = {
  'Content-Type': function(req, res) { return "text/html; charset=" + this.config.encoding; },
  'Date': function() { return new Date().toUTCString(); },
  'Status': function(req, res) {  return res.statusCode + " " + this.httpStatusCodes[res.statusCode]; },
  'X-Powered-By': 'CoreJS/' + framework.version
};


/* Server Settings */

config['server'] = {
  strictRouting: true,
  headRedirect: false,
  maxFieldSize: 2 * 1024 * 1024,
  maxUploadSize: 2 * 1024 * 1024,
  keepUploadExtensions: true,
};


/* Static Server Settings */

config['staticServer'] = {
  eTags: true,
  acceptRanges: true,
};

/* Cache Control Settings */

config['cacheControl'] = {
  maxAge: 10 * 365 * 24 * 60 * 60,
  static: 'public',
  dynamic: 'private, must-revalidate, max-age=0',
  error: 'no-cache'
};

module.exports = config;
