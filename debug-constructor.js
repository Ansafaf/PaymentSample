const { Cashfree } = require('cashfree-pg');
require('dotenv').config();

try {
    const cf = new Cashfree({
        clientId: process.env.CASHFREE_APP_ID || 'TEST',
        clientSecret: process.env.CASHFREE_SECRET_KEY || 'TEST',
        environment
    });
    console.log('Constructor accepted args');
    console.log('XEnvironment on instance:', cf.XEnvironment);
    console.log('XClientId on instance:', cf.XClientId);
} catch (e) {
    console.log('Constructor failed:', e.message);
}
