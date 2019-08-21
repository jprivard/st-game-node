class Module {
  constructor(models, app, io) {
    let message = require('../../models/message')(models.message);
    let controller = require('./messageController')(message, io);
    this.router = require('./messageRoute')(app, controller);
  }

  setupRoutes(path) {
    this.router.setupRoutes(path);
  }
}

module.exports = (models, app, io) => {
  return new Module(models, app, io);
}