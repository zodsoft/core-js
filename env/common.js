
/* Common Environment */

var CoreJS = require('../lib/framework')

.configure('vhosts', {
  'localhost': 'skeleton'
});

module.exports = CoreJS;
