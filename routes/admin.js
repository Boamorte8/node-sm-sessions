const { body } = require('express-validator');

const express = require('express');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post(
  '/add-product',
  isAuth,
  [
    body('title', 'Please enter at least 6 characters')
      .isString()
      .isLength({ min: 6 })
      .trim(),
    // body('imageUrl', 'Please enter a valid url').isURL().trim(),
    body('price', 'Please enter a valid price').isNumeric().trim(),
    body('description', 'Please enter at least 12 characters')
      .isString()
      .isLength({ min: 12, max: 400 })
      .trim(),
  ],
  adminController.postAddProduct
);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post(
  '/edit-product',
  [
    body('title', 'Please enter at least 6 characters')
      .isString()
      .isLength({ min: 6 })
      .trim(),
    // body('imageUrl', 'Please enter a valid url').isURL().trim(),
    body('price', 'Please enter a valid price').isNumeric().trim(),
    body('description', 'Please enter at least 12 characters')
      .isString()
      .isLength({ min: 12, max: 400 })
      .trim(),
  ],
  isAuth,
  adminController.postEditProduct
);

router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;
