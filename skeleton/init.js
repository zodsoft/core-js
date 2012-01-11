
function Initialize(app) {

  app.drivers = {
    mysql: app.driver('mysql', {
      user: 'db_user',
      password: 'db_password',
      database: 'test_db'
    })
  }

}

module.exports = Initialize;