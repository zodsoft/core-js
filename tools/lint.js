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

// Output colors
var colorRegex = /(\n)?(.*?): line (\d+), (.*?), (.*?)(\n)/g

// Functions
function logger(data) {
  data = data.toString('utf-8');
  console.log(colorize(data));
}

function colorize(data) {
  return data.replace(colorRegex, '$1➜ \033[0;30m$2:\033[0m\033[1;30m$3 \033[0;31m$5\033[0m$6');
}

// Run command w/args
console.log('');
var jshint = cp.spawn(cmd, args);

jshint.stdout
  .on('data', logger)
  .on('error', logger);
