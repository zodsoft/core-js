
/* Test Suite */

function TestSuite() {

  var vows = require('vows'),
      assert = require('assert'),
      specReporter = require('../../node_modules/vows/lib/vows/reporters/spec');

  var app = framework.defaultApp,
      listenPort = framework.config.server.listenPort,
      TestClient = require('./TestClient'),
      client = new TestClient(app.domain, listenPort);

  framework.testSuite = {
    batch: vows.describe('CoreJS Tests'),
    client: client,
    assert: assert,
    addBatch: function(batch) { framework.testSuite.batch.addBatch(batch); }
  };

  framework.on('unit_tests', function() {

    var testSubjects = ['CFramework', 'CUtility', 'TestClient', 'CApplication', 'CController' ];

    // testSubjects = ['CController'];

    for (var current, i=0; i < testSubjects.length; i++) {
      current = testSubjects[i];
      require('../'+current+'.test');
    }

    framework.testSuite.batch.run({reporter: specReporter});

  });
  
}

module.exports = TestSuite;
