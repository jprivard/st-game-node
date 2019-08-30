const mysql = require('mysql2/promise');
const environment = require('./../../environments/environment.local');

module.exports = {
  createDb: () => {
    return async(req, res, next) => {
      req.db = await mysql.createConnection(environment.mysql);
      next();
    }
  },  
  endDb: () => {
    return async(req, res, next) => {
      req.db.end();
      next();
    }
  }
}