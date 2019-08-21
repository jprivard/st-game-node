const express = require('express');
const passport = require('passport');
const Strategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const UserFactory = require('./models/user').factory;
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
const environment = require('../environments/environment.local');

async function main() {
  // Configure MySQL Connection
  const db = await mysql.createConnection(environment.mysql);
  db.timeout = 0;
  
  // Configure the local strategy for use by Passport.
  passport.use(new Strategy(
    async(username, password, done) => {
      const sql = `SELECT * FROM accounts WHERE email = "${username}"`;
      const [rows] = await db.execute(sql);
      if(rows.length === 0) done(null, false)
      else {
        const isAuthenticated = await bcrypt.compare(password, rows[0].password);        
        if (isAuthenticated) {
          const user = UserFactory.fromDatabase(rows[0]);
          done(null, user);
        } else {
          const hash = await bcrypt.hash(password, 10);
          console.log('hash: ' + hash);
          done(null, false)
        }
      }
    })
  );
  
  // Configure Passport authenticated session persistence.
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser(async(id, cb) => {
    const sql = `SELECT * FROM accounts WHERE id = "${id}"`;
    const [rows] = await db.execute(sql);
    if (rows.length > 0) cb(null, UserFactory.fromDatabase(rows[0]));
    else cb(null, false);
  });
  
  // Configure view engine to render EJS templates.
  app.use(express.static(__dirname + '/static'));
  app.use(require('body-parser').urlencoded({ extended: true }));
  app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure basic SocketIO commands
  io.on('connection', socket => {
    console.log('a user is connected');

    socket.on('test', () => {
      console.log('test!');
    });
  });
  
  // Define routes.
  app.get('/auth/', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ user: req.user }, null, 3));
  });

  app.post('/auth/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        res.status(401);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'AUTH.INVALID' }, null, 3));  
        return res;
      }
      req.logIn(user, (err) => {
        if (err) return next(err);
        return res.redirect('/auth/');
      });
    })(req, res, next);  
  });
    
  app.get('/auth/logout', (req, res) => {
    req.logout();
    res.redirect('/auth/');
  });
  
  app.get('/auth/profile', ensureLoggedIn('/auth/'), (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ user: req.user }, null, 3));
  });

  app.get('/characters', ensureLoggedIn('/auth/'), async(req, res) => {
    const sql = `SELECT c.id, c.first_name, c.last_name, c.race as race_id, r.text as race_text
    FROM characters c
    INNER JOIN races r ON c.race = r.id;`;
    const [rows] = await db.execute(sql);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ characters: rows.map(row => ({ ...row, race: {id: row.race_id, text: row.race_text }, race_id: undefined, race_text: undefined })) }, null, 3));
  });
  
  const server = app.listen(3000);
  io.listen(server);
}

main();