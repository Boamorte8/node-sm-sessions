const mongoose = require('mongoose');

exports.connectDB = (url) =>
  mongoose
    .connect(url)
    .then(() => console.log('Database connection established'))
    .catch((err) => console.log(err));
