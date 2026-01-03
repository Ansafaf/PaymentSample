const express = require('express');
const router = express.Router();
const {
    renderPaymentGateway,
    processUpiPayment,
    createCashfreeOrder,
    verifyCashfreePayment,
    getTransactionStatus,
    renderPaymentSuccess,
    downloadReceipt,
    verifyManualPayment
} = require('../controllers/paymentGatewayController.js');

// Render payment gateway page
router.get('/payment-gateway', renderPaymentGateway);

// Legacy/Fallback process paths (keeping if needed)

router.post('/payment/upi', processUpiPayment);
router.post('/payment/verify-manual', verifyManualPayment);

// Get transaction status
router.get('/payment/status/:transactionId', getTransactionStatus);

// Success page
router.get('/payment/success/:transactionId', renderPaymentSuccess);

// Download receipt
router.get('/payment/receipt/:transactionId', downloadReceipt);

module.exports = router;
