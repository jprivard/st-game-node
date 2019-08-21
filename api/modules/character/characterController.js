class Controller {
  constructor(character, io) {
    this.character = character;
    this.io = io;
  }

  get(req, res) {
    if ( !req.user ) {
      res.sendStatus(403);
    } else {
      this.character.find({player: req.user[0]._id}, (err, character) => {
        res.send(character);
      });  
    }
  }
}

module.exports = (character, io) => {
  return new Controller(character, io);
};