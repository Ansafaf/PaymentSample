const express = require('express');
const router = express.Router();
const rechargeController = require('../controllers/rechargeController');

// Detect operator from mobile number
router.get('/api/recharge/operator/:mobile', rechargeController.detectOperatorAPI);

// Get recharge plans for operator
router.get('/api/recharge/plans/:operator', rechargeController.getPlansAPI);

// Execute recharge
router.post('/api/recharge/execute', rechargeController.executeRechargeAPI);

module.exports = router;
