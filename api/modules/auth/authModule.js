class Module {
  constructor(app, passport, io) {
    let controller = require('./authController')(io);
    this.router = require('./authRoute')(app, passport, controller);
  }

  setupRoutes(path) {
    this.router.setupRoutes(path);
  }
}

module.exports = (app, passport, io) => {
  return new Module(app, passport, io);
}