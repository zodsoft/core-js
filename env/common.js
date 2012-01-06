
/* Common Environment */

var CFramework = require('../lib/framework')

.configure('vhosts', {
  'localhost': 'skeleton'
});

module.exports = CFramework;
