#!/usr/bin/env node

/*
  Starts the node inspector
 */
 
var path = require('path'),
    child_process = require('child_process'),
    listenPort = require(path.resolve(__dirname, '../env/debug')).config.inspector_port,
    inspector = path.resolve(__dirname, '../node_modules/node-inspector/bin/inspector.js'),
    cmd;

if (path.existsSync(inspector)) {

  cmd = 'nohup ' + inspector + ' --web-port=' + listenPort + ' > /dev/null 2>&1&'
  child_process.exec(cmd, function() {
    child_process.exec('ps aux | grep node', function(err, stdout, stderr) {
      if (err) {
        if (err.code == 2) console.log('\n' + stderr)
        else console.log('\nUnable to start node-inspector.\n');
      }
      else if (stdout.indexOf(inspector) > 0) {
        console.log('\nNode Inspector running on http://0.0.0.0:' + listenPort + '\n');
      } else {
        console.log('\nUnable to start node-inspector.\n');
      }
    });
  });
  
} else {
  
  console.log("\nRun `npm install` to start using node-inspector.\n");
  
}