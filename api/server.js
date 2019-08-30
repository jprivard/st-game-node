const express = require('express');
const passport = require('passport');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const cors = require('cors');
const { param, body } = require('express-validator');
var sanitizeHtml = require('sanitize-html');
const { ensureLoggedIn, createDb, endDb, showErrors } = require('./middlewares/index');
const DbAdapter = require('./db.adapter').class;
const Controller = require('./controller').class;

async function main() {  
  const adapter = new DbAdapter();
  const controller = new Controller(adapter, passport);
  
  // Configure view engine to render EJS templates.
  app.use(express.static(__dirname + '/static'));
  app.use(express.json());
  app.use(require('body-parser').urlencoded({ extended: true }));
  app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(cors());

  // Configure basic SocketIO commands
  io.on('connection', socket => {
    console.log('a user is connected');

    socket.on('test', () => {
      console.log('test!');
    });
  });
  
  // Define routes.
  app.get('/auth', controller.auth());
  app.post('/auth/login', createDb(), controller.login(), endDb());
    
  app.get('/auth/logout', controller.logout(), endDb());
  
  app.post('/auth/create', [
    body('username').not().isEmpty().withMessage('Invalid email'),
    body('username').isEmail().withMessage('Invalid Email'),
    body('password').not().isEmpty().withMessage('Invalid Password'),
  ], showErrors(), createDb(), controller.setPassword(), endDb());

  app.get('/characters', ensureLoggedIn(), createDb(), controller.getCharacters(), endDb());

  app.post('/characters', [
    body('firstName').not().isEmpty().withMessage('Invalid first name'),
    body('lastName').not().isEmpty().withMessage('Invalid last name'),
    body('stardateOfBirth').not().isEmpty().withMessage('Invalid Stardate of Birth'),
    body('race').isInt({gt: 0}).withMessage('Invalid race'),
    body('rank').isInt({gt: 0}).withMessage('Invalid rank'),
  ], showErrors(), ensureLoggedIn(), createDb(), controller.createCharacter(), endDb());

  app.post('/auth/character', [
    body('selectedCharacter').isInt().withMessage('Invalid character')
  ], showErrors(), ensureLoggedIn(), createDb(), controller.selectCharacter(), endDb());
  
  app.get('/races', ensureLoggedIn(), createDb(), controller.getRaces(), endDb());

  app.get('/ranks', ensureLoggedIn(), createDb(), controller.getRanks(), endDb());

  app.get('/missions', ensureLoggedIn(), createDb(), controller.getMissions(), endDb());

  app.get('/mission/:id/participants', [
    param('id').isInt().withMessage('Invalid mission')
  ], showErrors(), ensureLoggedIn(), createDb(), controller.getParticipants(), endDb());

  app.get('/mission/:id/groups', [
    param('id').isInt().withMessage('Invalid mission')
  ], showErrors(), ensureLoggedIn(), createDb(), controller.getGroups(), endDb());

  app.get('/mission/:id/messages', [
    param('id').isInt().withMessage('Invalid mission')
  ], showErrors(), ensureLoggedIn(), createDb(), controller.getMessages(), endDb());

  app.get('/mission/:mission/message/:message/read', [
    param('mission').isInt().withMessage('Invalid mission'),
    param('message').isInt().withMessage('Invalid message')
  ], showErrors(), ensureLoggedIn(), createDb(), controller.readMessage(), endDb());

  app.post('/mission/:mission/message/', [
    body('group').isInt().withMessage('Invalid group'),
    body('type').isInt({gt: 0, lt: 4}).withMessage('Invalid type'),
    body('message').not().isEmpty().withMessage('Invalid message'),
    body('message').customSanitizer(value => sanitizeHtml(value))
  ], showErrors(), ensureLoggedIn(), createDb(), controller.publishMessage(), endDb());

  const server = app.listen(3000);
  io.listen(server);
}

main();