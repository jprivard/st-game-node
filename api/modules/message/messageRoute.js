class Router {
  constructor(app, message) {
    this.app = app;
    this.message = message;
  }

  setupRoutes(path) {
    this.app.route(`/${path}`)
      .get(this.message.get.bind(this.message))
      .post(this.message.post.bind(this.message));
  }
}

module.exports = (app, message) => {
  return new Router(app, message);
};