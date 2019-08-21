class Router {
  constructor(app, character) {
    this.app = app;
    this.character = character
  }

  setupRoutes(path) {
    this.app.route(`/${path}`).get(this.character.get.bind(this.character));
  }
}

module.exports = (app, character) => {
  return new Router(app, character);
};