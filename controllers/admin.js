const { validationResult } = require('express-validator');

const { deleteFile } = require('../util/fileHandler');
const Product = require('../models/product');

exports.getAddProduct = (req, res) => {
  let message = req.flash('error');
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    errorMessage: message.length > 0 ? message : null,
    hasErrors: false,
    validationErrors: [],
  });
};

exports.postAddProduct = (req, res, next) => {
  const { title, price, description } = req.body;
  const image = req.file;

  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      errorMessage: 'Attached file is not a valid image file',
      product: { title, price, description },
      validationErrors: [],
      hasErrors: true,
    });
  }

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      errorMessage: errors.array()[0]?.msg,
      product: { title, price, description },
      validationErrors: errors.array(),
      hasErrors: true,
    });
  }

  const imageUrl = image.path;

  const product = new Product({
    title,
    price,
    description,
    imageUrl,
    userId: req.session.user,
  });
  product
    .save()
    .then(() => {
      res.redirect('/admin/products');
    })
    .catch((err) => {
      // A way to handle errors
      // return res.status(500).render('admin/edit-product', {
      //   pageTitle: 'Add Product',
      //   path: '/admin/add-product',
      //   editing: false,
      //   errorMessage: 'Saving product has failed, please try again',
      //   product: { title, imageUrl, price, description },
      //   validationErrors: [],
      //   hasErrors: true,
      // });
      // Another way
      // res.redirect('/500');
      // Another way
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = (req, res) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return res.redirect('/');
      }
      let message = req.flash('error');
      console.log(product);
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product,
        errorMessage: message.length > 0 ? message : null,
        validationErrors: [],
        hasErrors: false,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const { title, price, description, productId } = req.body;
  const image = req.file;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      errorMessage: errors.array()[0]?.msg,
      product: {
        title,
        imageUrl: image,
        price,
        description,
        _id: productId,
      },
      hasErrors: true,
      validationErrors: errors.array(),
    });
  }

  Product.findById(productId)
    .then((product) => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect('/');
      }
      if (image) {
        deleteFile(product.imageUrl);
        product.imageUrl = image.path;
      }
      product.title = title;
      product.price = price;
      product.description = description;
      return product.save().then((result) => {
        res.redirect('/admin/products');
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    // .select('title price -_id')
    // .populate('userId', 'name')
    .then((products) => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      deleteFile(product.imageUrl);
      return Product.deleteOne({ _id: prodId, userId: req.user._id });
    })
    .then(() => {
      console.log('DESTROYED PRODUCT');
      deleteFile(product.imageUrl);
      res.redirect('/admin/products');
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
