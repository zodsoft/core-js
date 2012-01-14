
/* Storage Configuration */

module.exports = {

  redis: {
    
    query: {
      host: 'localhost',
      port: 6379,
      db: 0
    },
    
    session: {
      host: 'localhost',
      port: 6379,
      db: 1
    }
    
  }

}