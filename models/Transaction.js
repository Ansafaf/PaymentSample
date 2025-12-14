const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['UPI', 'CARD', 'NETBANKING', 'WALLET', 'GENERAL']
    },
    paymentDetails: {
        type: mongoose.Schema.Types.Mixed
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'success', 'failed', 'cancelled'],
        default: 'pending'
    },
    customerInfo: {
        name: String,
        email: String,
        phone: String
    },
    description: String,
    failureReason: String,
    idempotencyKey: {
        type: String,
        unique: true,
        sparse: true // Allows null/undefined for old records
    },
    gatewayPaymentId: String,
    gatewayStatus: String
}, {
    timestamps: true
});

transactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
