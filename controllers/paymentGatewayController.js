const Transaction = require('../models/Transaction');
const owner = require('../config/Ownerconfig');
const axios = require('axios');

// Render payment gateway page
exports.renderPaymentGateway = async (req, res) => {
    try {
        // Retrieve params from either Query (GET) or Body (POST)
        const amount = req.query.amount || req.body.amount;
        const orderId = req.query.orderId || req.body.orderId;
        const description = req.query.description || req.body.description;
        const type = req.query.type || req.body.type;

        // Sanitize UPI ID
        const rawUpiId = owner.upiId || '';
        const sanitizedUpiId = rawUpiId.trim();

        console.log(`[DEBUG] Raw UPI ID: '${rawUpiId}' (Length: ${rawUpiId.length})`);
        console.log(`[DEBUG] Sanitized UPI ID: '${sanitizedUpiId}' (Length: ${sanitizedUpiId.length})`);

        if (!sanitizedUpiId) {
            console.error("WARNING: UPI ID (OWNER_UPI) is missing in configuration!");
        }

        const safeOrderId = orderId || `ORD${Date.now()}`;
        const safeDescription = description || 'Payment';
        const safeAmount = parseFloat(amount || 299).toFixed(2);
        const upiMeUrl = `https://www.upi.me/pay?pa=${sanitizedUpiId}&am=${safeAmount}`;

        res.render('paymentGateway', {
            amount: amount || 299,
            orderId: safeOrderId,
            description: safeDescription,
            type: type || 'general',
            title: 'Payment Gateway',
            upiId: sanitizedUpiId, // For display if needed
            ownerName: owner.name,
            upiMeUrl: upiMeUrl,

            // User Provided Code Data Object
            upiwcData: {
                payee_vpa: sanitizedUpiId,
                payee_name: owner.name,
                order_amount: parseFloat(amount || 299).toFixed(2),
                order_key: safeOrderId,
                order_number: safeOrderId,
                mc_code: '', // Removed default '0000' to prevent UPI errors
                cancel_url: `${req.protocol}://${req.get('host')}/payment/status/${safeOrderId}`, // Redirect to status page on cancel
                payment_url: `${req.protocol}://${req.get('host')}${req.originalUrl}`, // Reload current page
                theme: 'modern', // jquery-confirm theme
                btn_show_interval: 0,
                btn_timer: 0,
                transaction_id: 'show_require', // Require UTR
                transaction_image: 'hide', // Hide image upload for now (optional)
                callback_url: `${req.protocol}://${req.get('host')}/payment/verify-manual` // Endpoint to handle manual UTR submission
            }
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

        // Sanitize UPI ID
        const payeeAddress = (owner.upiId || '').trim();
        if (!payeeAddress) {
            console.error("QR Error: UPI ID is missing");
        }

        const payeeName = encodeURIComponent(owner.name);

        let qrData = `upi://pay?pa=${payeeAddress}&pn=${payeeName}&cu=INR&mode=02`;

        if (amount) {
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

// NEW: Manual Payment Verification (UTR)
exports.verifyManualPayment = async (req, res) => {
    try {
        const { orderId, transactionId, amount } = req.body;

        if (!orderId || !transactionId) {
            return res.status(400).json({
                success: false,
                message: 'Missing Order ID or Transaction ID'
            });
        }

        // Find and update transaction
        const transaction = await Transaction.findOneAndUpdate(
            { orderId },
            {
                $set: {
                    status: 'pending_verification',
                    gatewayPaymentId: transactionId, // Store UTR here
                    paymentMethod: 'UPI_MANUAL',
                    description: 'Manual UPI Payment - UTR: ' + transactionId,
                    amount: amount ? Number(amount) : undefined
                }
            },
            { new: true }
        );

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            message: 'Payment submitted for verification',
            orderId: orderId
        });

    } catch (error) {
        console.error('Manual verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during verification'
        });
    }
};