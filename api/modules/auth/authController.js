class Controller {
  constructor(io) {
    this.io = io;
  }

  callback(req, res) {
    this.io.emit('loggedIn', req.user)
    res.redirect('/success.html');
  }

  loggedin(req, res) {
    if (!req.user){
      res.sendStatus(403);
    } else {
      res.send(req.user[0]);
    }
  }
}

module.exports = (io) => {
  return new Controller(io);
};