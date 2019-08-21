class Router {
  constructor(app) {
    this.app = app;
    this.modules = {};
  }

  registerModule(path, mod) {
    this.modules[path] = mod;
  }

  setupRoutes() {
    this.app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });

    for (let path in this.modules) {
      this.modules[path].setupRoutes(path);
    }
  }
}

module.exports = (app) => {
  return new Router(app);
};