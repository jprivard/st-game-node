let sinon = require('sinon');
let stubs = require('../../../testutils/stubs');

describe('Auth Controller', () => {
  let user = null;
  let io = null;
  let res = null;
  let controller = null;

  describe('callback function', () => {
    it('emits the logged in event through io', () => {
      io.expects('emit').once().withArgs('loggedIn', 'logged in user');
      res.expects('redirect').once().withArgs('/success.html');

      controller.callback({user: 'logged in user'}, stubs.res);
    });
  });

  describe('loggedin function', () => {
    it('sends a 403 forbidden http code if you are not logged in', () => {
      res.expects('sendStatus').once().withArgs(403);
      controller.loggedin({}, stubs.res);
    });

    it('outputs the detail of the logged in user otherwise', () => {
      res.expects('send').once().withArgs('user');
      controller.loggedin({user: [ 'user' ]}, stubs.res);
    })
  });

  beforeEach(() => {
    user = sinon.mock(stubs.user);
    io = sinon.mock(stubs.io);
    res = sinon.mock(stubs.res);
    controller = require('./authController')(stubs.user, stubs.io);
  });

  afterEach(() => {
    user.verify();
    io.verify();
    res.verify();
  });
});