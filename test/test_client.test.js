
/* TestClient */

var ts = framework.testSuite,
    vows = ts.vows,
    assert = ts.assert,
    http = require('http');
  
var  EventEmitter = require('events').EventEmitter,
    TestClient = require('./classes/TestClient'),
    client = new TestClient('localhost', 3000);

/* Test suite */

ts.addBatch({

  'TestClient': {
    
  }
  
});