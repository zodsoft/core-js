
/* CController */

var EventEmitter = require('events').EventEmitter,
    app = framework.defaultApp,
    exec = require('child_process').exec,
    isArray = require('util').isArray;

var ts = framework.testSuite,
    vows = ts.vows,
    assert = ts.assert,
    client = ts.client;

ts.addBatch({
  
  'CController': {

  }

});
