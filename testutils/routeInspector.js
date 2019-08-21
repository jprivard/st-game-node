let stubs = require('./stubs');

class RouteInspector {
  constructor(subject) {
    this.subject = subject;
    this.request = null;
  }

  expects(route) {
    this.subject.expects('route').withArgs(route).once().returns(stubs.app);
    return this;
  }

  on(method) {
    this.request = this.subject.expects(method);
    return this;
  }

  withArgs(args) {
    this.request.withArgs(args).once();
    return this;
  }

  calls(index, ctrl, func) {
    this.request.callsArgWith(index, func);
    ctrl.expects(func).withArgs(func);
    return this;
  }
}

module.exports = RouteInspector;