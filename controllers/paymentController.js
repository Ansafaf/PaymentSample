const db = require('../database/db');
const { v4: uuidv4 } = require('crypto');

function renderLanding(req, res) {
    res.render("landing");
}
// Render payment gateway page
function renderPaymentPage(req, res) {
    res.render('index');
}

// Generate unique transaction ID
function generateTransactionId() {
    // Generate a UUID-like transaction ID
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 15);
    return `TXN${timestamp}${randomStr}`.toUpperCase();
}

// Initiate payment
async function initiatePayment(req, res) {
    try {
        const { name, amount, paymentMethod, mobile, operator, planId } = req.body;

        // Validate input
        if (!name || !amount || !paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        if (isNaN(amount) || parseFloat(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount'
            });
        }

        // Generate transaction ID
        const transactionId = generateTransactionId();

        // Create transaction object
        const transaction = {
            id: transactionId,
            name: name.trim(),
            amount: parseFloat(amount),
            paymentMethod,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            settlementTime: null,
            // Recharge-specific fields (optional)
            mobile: mobile || null,
            operator: operator || null,
            planId: planId || null,
            rechargeStatus: null,
            rechargeTransactionId: null
        };

        // Save to database
        db.saveTransaction(transaction);

        console.log(`[Payment Initiated] Transaction ID: ${transactionId}`);
        if (mobile) {
            console.log(`[Mobile Recharge] ${operator} - ${mobile} - ₹${amount}`);
        }

        // Return transaction ID to frontend
        res.json({
            success: true,
            transactionId,
            message: 'Payment initiated successfully'
        });

    } catch (error) {
        console.error('Error initiating payment:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

module.exports = {
    renderPaymentPage,
    initiatePayment,
    renderLanding
};
