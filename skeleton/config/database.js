
/* Database Configuration */

module.exports = {
  
  default: 'mysql',
  
  mysql: {
    host: 'localhost',
    port: 3306,
    user: 'db_user',
    password: 'db_pass',
    database: 'test_db',
    storage: 'redis'
  }

}