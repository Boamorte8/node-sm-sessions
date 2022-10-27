const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');

exports.getProducts = (req, res) => {
  // console.log(products);
  Product.find()
    .then((products) => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res) => {
  Product.find()
    .then((products) => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res) => {
  req.user
    .populate('cart.items.productId')
    .then((user) => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then(() => {
      res.redirect('/cart');
    });
};

exports.postCartDeleteProduct = (req, res) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(() => {
      res.redirect('/cart');
    })
    .catch((err) => console.log(err));
};

exports.postOrder = (req, res) => {
  const loggedUser = req.user;
  loggedUser
    .populate('cart.items.productId')
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          name: loggedUser.name,
          userId: loggedUser,
        },
        products: products,
      });
      return order.save();
    })
    .then(() => {
      return loggedUser.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res) => {
  const { user } = req;
  Order.find({ 'user.userId': user._id })
    .then((orders) => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const { orderId } = req.params;
  Order.findById(orderId)
    .then((order) => {
      if (!order) return next(new Error('No order found.'));

      if (order.user.userId.toString() !== req.user._id.toString())
        return next(new Error('Unauthorized'));

      const invoiceName = `invoice-${orderId}.pdf`;
      const invoicePath = path.join(
        __dirname,
        '../data',
        'invoices',
        invoiceName
      );

      const pdfDoc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${invoiceName}"`
      );
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text('Invoice', { underline: true });
      pdfDoc.text('------------------------------------------------------');

      let totalPrice = 0;
      order.products.forEach(({ product, quantity }) => {
        totalPrice += quantity * product.price;
        pdfDoc
          .fontSize(16)
          .text(`${product.title} - ${quantity} x $${product.price}`);
      });
      pdfDoc.text('-----------------------------------------------------');
      pdfDoc
        .fontSize(18)
        .text(`Total Price: $${totalPrice}`, { stroke: true, fill: true });

      pdfDoc.end();

      // const file = fs.createReadStream(invoicePath);
      // file.pipe(res);

      // This way is not good for big files and a lot of requests
      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) return next(err);

      //   res.setHeader('Content-Type', 'application/pdf');
      //   res.setHeader(
      //     'Content-Disposition',
      //     `attachment; filename="${invoiceName}"`
      //   );
      //   res.send(data);
      // });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
