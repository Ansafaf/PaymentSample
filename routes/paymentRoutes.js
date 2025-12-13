const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const successController = require('../controllers/successController');

// Render landing page
router.get('/', paymentController.renderLanding);

// Render mobile recharge page
router.get('/recharge', paymentController.renderPaymentPage);

// Render general payment page
router.get('/payment', (req, res) => {
    res.render('payment');
});

// Initiate payment
router.post('/api/payments/initiate', paymentController.initiatePayment);

// Success page
router.get('/payment/success/:transactionId', successController.renderSuccessPage);

module.exports = router;
