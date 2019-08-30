module.exports = {
  ensureLoggedIn: () => {
    return (req, res, next) => {
      if (req.user && req.user.id > 0) {
        next();
      } else {
        res.status(401).send('Server requires authentication');
      }
    }
  }
}