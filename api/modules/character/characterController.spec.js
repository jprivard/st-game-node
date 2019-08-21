let sinon = require('sinon');
let stubs = require('../../../testutils/stubs');

describe('Character Controller', () => {
  let character = null;
  let res = null;
  let controller = null;

  describe('get function', () => {
    it('sends a 403 forbidden http code if you are not logged in', () => {
      res.expects('sendStatus').once().withArgs(403);
      controller.get({}, stubs.res);
    });

    it('outputs the character sheet linked to the user account', () => {
      res.expects('send').once().withArgs('albert');
      character.expects('find').withArgs({player: 'id'}).callsArgWith(1, null, 'albert');
      controller.get({user: [{_id: 'id'}]}, stubs.res);
    });
  });

  beforeEach(() => {
    character = sinon.mock(stubs.character);
    res = sinon.mock(stubs.res);
    controller = require('./characterController')(stubs.character, stubs.io);
  });

  afterEach(() => {
    character.verify();
    res.verify();
  });
});