require('dotenv').config();

const isProd = process.env.CASHFREE_ENV === 'PROD';

module.exports = {
    upiId: process.env.OWNER_UPI,
    accountNo: process.env.OWNER_ACCOUNT_NO,
    ifsc: process.env.OWNER_IFSC,
    cashfreeAppId: isProd ? process.env.PROD_APP_ID : process.env.TEST_APP_ID,
    cashfreeSecretKey: isProd ? process.env.PROD_SECRET_KEY : process.env.TEST_SECRET_KEY,
    cashfreeEnv: process.env.CASHFREE_ENV || 'TEST'
};
