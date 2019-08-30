module.exports = {
  class: class DbAdapter {
    constructor() {
      this.db = null;
      this.result = null;
    }
  
    setDb(db) {
      this.db = db;
      return this;
    }
  
    async updateLastConnection(id) {
      await this.db.execute(`UPDATE accounts 
        SET lastConnection='${ (new Date(Date.now())).toISOString().replace('T', ' ').split('.')[0] }'
        WHERE id = ${ id };`);
      return;
    }

    async setPassword(username, hash) {
      const [{changedRows}] = await this.db.execute(`UPDATE accounts 
        SET \`password\`= "${ hash }"
        WHERE \`email\` = "${ username }" AND \`password\` = "";`);
        console.log(changedRows);
      return changedRows;
    }
  
    async getCharacters(id) {
      const [rows] = await this.db.execute(`SELECT c.id, k.text AS rank, c.firstName, c.lastName, c.sdob AS stardateOfBirth, r.text AS race
        FROM characters c
        INNER JOIN races r ON c.race = r.id
        INNER JOIN ranks k ON c.rank = k.id
        WHERE c.account = ${id} AND c.active = 1;`);
      const characters = await Promise.all(rows.map(async character => {
        const [assignments] = await this.db.execute(`SELECT p.text as \`position\`,
          s.name as \`ship\`, a.active, a.start, a.end FROM assignments a
          INNER JOIN ships s ON s.id = a.ship
          INNER JOIN positions p ON p.id = a.position
          WHERE a.character = ${character.id}
          ORDER BY a.start DESC;`);
        character.assignments = assignments;
        return character;
      }));
      return characters;
    }
  
    async createCharacter(id, c) {
      const [{insertId}] = await this.db.execute(`INSERT INTO characters (account, firstName, lastName, sdob, race, rank)
        VALUES (${ id }, '${ c.firstName }', '${ c.lastName }', '${ c.stardateOfBirth }', ${ c.race }, ${ c.rank });`);
      return insertId;
    }
  
    async changeMySelectedCharacter(id, character) {
      this.db.execute(`UPDATE accounts SET selectedCharacter = ${ character } WHERE id = ${ id }`);
      return; 
    }
  
    async getRaces() {
      const [races] = await this.db.execute(`SELECT * FROM races`);
      return races;
    }
  
    async getRanks() {
      const [ranks] = await this.db.execute(`SELECT * FROM ranks`);
      return ranks;
    }
  
    async getMyMissions(me) {
      const [missions] = await this.db.execute(`SELECT m.* FROM missions m
          INNER JOIN groups g ON g.mission = m.id
          INNER JOIN character_groups cg ON cg.group = g.id
          WHERE cg.character = ${ me }
          ORDER BY m.lastModified DESC;`);
      return missions;
    }
  
    async getMyGroupsFromMission(me, id) {
      const [groups] = await this.db.execute(`SELECT g.id, g.name FROM groups g
        INNER JOIN character_groups cg ON cg.group = g.id
        WHERE cg.character = ${ me } AND g.mission = ${ id } AND g.active = 1;`);
      return groups;
    }
  
    async getMyMessagesFromMission(me, id) {
      const [messages] = await this.db.execute(`SELECT m.id, m.character, m.message, 
        m.creationDate, m.type, mr.read FROM message_recipients mr
        INNER JOIN messages m ON m.id = mr.message
        INNER JOIN groups g on g.id = mr.group
        WHERE mr.recipient = ${ me } AND g.mission = ${ id };`);
      return messages;
    }
  
    async getMyUnreadMessagesCountFromMission(me, id) {
      const [[result]] = await this.db.execute(`SELECT COUNT(DISTINCT mr.message) as unread
        FROM groups g INNER JOIN message_recipients mr ON mr.group = g.id
        WHERE mr.read = 0 AND g.mission = ${ id } AND mr.recipient = ${ me };`);
      return result.unread;
    }
  
    async getMyMessage(me, id) {
      const [message] = await this.db.execute(`SELECT m.id, m.character, m.message, 
        m.creationDate, m.type, mr.read FROM message_recipients mr
        INNER JOIN messages m ON m.id = mr.message
        WHERE mr.recipient = ${ me } AND m.id = ${ id };`);
      return message;
    }
  
    async getParticipantsFromMission(id) {
      const [participants] = await this.db.execute(`SELECT c.id, c.firstName, c.lastName, r1.text AS race,
        r2.text AS rank, p.text as \`position\`, s.name AS ship FROM groups g 
        INNER JOIN character_groups cg ON cg.group = g.id
        INNER JOIN characters c ON c.id = cg.character
        INNER JOIN races r1 ON r1.id = c.race
        INNER JOIN ranks r2 ON r2.id = c.rank
        LEFT JOIN assignments a ON a.character = c.id AND a.active = 1
        LEFT JOIN positions p ON p.id = a.position
        LEFT JOIN ships s ON s.id = a.ship
        WHERE g.mission = ${ id };`);
      return participants;
    }
  
    async readMyMessage(me, id) {
      this.db.execute(`UPDATE message_recipients SET \`read\` = 1 
          WHERE message = ${ id } AND recipient = ${ me };`);
    }
  
    async getParticipantsFromGroup(id) {
      const [participants] = await this.db.execute(`SELECT \`group\`, \`character\` 
        FROM character_groups WHERE \`group\` = ${ id }`);
      return participants;
    }
  
    async publishMyMessage(me, message, type ) {
      const [{insertId}] = await this.db.execute(`INSERT INTO messages 
        (\`character\`, \`message\`, \`type\`) VALUES 
        (${ me }, "${ message }", ${ type });`);
      return insertId;
    }
  
    async sendMessageToParticipant(id, participant) {
      await this.db.execute(`INSERT INTO message_recipients (\`recipient\`, \`group\`, \`message\`)
        VALUES (${ participant.character }, ${ participant.group }, ${ id })`);
      return;
    }
  }
}