class User {
  constructor() {
    this.id = 0;
    this.email = '';
    this.firstName = '';
    this.lastName = '';
    this.type = '';  
  }
}

class UserFactory {
  fromDatabase(row) {
    const user = new User();
    user.id = row.id;
    user.email = row.email;
    user.firstName = row.first_name;
    user.lastName = row.last_name;
    user.type = row.type;
    return user;
  }
}

module.exports = {
  model: User,
  factory: new UserFactory()
}