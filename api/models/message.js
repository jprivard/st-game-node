module.exports = (mongoose) => {
  return mongoose.model('Message', {
    name : String,
    message : String
  });
};