class Controller {
  constructor(message, io) {
    this.message = message;
    this.io = io;
  }

  get(req, res) {
    this.message.find({}, (err, messages) => {
      res.send(messages);
    });
  }

  post(req, res) {
    try{
      this.message.create(req.body).then(() => {
        this.io.emit('message', req.body);
        res.sendStatus(200);
      });
    }
    catch (error){
      res.sendStatus(500);
      console.log('error',error);
    }
    finally{
      console.log('Message Posted')
    }    
  }
}

module.exports = (message, io) => {
  return new Controller(message, io);
};