var express = require('express');
var router = express.Router();
var { list, filter, oldProduct, products, search } = require("../../controller/v1/catalog");
router.all('/list', list);
router.all('/filters', filter);
router.all('/products_old', oldProduct);
router.all('/products', products);
router.all('/search', search);
module.exports = router;
