const Strategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const UserFactory = require('./models/user').factory;
const environment = require('./../environments/environment.local');

module.exports = {
  class: 
  class Controller {
    constructor(adapter, passport) {
      this.adapter = adapter;
      this.passport = passport;
      this.setupPassport();
    }
  
    setupPassport() {
      this.passport.use(new Strategy(
        async(username, password, done) => {
          const db = await mysql.createConnection(environment.mysql);
          const sql = `SELECT * FROM accounts WHERE email = "${username}" AND active = 1`;
          const [rows] = await db.execute(sql);
          db.end();
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
      this.passport.serializeUser((user, done) => {
        done(null, user.id);
      });
      this.passport.deserializeUser(async(id, cb) => {
        const db = await mysql.createConnection(environment.mysql);
        const sql = `SELECT * FROM accounts WHERE id = "${id}"`;
        const [rows] = await db.execute(sql);
        db.end();
        if (rows.length > 0) cb(null, UserFactory.fromDatabase(rows[0]));
        else cb(null, false);
      });
    }

    auth() {
      return (req, res, next) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ user: req.user }, null, 3));
        next();
      }
    }
  
    login() {
      return (req, res, next) => {
        this.passport.authenticate('local', (err, user, info) => {
          if (err) return next(err);
          if (!user) {
            res.status(401);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'AUTH.INVALID' }, null, 3));  
            next();
            return res;
          }
          req.logIn(user, async(err) => {
            if (err) return next(err);
            await this.adapter.setDb(req.db).updateLastConnection(user.id);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ user: user }, null, 3));
            next();
          });
        })(req, res, next);
      }
    }
  
    logout() {
      return (req, res, next) => {
        req.logout();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ }, null, 3)); 
        next();
      }
    } 
  
    setPassword() {
      return async(req, res, next) => {
        const hash = await bcrypt.hash(req.body.password, 10);
        const changedRows = await this.adapter.setDb(req.db).setPassword(req.body.username, hash);
        res.setHeader('Content-Type', 'application/json');
        if (changedRows === 0) {
          res.status(404);
          res.end(JSON.stringify({ error: 'AUTH.CREATE_INVALID' }, null, 3));  
        } else {
          res.end(JSON.stringify({ message: 'success'}, null, 3));  
        }
        next();
      };
    }
  
    getCharacters() {
      return async(req, res, next) => {
        const characters = await this.adapter.setDb(req.db).getCharacters(req.user.id);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ characters }, null, 3));
        next();
      };
    }
  
    createCharacter() {
      return async(req, res, next) => {
        this.adapter.setDb(req.db)
        const id = await this.adapter.createCharacter(req.user.id, req.body);
        let characters = await this.adapter.getCharacters(req.user.id);
        characters = characters.filter(c => c.id === id);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ characters }, null, 3));
        next();
      };
    }
  
    selectCharacter() {
      return async(req, res, next) => {
        // TODO: Check if the character actually belongs to the account
        await this.adapter.setDb(req.db).changeMySelectedCharacter(req.user.id, req.body.selectedCharacter);
        req.user.selectedCharacter = req.body.selectedCharacter;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ user: req.user }, null, 3));
        next();
      };
    }
  
    getRaces() {
      return async(req, res, next) => {
        const races = await this.adapter.setDb(req.db).getRaces();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ races }, null, 3));
        next();
      };
    }
  
    getRanks() {
      return async(req, res, next) => {
        const ranks = await this.adapter.setDb(req.db).getRanks();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ranks }, null, 3));
        next();
      };
    }
  
    getMissions() {
      return async(req, res, next) => {
        this.adapter.setDb(req.db);
        const incompleteMissions = await this.adapter.getMyMissions(req.user.selectedCharacter);
        const missions = await Promise.all(incompleteMissions.map(async mission => {
          mission.participants = await this.adapter.getParticipantsFromMission(mission.id);
          mission.unreadMessages = await this.adapter.getMyUnreadMessagesCountFromMission(req.user.selectedCharacter, mission.id);
          return mission;
        }));
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ missions }, null, 3));
        next();
      };
    }
  
    getParticipants() {
      return async (req, res, next) => {
        const participants = await this.adapter.setDb(req.db).getParticipantsFromMission(req.params.id);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ participants }, null, 3));
        next();
      };
    }
  
    getGroups() {
      return async(req, res, next) => {
        const groups = await this.adapter.setDb(req.db).getMyGroupsFromMission(req.user.selectedCharacter, req.params.id);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ groups }, null, 3));
        next();
      };
    }
  
    getMessages() {
      return async(req, res, next) => {
        const messages = await this.adapter.setDb(req.db).getMyMessagesFromMission(req.user.selectedCharacter, req.params.id);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ messages }, null, 3));
        next();
      };
    }
  
    readMessage() {
      return async(req, res, next) => {
        await this.adapter.setDb(req.db).readMyMessage(req.user.selectedCharacter, req.params.message);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'read' }, null, 3));
        next();
      };
    }
  
    publishMessage() {
      return async(req, res, next) => {
        this.adapter.setDb(req.db);
        // TODO: Check if the character is part of the group before publishing
        const participants = await this.adapter.getParticipantsFromGroup(req.body.group);
        const insertId = await this.adapter.publishMyMessage(req.user.selectedCharacter, req.body.message, req.body.type);
        await Promise.all(participants.map(async participant => {
          await this.adapter.sendMessageToParticipant(insertId, participant);
          return;
        }));
        const message = await this.adapter.getMyMessage(req.user.selectedCharacter, insertId);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message }, null, 3));
        next();
      };
    }
  }
}