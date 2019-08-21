class Models {
  constructor(mongoose) {
    this.user = require('./user')(mongoose);
    this.message = require('./message')(mongoose);
    this.character = require('./character')(mongoose);
  }
}

module.exports = (mongoose) => {
  return new Models(mongoose);
}