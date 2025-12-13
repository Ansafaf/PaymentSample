const owner = require('./config/Ownerconfig');
const { Cashfree } = require('cashfree-pg');

// Setup
Cashfree.XClientId = owner.cashfreeAppId;
Cashfree.XClientSecret = owner.cashfreeSecretKey;

// Env logic from controller
if (Cashfree.Environment) {
    Cashfree.XEnvironment = Cashfree.Environment[owner.cashfreeEnv === 'PROD' ? 'PRODUCTION' : 'SANDBOX'];
} else {
    try {
        const lib = require('cashfree-pg');
        if (lib.CFEnvironment) {
            Cashfree.XEnvironment = owner.cashfreeEnv === 'PROD'
                ? lib.CFEnvironment.PRODUCTION
                : lib.CFEnvironment.SANDBOX;
        } else {
            Cashfree.XEnvironment = "SANDBOX";
        }
    } catch (e) {
        Cashfree.XEnvironment = "SANDBOX";
    }
}

console.log('Config:', {
    appId: owner.cashfreeAppId ? 'Set' : 'Missing',
    secret: owner.cashfreeSecretKey ? 'Set' : 'Missing',
    env: Cashfree.XEnvironment
});

async function testOrder() {
    try {
        const request = {
            order_amount: 1.00,
            order_currency: "INR",
            order_id: "TEST_" + Date.now(),
            customer_details: {
                customer_id: "test_cust_123",
                customer_phone: "9999999999",
                customer_name: "Test User",
                customer_email: "test@example.com"
            },
            order_meta: {
                return_url: "http://localhost:3000/payment/verify?order_id={order_id}"
            }
        };

        console.log('Creating Order...');
        const cf = new Cashfree();
        const response = await cf.PGCreateOrder("2023-08-01", request);
        console.log('Success:', response.data);

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testOrder();
