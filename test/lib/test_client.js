
/* TestClient */

/* TestClient::constructor */

function TestClient(host, port) {
  this.host = host;
  this.port = port;
}

/* TestClient::prototype */

var _ = require('underscore');

_.extend(TestClient.prototype, new function() {
  
  var http = require('http');
  
  this.request = function(method, url, headers, callback) {
    var options, req;
    if (callback == null) {
      callback = headers;
      headers = {};
    }
    options = {
      host: this.host,
      port: this.port,
      path: url,
      method: method
    };
    options.headers = headers;
    req = http.request(options, callback);
    req.end();
  }
  

  this.head = function(url, headers, callback) {
    this.request('HEAD', url, headers, callback);
  }
  

  this.get = function(url, headers, callback) {
    this.request('GET', url, headers, callback);
  }
  

  this.post = function(url, headers, callback) {
    this.request('POST', url, headers, callback);
  }
  
});

module.exports = TestClient;