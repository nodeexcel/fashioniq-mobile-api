var express = require('express');
var router = express.Router();
const { feedback } = require('../../controller/v1/feedback');

router.all('/add', feedback);

module.exports = router;
