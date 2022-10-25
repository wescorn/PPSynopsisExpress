var express = require('express');
var router = express.Router();
var path = require('path');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/primes', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../') + '/public/primes.html');
});

router.get('/assignment2_6', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../') + '/public/assignment2_6.html');
});

module.exports = router;
