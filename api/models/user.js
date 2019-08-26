class User {
  constructor() {
    this.id = 0;
    this.email = '';
    this.firstName = '';
    this.lastName = '';
    this.type = '';
    this.selectedCharacter = '';
  }
}

class UserFactory {
  fromDatabase(row) {
    const user = new User();
    user.id = row.id;
    user.email = row.email;
    user.firstName = row.firstName;
    user.lastName = row.lastName;
    user.type = row.type;
    user.selectedCharacter = row.selectedCharacter;
    return user;
  }
}

module.exports = {
  model: User,
  factory: new UserFactory()
}