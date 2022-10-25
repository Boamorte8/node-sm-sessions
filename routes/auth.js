const express = require('express');
const { body, check } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);

router.post(
  '/login',
  [
    check('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((user) => {
          if (!user) return Promise.reject('Invalid email or password');
        });
      })
      .normalizeEmail(),
    body('password', 'Invalid email or password')
      .isLength({ min: 6 })
      .isAlphanumeric()
      .trim(),
  ],
  authController.postLogin
);

router.post('/logout', authController.postLogout);

router.get('/signup', authController.getSignup);

router.post(
  '/signup',
  [
    check('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .custom((value, { req }) => {
        // if (value === 'test@example.com') {
        //   throw new Error('This email address is forbidden.');
        // }
        // return true;
        return User.findOne({ email: value }).then((user) => {
          if (!!user) {
            return Promise.reject('Email already in use');
          }
        });
      })
      .normalizeEmail(),
    body('name', 'Please enter a name with at least 2 characters').isLength({
      min: 2,
    }),
    body(
      'password',
      'Please enter a password with only numbers and text, and at least 6 characters'
    )
      .isLength({ min: 6 })
      .isAlphanumeric()
      .trim(),
    body('confirmPassword')
      .trim()
      .custom((value, { req }) => {
        console.log(value, req.body.password);
        if (value !== req.body.password) {
          throw new Error('Password and Confirm Password must be the same.');
        }
        return true;
      }),
  ],
  authController.postSignup
);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/new-password/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
