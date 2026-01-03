require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const mongoose = require('mongoose');

// Connect to MongoDB for Payment Gateway
const mongoOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
};

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/payment-app', mongoOptions)
    .then(() => {
        console.log('✅ MongoDB Connected');
        // Start server ONLY after DB is connected
        app.listen(PORT, '0.0.0.0', () => {
            console.log('='.repeat(50));
            console.log('🚀 Payment Gateway Server Started');
            console.log('='.repeat(50));
            console.log(`📍 Server running at: http://localhost:${PORT}`);
            console.log(`📱 Payment Gateway: http://localhost:${PORT}`);
            console.log('='.repeat(50));
            console.log('💳 Ready to process payments...\n');
        });
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
        console.log('⚠️ Server running in basic mode - DB dependent features will fail');
        // Do not start server to avoid buffering timeouts on requests
        process.exit(1); // Exit so management tools like PM2 can restart
    });

// Database Connection (Legacy In-Memory)
// Helper preserved if needed by other routes, but Mongoose is primary for Gateway
require('./database/db');

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
const paymentRoutes = require('./routes/paymentRoutes');
const bankRoutes = require('./routes/bankRoutes');
const rechargeRoutes = require('./routes/rechargeRoutes');
const paymentGatewayRoutes = require('./routes/paymentGatewayRoutes');

app.use('/', paymentRoutes);
app.use('/', bankRoutes);
app.use('/', rechargeRoutes);
app.use('/', paymentGatewayRoutes);

// Error handling for 404
app.use((req, res) => {
    res.status(404).send('Page not found');
});
