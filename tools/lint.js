#!/usr/bin/env node

/*
 * Linting tool, using jshint with options from ../jshint.json
 */

var path = require('path'),
    cp = require('child_process');
    
// Framework path
var rootPath = path.dirname(__filename);

// Config file
var config = path.resolve(rootPath, '../jshint.json');

// Command, using local jshint library
var cmd = path.resolve(rootPath, '../node_modules/jshint/bin/hint'),
    args = process.argv.slice(2).concat(['--config', config]);

// Run command w/args
console.log('');
var jshint = cp.spawn(cmd, args),
    logger = function(data) { console.log(data.toString('utf-8')); };

jshint.stdout
  .on('data', logger)
  .on('error', logger);
