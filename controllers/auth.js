const crypto = require('crypto');
const { compare, hash } = require('bcrypt');
const nodemailer = require('nodemailer');
// const sendgridTransport = require('nodemailer-sendgrid-transport');

const { SALT } = require('../constants/salt');
const User = require('../models/user');
const user = require('../models/user');

const transporter = nodemailer.createTransport(
  // With mailtrap
  {
    host: 'smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: '266a11247b08da',
      pass: '4c28dbd3540dfd',
    },
  }
  // With SendGrid
  // sendgridTransport({
  //   auth: {
  //     api_key: process.env.SENDGRID_KEY,
  //   },
  // })
);

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
            return transporter.sendMail({
              to: email,
              from: 'shop@node-complete.com',
              subject: 'Signup successful!',
              html: '<h1>You successfully signed up!</h1>',
            });
          })
          .catch((err) => console.log(err));
      })
      .catch((err) => console.log(err));
  } else {
    req.flash('error', 'All fields are required');
    res.redirect('/signup');
  }
};

exports.getReset = (req, res) => {
  let message = req.flash('error');
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message.length > 0 ? message : null,
  });
};

exports.postReset = (req, res) => {
  const { email } = req.body;
  if (!!email) {
    User.findOne({ email })
      .then((userDoc) => {
        if (!userDoc) {
          req.flash('error', 'No account with that email found');
          return res.redirect('/reset');
        }
        crypto.randomBytes(32, (err, buf) => {
          if (err) {
            req.flash('error', 'Error sending email');
            return res.redirect('/reset');
          }
          const token = buf.toString('hex');
          userDoc.resetToken = token;
          userDoc.resetTokenExpiration = Date.now() + 3600000;
          userDoc.save().then((result) => {
            res.redirect('/');
            return transporter.sendMail({
              to: email,
              from: 'shop@node-complete.com',
              subject: 'Password reset',
              html: `
                <p>You requested a password reset</p>
                <p>Click this <a href="http://localhost:3000/new-password/${token}">link</a> to set a new password.</p>
              `,
            });
          });
        });
      })
      .catch((err) => console.log(err));
  } else {
    req.flash('error', 'Email is required');
    res.redirect('/reset');
  }
};

exports.getNewPassword = (req, res) => {
  const { token } = req.params;
  if (!!token) {
    User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    })
      .then((userDoc) => {
        if (!!userDoc) {
          let message = req.flash('error');
          res.render('auth/new-password', {
            path: '/new-password',
            pageTitle: 'New Password',
            errorMessage: message.length > 0 ? message : null,
            userId: userDoc._id.toString(),
            token,
          });
        } else {
          req.flash('error', 'Invalid request');
          res.redirect('/reset');
        }
      })
      .catch((err) => console.log(err));
  } else {
    req.flash('error', 'Invalid request');
    res.redirect('/reset');
  }
};

exports.postNewPassword = (req, res) => {
  const { password, confirmPassword, userId, token } = req.body;
  if (
    !!password &&
    !!confirmPassword &&
    !!userId &&
    !!token &&
    password === confirmPassword
  ) {
    User.findOne({
      _id: userId,
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    })
      .then((userDoc) => {
        if (!userDoc) {
          req.flash('error', 'Invalid request');
          return res.redirect('/reset');
        }
        return hash(password, SALT)
          .then((hashedPassword) => {
            userDoc.password = hashedPassword;
            userDoc.resetToken = undefined;
            userDoc.resetTokenExpiration = undefined;
            return userDoc.save();
          })
          .then((result) => {
            res.redirect('/login');
            return transporter.sendMail({
              to: userDoc.email,
              from: 'shop@node-complete.com',
              subject: 'Reset password successful!',
              html: '<h1>You successfully reset your password!</h1>',
            });
          })
          .catch((err) => console.log(err));
      })
      .catch((err) => console.log(err));
  } else {
    if (!userId || !token) {
      req.flash('error', 'Invalid request');
      res.redirect('/reset');
    } else {
      req.flash('error', 'Password and Confirm Password are required');
      res.redirect(`/new-password`);
    }
  }
};
