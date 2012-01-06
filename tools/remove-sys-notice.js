#!/usr/bin/env node

/**
    remove-sys-notice.js
    
    Patches node_modules and replaces any references of the 'sys' module
    with the new 'util' module.
 */

// Local vars

var path = require('path'),
    rootPath = path.resolve(__dirname, '../'),
    nodeModules = rootPath + '/node_modules',
    child_process = require('child_process'),
    fs = require('fs'),
    found = 0;

// Grep search for "sys" module usage

child_process.exec("grep -r 'require(\"sys\")' --exclude='dangling-symlink' " + nodeModules, function(err, stdout, stderr) {
  if (err && err.code == 2) {
    // Grep errors have an exit status of 2
    throw err; 
  } else {
    patchFiles(stdout);
    child_process.exec("grep -r \"require('sys')\" --exclude='dangling-symlink' " + nodeModules, function(err, stdout, stderr) {
      if (err && err.code == 2) {
        // Grep errors have an exit status of 2
        throw err; 
      } else {
        patchFiles(stdout);
        
        if (found > 0) console.log("\nPatched " + found + " files.\n");
        else console.log("\nNo references of 'sys' found.\n");
        
      }
    });
  }
});

// Patches the files and removes any "sys" module references

function patchFiles(buf) {
  var split = buf.split(/\n/g);
  for (var buf,file,i=0; i < split.length; i++) {
    file = split[i];
    if ( ! /^Binary file/.test('here') &&  file.indexOf(':') > 0 ) {
      if (found == 0) console.log('');
      found++;
      file = split[i].split(':')[0];
      buf = fs.readFileSync(file, 'utf-8')
            .replace(/require(\s+)?\((\s+)?('|")sys('|")(\s+)?\)/gi, 'require$1($2$3util$4$5)');
      console.log(file);
      fs.writeFileSync(file, buf, 'utf-8');
    }
  }
}