require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
    upiId: process.env.OWNER_UPI,
    accountNo: process.env.OWNER_ACCOUNT_NO,
    ifsc: process.env.OWNER_IFSC
};

