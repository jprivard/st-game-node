let expect = require('chai').expect
let stubs = require('../../testutils/stubs');

describe('Route', () => {
  let route = null;

  describe('registerModule function', () => {
    it('adds registered module into the internal map', () => {
      route.registerModule('name', 'obj');
      expect(route.modules).to.have.property('name', 'obj');
    });
  });

  describe('setupRoutes function', () => {
    it('declares the generic CORS setup', () => {

    });
  });

  beforeEach(() => {
    route = require('./route')(stubs.app);
  });
});