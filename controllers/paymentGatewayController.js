const Transaction = require('../models/Transaction');
const owner = require('../config/Ownerconfig');
const axios = require('axios');

const { Cashfree } = require('cashfree-pg');

Cashfree.XClientId = owner.cashfreeAppId;
Cashfree.XClientSecret = owner.cashfreeSecretKey;

// Fix: Handle Environment Enum availability
if (Cashfree.Environment) {
    Cashfree.XEnvironment = Cashfree.Environment[owner.cashfreeEnv === 'PROD' ? 'PRODUCTION' : 'SANDBOX'];
} else {
    // Fallback: Try to use string or Sandbox default
    Cashfree.XEnvironment = Cashfree.Environment ? Cashfree.Environment.SANDBOX : "SANDBOX";
}

try {
    // Attempt to access Environment from the module if missing on Class
    if (!Cashfree.Environment) {
        const lib = require('cashfree-pg');
        if (lib.CFEnvironment) {
            Cashfree.XEnvironment = owner.cashfreeEnv === 'PROD'
                ? lib.CFEnvironment.PRODUCTION
                : lib.CFEnvironment.SANDBOX;
        }
    }
} catch (e) {
    console.error("Error setting Cashfree Environment:", e);
}

// Render payment gateway page
exports.renderPaymentGateway = async (req, res) => {
    try {
        const { amount, orderId, description, type } = req.query;

        const safeOrderId = orderId || `ORD${Date.now()}`;
        const safeDescription = description || 'Payment';

        res.render('paymentGateway', {
            amount: amount || 299,
            orderId: safeOrderId,
            description: safeDescription,
            type: type || 'general',
            title: 'Payment Gateway',
            upiId: owner.upiId, // For display if needed
            ownerName: owner.name,
            cashfreeEnv: owner.cashfreeEnv // Pass Env to frontend if needed
        });
    } catch (error) {
        console.error('Error rendering payment gateway:', error);
        res.status(500).send('Error loading payment page');
    }
};

// NEW: Generate UPI QR Code endpoint
exports.generateUpiQr = async (req, res) => {
    try {
        const { amount, orderId } = req.query;

        const payeeAddress = owner.upiId;
        const payeeName = encodeURIComponent(owner.name);

        let qrData = `upi://pay?pa=${payeeAddress}&pn=${payeeName}&cu=INR&mode=02`;

        if (amount && parseFloat(amount) <= 100000) {
            qrData += `&am=${parseFloat(amount).toFixed(2)}`;
        }

        const QRCode = require('qrcode');

        const qrImage = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            width: 300,
            margin: 2
        });

        res.json({
            success: true,
            qrImage,
            upiString: qrData,
            note: 'Scan with any UPI app'
        });
    } catch (error) {
        console.error('QR generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate QR code'
        });
    }
};

// NEW: Verify UPI ID before payment
exports.verifyUpiId = async (req, res) => {
    try {
        const { upiId } = req.body;
        const upiRegex = /^[\w.-]+@[\w.-]+$/;

        if (!upiRegex.test(upiId)) {
            return res.json({
                success: false,
                message: 'Invalid UPI ID format'
            });
        }

        const merchantPatterns = [
            /@merchant\./i,
            /@business\./i,
            /\.merchant@/i,
            /@paytm/i,
            /@razor/i
        ];

        const isMerchantUpi = merchantPatterns.some(pattern => pattern.test(upiId));

        res.json({
            success: true,
            valid: true,
            isMerchant: isMerchantUpi,
            warning: isMerchantUpi ? 'This appears to be a merchant UPI ID' : null
        });

    } catch (error) {
        console.error('UPI verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Verification failed'
        });
    }
};

// Create Cashfree Order
exports.createCashfreeOrder = async (req, res) => {
    try {
        const { amount, method, orderId: passedOrderId, idempotencyKey } = req.body;

        // Idempotency Check
        if (idempotencyKey) {
            const existingTxn = await Transaction.findOne({ idempotencyKey });
            if (existingTxn) {
                // If we have a session ID already, return it
                if (existingTxn.paymentDetails && existingTxn.paymentDetails.payment_session_id) {
                    return res.json({
                        success: true,
                        payment_session_id: existingTxn.paymentDetails.payment_session_id,
                        order_id: existingTxn.orderId,
                        message: "Retrieved existing session (Idempotent)"
                    });
                }
            }
        }

        if (!amount || isNaN(Number(amount))) return res.status(400).json({ success: false, message: 'Invalid amount' });

        // Select Credentials (Env > Fallback Legacy)
        const isProd = process.env.NODE_ENV === 'production';
        let appId, secretKey, baseUrl;

        if (process.env.TEST_APP_ID || process.env.PROD_APP_ID) {
            appId = isProd ? process.env.PROD_APP_ID : process.env.TEST_APP_ID;
            secretKey = isProd ? process.env.PROD_SECRET_KEY : process.env.TEST_SECRET_KEY;
            baseUrl = isProd ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
        } else {
            // Fallback to legacy config
            appId = owner.cashfreeAppId;
            secretKey = owner.cashfreeSecretKey;
            baseUrl = owner.cashfreeEnv === 'PROD' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
            console.warn("Using Legacy Config (owner.js) - Please migrate to .env for security");
        }

        if (!appId || !secretKey) {
            console.error("Missing Cashfree Credentials");
            return res.status(500).json({ success: false, message: 'Payment gateway configuration error' });
        }

        const orderId = passedOrderId || `ORD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        // Create Transaction Record FIRST (Pending)
        const newTxn = await Transaction.findOneAndUpdate(
            { orderId },
            {
                $set: {
                    amount: Number(amount),
                    paymentMethod: method ? method.toUpperCase() : 'GENERAL',
                    description: 'Cashfree Payment Request',
                    status: 'pending',
                    idempotencyKey: idempotencyKey || null,
                    customerInfo: {
                        name: req.body.customerName || "Customer",
                        phone: req.body.customerPhone || "9999999999",
                        email: req.body.customerEmail || "customer@example.com"
                    }
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Map frontend method to Cashfree method codes
        let methodCode = "";
        const m = method ? method.toLowerCase() : "";
        if (m === 'upi') methodCode = "upi";
        else if (m === 'card') methodCode = "cc,dc";
        else if (m === 'netbanking') methodCode = "nb";
        else if (m === 'wallet') methodCode = "app";

        const body = {
            order_amount: Number(amount),
            order_currency: "INR",
            order_id: orderId,
            customer_details: {
                customer_id: "cust_" + (req.user ? req.user._id : Date.now()),
                customer_phone: newTxn.customerInfo.phone,
                customer_name: newTxn.customerInfo.name,
                customer_email: newTxn.customerInfo.email
            },
            order_meta: {
                return_url: `${req.protocol}://${req.get('host')}/payment/verify?order_id=${orderId}`
            }
        };

        if (methodCode) {
            body.order_meta.payment_methods = methodCode;
        }

        const headers = {
            'Content-Type': 'application/json',
            'x-client-id': appId,
            'x-client-secret': secretKey,
            'x-api-version': '2022-09-01'
        };

        const cfResp = await axios.post(`${baseUrl}/orders`, body, { headers, timeout: 15000 });
        const data = cfResp.data;

        if (!data || !data.payment_session_id) {
            throw new Error('Invalid response from Gateway - No Session ID');
        }

        // Update Transaction with Session ID
        await Transaction.findOneAndUpdate(
            { orderId },
            {
                $set: {
                    'paymentDetails.payment_session_id': data.payment_session_id,
                    'paymentDetails.cf_order_id': data.cf_order_id,
                    gatewayPaymentId: data.cf_order_id,
                    gatewayStatus: data.order_status
                }
            }
        );

        // Return ONLY what frontend needs
        return res.json({
            success: true,
            payment_session_id: data.payment_session_id,
            order_id: orderId
        });

    } catch (error) {
        console.error('Create Order Error:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: 'Could not initiate payment',
            details: error.response?.data?.message || error.message
        });
    }
};

// Verify/Webhook Handler
exports.verifyCashfreePayment = async (req, res) => {
    try {
        // Handle GET Redirect (User returns to site)
        if (req.method === 'GET') {
            const orderId = req.query.order_id;
            if (!orderId) return res.redirect('/payment/failed');

            return res.render('paymentSuccess', {
                transaction: await Transaction.findOne({ orderId }),
                title: 'Payment Status'
            });
        }

        // Handle POST Webhook
        if (req.method === 'POST') {
            const { data, event_time, type } = req.body;

            if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
                await Transaction.findOneAndUpdate(
                    { orderId: data.order.order_id },
                    {
                        status: 'success',
                        gatewayStatus: data.payment.payment_status,
                        gatewayPaymentId: data.payment.cf_payment_id,
                        paymentDetails: data
                    }
                );
            } else if (type === 'PAYMENT_FAILED_WEBHOOK') {
                await Transaction.findOneAndUpdate(
                    { orderId: data.order.order_id },
                    {
                        status: 'failed',
                        gatewayStatus: data.payment.payment_status,
                        failureReason: data.payment.payment_message
                    }
                );
            }

            return res.json({ status: 'OK' });
        }
    } catch (error) {
        console.error('Verify/Webhook Error:', error);
        res.status(500).send('Error');
    }
};

// Legacy UPI Process
exports.processUpiPayment = async (req, res) => {
    res.status(400).json({ message: "Use new Razorpay flow" });
};

// Process Card payment
exports.processCardPayment = async (req, res) => {
    try {
        const { cardNumber, cardHolder, expiryMonth, expiryYear, cvv, amount, orderId, type, rechargeDetails } = req.body;

        if (!cardNumber || !cardHolder || !expiryMonth || !expiryYear || !cvv) {
            return res.status(400).json({
                success: false,
                message: 'All card details are required'
            });
        }

        const transaction = new Transaction({
            orderId,
            amount,
            paymentMethod: 'CARD',
            paymentDetails: {
                cardLast4: cardNumber.slice(-4),
                cardHolder: cardHolder,
                ...(rechargeDetails && {
                    mobile: rechargeDetails.mobile,
                    operator: rechargeDetails.operator,
                    planId: rechargeDetails.planId,
                    planDetails: rechargeDetails.planDetails
                })
            },
            description: type === 'recharge' ? `Mobile Recharge - ${rechargeDetails?.mobile}` : 'General Payment',
            status: 'pending'
        });

        await transaction.save();

        setTimeout(async () => {
            transaction.status = 'success';
            transaction.transactionId = `TXN${Date.now()}`;
            await transaction.save();
        }, 2000);

        res.json({
            success: true,
            message: 'Payment processed successfully',
            transactionId: transaction._id,
            orderId: transaction.orderId
        });

    } catch (error) {
        console.error('Card payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Payment processing failed'
        });
    }
};

// Process Net Banking payment
exports.processNetBanking = async (req, res) => {
    try {
        const { bankCode, amount, orderId, type, rechargeDetails } = req.body;

        if (!bankCode) {
            return res.status(400).json({
                success: false,
                message: 'Please select a bank'
            });
        }

        const transaction = new Transaction({
            orderId,
            amount,
            paymentMethod: 'NETBANKING',
            paymentDetails: {
                bankCode: bankCode,
                ...(rechargeDetails && {
                    mobile: rechargeDetails.mobile,
                    operator: rechargeDetails.operator,
                    planId: rechargeDetails.planId,
                    planDetails: rechargeDetails.planDetails
                })
            },
            description: type === 'recharge' ? `Mobile Recharge - ${rechargeDetails?.mobile}` : 'General Payment',
            status: 'pending'
        });

        await transaction.save();

        res.json({
            success: true,
            message: 'Redirecting to bank...',
            transactionId: transaction._id,
            orderId: transaction.orderId,
            redirectUrl: `/payment/netbanking/redirect?txnId=${transaction._id}`
        });

    } catch (error) {
        console.error('Net banking payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Payment processing failed'
        });
    }
};

// Process Wallet payment
exports.processWalletPayment = async (req, res) => {
    try {
        const { walletType, amount, orderId, type, rechargeDetails } = req.body;

        if (!walletType) {
            return res.status(400).json({
                success: false,
                message: 'Please select a wallet'
            });
        }

        const transaction = new Transaction({
            orderId,
            amount,
            paymentMethod: 'WALLET',
            paymentDetails: {
                walletType: walletType,
                ...(rechargeDetails && {
                    mobile: rechargeDetails.mobile,
                    operator: rechargeDetails.operator,
                    planId: rechargeDetails.planId,
                    planDetails: rechargeDetails.planDetails
                })
            },
            description: type === 'recharge' ? `Mobile Recharge - ${rechargeDetails?.mobile}` : 'General Payment',
            status: 'pending'
        });

        await transaction.save();

        res.json({
            success: true,
            message: 'Redirecting to wallet...',
            transactionId: transaction._id,
            orderId: transaction.orderId
        });

    } catch (error) {
        console.error('Wallet payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Payment processing failed'
        });
    }
};

// Get transaction status
exports.getTransactionStatus = async (req, res) => {
    try {
        const { transactionId } = req.params;

        const transaction = await Transaction.findById(transactionId);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        res.json({
            success: true,
            transaction: {
                orderId: transaction.orderId,
                amount: transaction.amount,
                status: transaction.status,
                paymentMethod: transaction.paymentMethod,
                transactionId: transaction.transactionId,
                createdAt: transaction.createdAt
            }
        });

    } catch (error) {
        console.error('Get transaction status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transaction status'
        });
    }
};

// Render payment success page
exports.renderPaymentSuccess = async (req, res) => {
    try {
        const { transactionId } = req.params;

        const transaction = await Transaction.findById(transactionId);

        if (!transaction) {
            return res.status(404).send('Transaction not found');
        }

        res.render('paymentSuccess', {
            transaction,
            title: 'Payment Successful'
        });
    } catch (error) {
        console.error('Error rendering success page:', error);
        res.status(500).send('Error loading success page');
    }
};

// Download receipt
exports.downloadReceipt = async (req, res) => {
    try {
        const { transactionId } = req.params;

        const transaction = await Transaction.findOne({
            $or: [
                { _id: transactionId },
                { transactionId: transactionId },
                { orderId: transactionId }
            ]
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        res.json({
            success: true,
            receipt: {
                transactionId: transaction.transactionId || transaction.orderId,
                orderId: transaction.orderId,
                amount: transaction.amount,
                paymentMethod: transaction.paymentMethod,
                status: transaction.status,
                date: transaction.createdAt,
                description: transaction.description
            }
        });

    } catch (error) {
        console.error('Download receipt error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate receipt'
        });
    }
};