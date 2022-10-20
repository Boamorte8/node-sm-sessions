const path = require('path');
const express = require('express');

require('./util/env');
const errorController = require('./controllers/error');
const User = require('./models/user');
const { connectDB } = require('./util/database');

const PORT = process.env.PORT || 3000;

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

const USER_ID = '634f57ca031018319f30bde8';

app.use((req, res, next) => {
  User.findById(USER_ID)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err) => console.log(err));
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

connectDB(process.env.MONGODB_URL).then(() => {
  User.findOne()
    .then((user) => {
      if (!user) {
        const user = new User({
          name: 'Esteban',
          email: 'esteban@test.com',
          cart: {
            items: [],
          },
        });
        user.save();
      }
      app.listen(PORT);
      console.log(`Server listening at port ${PORT}`);
    })
    .catch((err) => console.log(err));
});