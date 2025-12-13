const express = require('express');
const router = express.Router();
const {
    renderPaymentGateway,
    processUpiPayment,
    createCashfreeOrder,
    verifyCashfreePayment,
    getTransactionStatus,
    renderPaymentSuccess,
    downloadReceipt
} = require('../controllers/paymentGatewayController.js');

// Render payment gateway page
router.get('/payment-gateway', renderPaymentGateway);

// Cashfree Order & Verify
router.post('/payment/create-order', createCashfreeOrder);
router.post('/payment/verify', verifyCashfreePayment); // Webhook
router.get('/payment/verify', verifyCashfreePayment); // Return URL redirection

// Legacy/Fallback process paths (keeping if needed)
router.post('/payment/upi', processUpiPayment);

// Get transaction status
router.get('/payment/status/:transactionId', getTransactionStatus);

// Success page
router.get('/payment/success/:transactionId', renderPaymentSuccess);

// Download receipt
router.get('/payment/receipt/:transactionId', downloadReceipt);

module.exports = router;
