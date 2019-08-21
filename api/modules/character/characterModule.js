class Module {
  constructor(models, app, io) {
    let controller = require('./characterController')(models.character, io);
    this.router = require('./characterRoute')(app, controller);
  }

  setupRoutes(path) {
    this.router.setupRoutes(path);
  }
}

module.exports = (models, app, io) => {
  return new Module(models, app, io);
}