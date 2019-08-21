class Router {
  constructor(app, passport, auth) {
    this.app = app;
    this.passport = passport;
    this.auth = auth;
  }

  setupRoutes(path) {
    this.app.route(`/${path}/google`).get(
      this.passport.authenticate('google', { scope: 'https://www.googleapis.com/auth/userinfo.email' })
    );
    this.app.route(`/${path}/google/callback`).get(
      this.passport.authenticate('google', { failureRedirect: '/login.html' }), 
      this.auth.callback.bind(this.auth)
    );
    this.app.route(`/${path}/user`).get(this.auth.loggedin.bind(this.auth));
  }
}

module.exports = (app, passport, auth) => {
  return new Router(app, passport, auth);
};