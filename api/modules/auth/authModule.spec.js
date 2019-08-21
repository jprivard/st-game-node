let sinon = require('sinon');
let stubs = require('../../../testutils/stubs');

describe('Auth Module', () => {
  let mod = null;
  let route = null;

  describe('setupRoutes', () => {
    it('calls the router to set them up', () => {
      route.expects('setupRoutes').withArgs('auth').once();
      mod.setupRoutes('auth');
    });
  });

  beforeEach(() => {
    mod = require('./authModule')(stubs.app, stubs.passport, stubs.io);
    route = sinon.mock(mod.router);
  });

  afterEach(() => {
    route.verify();
  });
});