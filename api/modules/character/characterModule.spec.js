let sinon = require('sinon');
let stubs = require('../../../testutils/stubs');

describe('Character Module', () => {
  let mod = null;
  let route = null;

  describe('setupRoutes', () => {
    it('calls the router to set them up', () => {
      route.expects('setupRoutes').withArgs('character').once();
      mod.setupRoutes('character');
    });
  });

  beforeEach(() => {
    mod = require('./characterModule')({character: {}}, stubs.app, stubs.io);
    route = sinon.mock(mod.router);
  });

  afterEach(() => {
    route.verify();
  });
});