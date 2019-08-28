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
  const db = await mysql.createPool(environment.mysql);
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
    const characters = await getCharacters(req, db);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ characters }, null, 3));
  });

  app.post('/characters', ensureLoggedIn('/auth/'), async(req, res) => {
    const sql = `INSERT INTO characters (account, firstName, lastName, sdob, race, rank)
      VALUES (${req.user.id}, '${req.body.firstName}', '${req.body.lastName}',
      '${req.body.stardateOfBirth}', ${req.body.race}, ${req.body.rank});`;
    const [result] = await db.execute(sql);
    const character = await getCharacters(req, db, `AND c.id = ${result.insertId}`);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ character }, null, 3));
  });

  app.post('/auth/character', ensureLoggedIn('/auth/'), async(req, res) => {
    const sql = `UPDATE accounts 
      SET selectedCharacter = ${req.body.selectedCharacter}
      WHERE id = ${ req.user.id }`;
      await db.execute(sql);
      const user = req.user;
      req.user.selectedCharacter = req.body.selectedCharacter;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ user }, null, 3));  
  });
  
  app.get('/races', ensureLoggedIn('/auth/'), async(req, res) => {
    const [races] = await db.execute(`SELECT * FROM races`);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ races }, null, 3));
  });

  app.get('/ranks', ensureLoggedIn('/auth/'), async(req, res) => {
    const [ranks] = await db.execute(`SELECT * FROM ranks`);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ranks }, null, 3));
  });

  app.get('/missions', ensureLoggedIn('/auth/'), async(req, res) => {
    const [rows] = await db.execute(`SELECT m.* FROM missions m
      INNER JOIN groups g ON g.mission = m.id
      INNER JOIN character_groups cg ON cg.group = g.id
      WHERE cg.character = ${ req.user.selectedCharacter }
      ORDER BY m.lastModified DESC;`);
    const missions = await Promise.all(rows.map(async row => {
      const mission = missionSerializer(row);
      const [rows1] = await db.execute(`SELECT c.* FROM groups g 
        INNER JOIN character_groups cg ON cg.group = g.id
        INNER JOIN characters c ON c.id = cg.character
        WHERE g.mission = ${ mission.id };`);
      mission.participants = participantsSerializer(rows1);
      const [rows2] = await db.execute(`SELECT COUNT(DISTINCT mr.message) as unread
      FROM groups g INNER JOIN message_recipients mr ON mr.group = g.id
      WHERE mr.read = 0 AND g.mission = ${ mission.id } AND mr.recipient = ${ req.user.selectedCharacter };`);
      mission.unreadMessages = rows2[0].unread;
      return mission;
    }));
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ missions }, null, 3));
  });

  app.get('/mission/:id/participants', ensureLoggedIn('/auth/'), async(req, res) => {
    const [participants] = await db.execute(`SELECT c.id, c.firstName, c.lastName, r1.text AS race,
      r2.text AS rank, p.text as \`position\`, s.name AS ship FROM groups g 
      INNER JOIN character_groups cg ON cg.group = g.id
      INNER JOIN characters c ON c.id = cg.character
      INNER JOIN races r1 ON r1.id = c.race
      INNER JOIN ranks r2 ON r2.id = c.rank
      LEFT JOIN assignments a ON a.character = c.id AND a.active = 1
      LEFT JOIN positions p ON p.id = a.position
      LEFT JOIN ships s ON s.id = a.ship
      WHERE g.mission = ${ req.params.id };`);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ participants }, null, 3));
  });

  app.get('/mission/:id/groups', ensureLoggedIn('/auth/'), async(req, res) => {
    const [groups] = await db.execute(`SELECT g.id, g.name FROM groups g
    INNER JOIN character_groups cg ON cg.group = g.id
    WHERE cg.character = ${ req.user.selectedCharacter } AND g.mission = ${ req.params.id } AND g.active = 1;`);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ groups }, null, 3));
  });

  app.get('/mission/:id/messages', ensureLoggedIn('/auth/'), async(req, res) => {
    const [messages] = await db.execute(`SELECT m.id, m.character, m.message, 
      m.creationDate, m.type, mr.read FROM message_recipients mr
      INNER JOIN messages m ON m.id = mr.message
      INNER JOIN groups g on g.id = mr.group
      WHERE mr.recipient = ${ req.user.selectedCharacter } AND g.mission = ${ req.params.id };`);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ messages }, null, 3));
  });

  app.get('/mission/:mission/message/:message/read', ensureLoggedIn('/auth/'), async(req, res) => {
    await db.execute(`UPDATE message_recipients SET \`read\` = 1 
      WHERE message = ${ req.params.message }
      AND recipient = ${ req.user.selectedCharacter };`);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'read' }, null, 3));
  });

  app.post('/mission/:mission/message/', ensureLoggedIn('/auth/'), async(req, res) => {
    const [participants] = await db.execute(`SELECT \`character\` FROM character_groups
      WHERE \`group\` = ${ req.body.group }`);
    const [{insertId}] = await db.execute(`INSERT INTO messages (\`character\`, \`message\`, \`type\`)
      VALUES (${ req.user.id }, "${ req.body.message }", ${ req.body.type });`);
    await Promise.all(participants.map(async p => {
      const sql = `INSERT INTO message_recipients (\`recipient\`, \`group\`, \`message\`)
        VALUES (${ p.character }, ${ req.body.group }, ${ insertId })`;
      await db.execute(sql);
      return;
    }));
    const [message] = await db.execute(`SELECT m.id, m.character, m.message, 
      m.creationDate, m.type, mr.read FROM message_recipients mr
      INNER JOIN messages m ON m.id = mr.message
      WHERE mr.recipient = ${ req.user.selectedCharacter } AND m.id = ${ insertId };`);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message }, null, 3));
  });

  const server = app.listen(3000);
  io.listen(server);
}

const getCharacters = async(req, db, condition = '') => {
  const sql = `SELECT c.id, k.id as rank_id, k.text as rank_text, c.firstName, c.lastName, c.sdob, c.race as race_id, r.text as race_text
    FROM characters c
    INNER JOIN races r ON c.race = r.id
    INNER JOIN ranks k ON c.rank = k.id
    WHERE c.account = ${req.user.id} ${condition} AND c.active = 1;`;
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
  return characters;
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

const participantsSerializer = rows => {
  const participants = [];
  rows.forEach(row => {
    participants.push({
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
    });
  });
  return participants;
}

const missionSerializer = row => ({
  id: row.id,
  name: row.name,
  description: row.description,
  active: row.active,
  lastModified: row.lastModified,
  unreadMessages: 0,
  participants: [],
});

main();