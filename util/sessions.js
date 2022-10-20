const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

exports.getSession = (uri) => {
  const store = new MongoDBStore({
    uri,
    collection: 'sessions',
  });
  return session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store,
  });
};
