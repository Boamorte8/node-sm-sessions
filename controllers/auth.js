const User = require('../models/user');

exports.getLogin = (req, res) => {
  // Without library
  // console.log(req.get('Cookie'));
  // With library
  // console.log(req.cookies);
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: false,
  });
};

exports.postLogin = (req, res) => {
  User.find({ email: req.body.email })
    .then((users) => {
      if (users.length > 0) {
        req.session.user = users[0];
        req.session.isLoggedIn = true;
        res.redirect('/');
      } else {
        res.redirect('/login');
      }
    })
    .catch((err) => console.log(err));
};
