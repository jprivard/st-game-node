let sinon = require('sinon');
let stubs = require('../../../testutils/stubs');
let RouteInspector = require('../../../testutils/routeInspector');

describe('Character Route', () => {
  let route = null;
  let app = null;
  let character = null;
  let inspector = null;

  describe('setupRoutes', () => {
    it('Setups the endpoints with their appropriate controller calls', () => {
      inspector.expects('/route').on('get').calls(0, character, 'get');
      route.setupRoutes('route');
    });
  });

  beforeEach(() => {
    let ctrl = require('./characterController')(stubs.character, stubs.io);
    app = sinon.mock(stubs.app);
    character = sinon.mock(ctrl);
    inspector = new RouteInspector(app);
    route = require('./characterRoute')(stubs.app, ctrl);
  });

  afterEach(() => {
    app.verify();
    character.verify();
  });
});
