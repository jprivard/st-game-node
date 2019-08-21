let sinon = require('sinon');
let stubs = require('../../../testutils/stubs');
let RouteInspector = require('../../../testutils/routeInspector');

describe('Auth Route', () => {
  let route = null;
  let app = null;
  let passport = null;
  let auth = null;
  let inspector = null;

  describe('setupRoutes', () => {
    it('Setups the endpoints with their appropriate controller calls', () => {
      passport.expects('authenticate').withArgs('google', { scope: 'https://www.googleapis.com/auth/userinfo.email' }).once().returns('init');
      passport.expects('authenticate').withArgs('google', { failureRedirect: '/login.html' }).once().returns('callback');
      inspector.expects('/route/google').on('get').withArgs('init');
      inspector.expects('/route/google/callback').on('get').withArgs('callback').calls(1, auth, 'callback');
      inspector.expects('/route/user').on('get').calls(0, auth, 'loggedin');

      route.setupRoutes('route');
    });
  });

  beforeEach(() => {
    let ctrl = require('./authController')(stubs.user, stubs.io);
    app = sinon.mock(stubs.app);
    passport = sinon.mock(stubs.passport);
    auth = sinon.mock(ctrl);
    inspector = new RouteInspector(app);
    route = require('./authRoute')(stubs.app, stubs.passport, ctrl);
  });

  afterEach(() => {
    app.verify();
    passport.verify();
    auth.verify();
  });
});
