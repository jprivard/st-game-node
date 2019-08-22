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
const cors = require('cors')

async function main() {
  // Configure MySQL Connection
  const db = await mysql.createConnection(environment.mysql);
  db.timeout = 0;
  
  // Configure the local strategy for use by Passport.
  passport.use(new Strategy(
    async(username, password, done) => {
      const sql = `SELECT * FROM accounts WHERE email = "${username}" AND active = 1`;
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
  app.use(cors());

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
      req.logIn(user, async(err) => {
        if (err) return next(err);
        const sql = `UPDATE accounts SET lastConnection='${ (new Date(Date.now())).toISOString().replace('T', ' ').split('.')[0] }' WHERE id = ${ user.id };`;
        await db.execute(sql);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ user: user }, null, 3));    
      });
    })(req, res, next);  
  });
    
  app.get('/auth/logout', (req, res) => {
    req.logout();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ }, null, 3));    
});
  
  app.get('/auth/profile', ensureLoggedIn('/auth/'), (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ user: req.user }, null, 3));
  });

  app.get('/characters', ensureLoggedIn('/auth/'), async(req, res) => {
    const sql = `SELECT c.id, k.id as rank_id, k.text as rank_text, c.firstName, c.lastName, c.sdob, c.race as race_id, r.text as race_text
    FROM characters c
    INNER JOIN races r ON c.race = r.id
    INNER JOIN ranks k ON c.rank = k.id
    WHERE c.account = ${req.user.id} AND c.active = 1;`;
    const [rows] = await db.execute(sql);
    const characters = await Promise.all(rows.map(async row => {
      const character = characterSerializer(row);
      const sql = `SELECT p.text, s.name, a.active, a.start, a.end FROM assignments a
      INNER JOIN ships s ON s.id = a.ship
      INNER JOIN positions p ON p.id = a.position
      WHERE a.character = ${character.id}
      ORDER BY a.start DESC;`;
      const [rows] = await db.execute(sql);
      character.assignments = assignmentsSerializer(rows);
      return character;
    }));
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ characters }, null, 3));
  });
  
  const server = app.listen(3000);
  io.listen(server);
}

const assignmentsSerializer = rows => {
  const assignments =  { active: [], past: [] };
  rows.forEach(row => {
    assignments[row.active ? 'active' : 'past'].push({
      position: row.text,
      ship: row.name,
      start: row.start,
      end: row.end
    });
  });
  return assignments;
}

const characterSerializer = row => ({
  id: row.id,
  rank: row.rank_text,
  firstName: row.firstName,
  lastName: row.lastName,
  race: row.race_text,
  stardateOfBirth: row.sdob,
  assignments : []
});

main();