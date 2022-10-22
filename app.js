const path = require('path');
const express = require('express');
const csrf = require('csurf');
const flash = require('connect-flash');

require('./util/env');
const errorController = require('./controllers/error');
const User = require('./models/user');
const { connectDB } = require('./util/database');
const { getSession } = require('./util/sessions');

const PORT = process.env.PORT || 3000;

const app = express();
const csrfProtection = csrf();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(getSession(process.env.MONGODB_URL));
// app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  const user = req.session.user;
  // if (!user) return res.redirect('/signup');
  if (!user) return next();
  User.findById(user._id)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err) => console.log(err));
});

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  // res.locals.csrfToken = req.csrfToken();
  next();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

connectDB(process.env.MONGODB_URL).then(() => {
  app.listen(PORT);
  console.log(`Server listening at port ${PORT}`);
});
