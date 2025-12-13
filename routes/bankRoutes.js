const express = require('express');
const router = express.Router();
const bankController = require('../controllers/bankController');

// Bank settlement API
router.post('/api/bank/settlement', bankController.settlementAPI);

module.exports = router;
