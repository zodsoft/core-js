
/* Utility */

var _ = require('underscore'),
    _s = require('underscore.string'),
    net = require('net'),
    util = require('util'),
    fs = require('fs'),
    indexOf = Array.prototype.indexOf;

function Utility() {
  this.className = this.constructor.name;
}


/**
  Performs type coercion of a string
  
  @param {string} value
  @returns {mixed} converted value in the detected type
  @public
 */

Utility.prototype.typecast = function(value) {
  if (framework.regex.integer.test(value)) {
    return parseInt(value, 10);
  } else if (framework.regex.float.test(value)) {
    return parseFloat(value);
  } else if (framework.regex["null"].test(value)) {
    return null;
  } else if (framework.regex.boolean.test(value)) {
    if (value.toLowerCase() === 'true') {
      return true;
    } else {
      return false;
    }
  } else {
    return value;
  }
}

/**
  Merges one object's keys into another
  
  @param {object} dest
  @param {object} src
  @public
 */

Utility.prototype.merge = function(dest, src) {
  for (var key in src) {
    dest[key] = src[key];
  }
}

/**
  Gets the files in a path, matching a regular expression.
  
  Defaults to .js files if regular expression is not provided.
  
  @param {string} path
  @param {regex} regex
  @returns {array}
  @public
 */

Utility.prototype.getFiles = function(path, regex, callback) {
  var files, out = [];
  
  if (callback == null) {
    callback = regex;
    regex = null;
  }
  
  if (regex == null) {
    regex = framework.regex.jsFile;
  }
  
  try {
    files = fs.readdirSync(path);
  } catch(e) {
    return out;
  }
  
  for (var file,i=0; i < files.length; i++) {
    file = files[i];
    if ( regex.test(file) ) {
      if (callback) callback.call(this, file);
      out.push(file);
    }
  }
  return out;
}

/**
  Converts a dashed string to camel case
  
  @param {string} string
  @returns {string} converted string
  @public
 */

Utility.prototype.toCamelCase = function(string) {
  return _s.titleize(_s.camelize(string.replace(/\_/, '-')));
}

/**
  Requires all classes found in path into destination, with optional filter
  
  @param {string} path
  @param {string} object
  @param {function} filterCb
  @private
 */

Utility.prototype.requireAllTo = function(path, destination, filterCb) {
  var classConstructor, files, replRegex,
      doFilter = (typeof filterCb == 'function');

  files = this.getFiles(path);
  
  replRegex = /(\..*)?$/;
  
  for (var key,file,i=0; i < files.length; i++) {
    file = files[i];
    key = file.replace(replRegex, '');
    file = file.replace(framework.regex.jsFile, '');
    classConstructor = require(path + '/' + file);
    if (typeof classConstructor === 'function') {
      if (doFilter) classConstructor = filterCb(classConstructor);
      destination[key] = classConstructor;
    }
  }
}

/**
 Gets the files in a path, matching a regular expression.
 
 @param {string} path
 @param {regex} regex
 @returns {array}
 @public
*/

Utility.prototype.ls = function(path, regex) {
  var files, out;
  files = fs.readdirSync(path);
  out = [];
  if (regex != null) {
    for (var file,i=0; i < files.length; i++) {
      file = files[i];
      if ( regex.test(file) ) out.push(file);
    }
  }
  return out;
}

/**
  Checks if a value is of a specific type
  
  @param {mixed} val
  @param {string} type
  @returns {boolean}
  @public
 */

Utility.prototype.isTypeOf = function(val, type) {
  return (typeof val == type);
}

/**
  Repeats a string n times defined by multiplier
  
  @param {string} input
  @param {int} multiplier
  @returns {string} repeated string
  @public
 */
  
Utility.prototype.strRepeat = function(input, multiplier) {
  return new Array(multiplier + 1).join(input);
}

/**
   Parses an HTTP Range header
   
   Uses code from Connect's [util.js](https://github.com/senchalabs/connect/blob/master/lib/utils.js) 
   
   @param {int} size
   @param {string} str
   @returns {object} containing start, end ranges
   @private
  */

Utility.prototype.parseRange = function(size, str) {
  var valid = true,
    arr = str.substr(6).split(',').map(function(range) {
    var start, end;
    range = range.split('-');
    start = parseInt(range[0], 10);
    end = parseInt(range[1], 10);
    if (isNaN(start)) {
      start = size - end;
      end = size - 1;
    } else if (isNaN(end)) {
      end = size - 1;
    }
    if (isNaN(start) || isNaN(end) || start > end) valid = false;
    return {
      start: start,
      end: end
    };
  });
  if (valid) {
    return arr;
  } else {
    return null;
  }
}

/**
  Sets the properties of an object as non enumerable
  
  @param {object} context
  @param {array} properties
  @public
 */

Utility.prototype.setNonEnumerable = function(context, properties) {
  for (var prop,val,i=0; i < properties.length; i++) {
    prop = properties[i];
    if (context.propertyIsEnumerable(prop)) {
      val = context[prop];
      delete context[prop]
      Object.defineProperty(context, prop, {
        value: val,
        writable: true,
        enumerable: false,
        configurable: true
      });
    }
  }
}

/**
  Makes the specified properties of an object enumerable. The rest are non-enumerable
  
  Additionally, methods from an extra object can be set as enumerable
  
  @param {object} context
  @param {array} properties
  @param {object} extraProto
  @public
 */
 
Utility.prototype.onlySetEnumerable = function(context, properties, extraProto) {
  this.setNonEnumerable(context, _.keys(context));

  if (extraProto) {
    properties = properties.concat(_.methods(extraProto));
  }

  for (var prop,val,i=0; i < properties.length; i++) {
    prop = properties[i];
    val = context[prop];
    delete context[prop];
    context[prop] = val;
  }
}
 
/**
  Runs a class initialization function, if available

  @property {object} context
  @private
  */
 
Utility.prototype.runInitFunction = function(context) {
  if (typeof context.initialize === 'function') {
    // Run initialize if method exists
    context.initialize();
  }
}
 
 /**
    Searches for a given pattern within a string

   @param {string} buffer
   @param {string} s
   @private
  */

Utility.prototype.searchPattern = function(buffer, s) {
  var indices = {};
  if (! util.isArray(s) ) s = [s];
  for (var pat,found,idx,i=0; i < s.length; i++) {
    pat = s[i];
    found = indices[pat] = [];
    idx = buffer.indexOf(pat);
    while (idx != -1) {
      found.push(idx);
      idx = buffer.indexOf(pat, idx + 1);
    }
  }
  return indices;
}
 
 /**
  Extracts keys from object
  
  @param {object} object
  @param {array} keys
  @returns {object}
  @public
 */
 
Utility.prototype.extract = function(object, keys, nullOut) {
  var key, i, c = 0, out = {};
  for (i=0; i < keys.length; i++) {
    key = keys[i];
    out[key] = object[key] || null;
    if (out[key] === null) c++;
  }
  return (nullOut && c == keys.length) ? null : out;
}
 
 /**
  Checks if a port is open
  
  Provides [err]
  
  @param {int} port
  @param {function} callback
  @public
  */
  
Utility.prototype.checkPort = function(port, callback) {
  var self = this;
  var conn = net.createConnection(port, function() {
    callback.call(self, null);
  });
  conn.on('error', function(err) {
    callback.call(self, err);
  });
}
   
module.exports = Utility;
