const { compare, hash } = require('bcrypt');

const { SALT } = require('../constants/salt');
const User = require('../models/user');

exports.getLogin = (req, res) => {
  // Without library
  // console.log(req.get('Cookie'));
  // With library
  // console.log(req.cookies);
  let message = req.flash('error');
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message.length > 0 ? message : null,
  });
};

exports.postLogin = (req, res) => {
  const { body, session } = req;
  const { email, password } = body;
  if (!!email && !!password) {
    User.findOne({ email })
      .then((userByEmail) => {
        if (!userByEmail) {
          req.flash('error', 'Invalid email or password');
          return res.redirect('/login');
        }
        compare(password, userByEmail.password)
          .then((matchPassword) => {
            if (!matchPassword) {
              req.flash('error', 'Invalid email or password');
              return res.redirect('/login');
            }

            session.user = userByEmail;
            session.isLoggedIn = true;
            return session.save(() => {
              res.redirect('/');
            });
          })
          .catch((err) => {
            console.log(err);
            res.redirect('/login');
          });
      })
      .catch((err) => console.log(err));
  } else {
    req.flash('error', 'Invalid email or password');
    res.redirect('/login');
  }
};

exports.postLogout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};

exports.getSignup = (req, res) => {
  let message = req.flash('error');
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message.length > 0 ? message : null,
  });
};

exports.postSignup = (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  if (!!name && !!email && !!password && password === confirmPassword) {
    User.findOne({ email })
      .then((userDoc) => {
        if (!!userDoc) {
          req.flash('error', 'Email already in use');
          return res.redirect('/signup');
        }
        return hash(password, SALT)
          .then((hashedPassword) => {
            const user = new User({
              name,
              email,
              password: hashedPassword,
              cart: {
                items: [],
              },
            });
            return user.save();
          })
          .then((result) => {
            res.redirect('/login');
          });
      })
      .catch((err) => console.log(err));
  } else {
    req.flash('error', 'All fields are required');
    res.redirect('/signup');
  }
};
