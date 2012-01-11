
/* Storage Configuration */

module.exports = {

  redis: {
    queryCache: {
      host: 'localhost',
      port: 6379,
      db: 0
    },
    sessionStore: {
      host: 'localhost',
      port: 6379,
      db: 1
    },
    responseCache: {
      host: 'localhost',
      port: 6379,
      db: 2
    }
  }

}