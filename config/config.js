// Configuration for recharge API
module.exports = {
    // Mode: 'test' or 'live'
    // Use 'test' for development (simulated recharges)
    // Use 'live' for production (real recharges with API credentials)
    mode: 'test',

    // Recharge API Configuration (for live mode)
    rechargeAPI: {
        // Example: Cyrus Recharge API
        baseURL: 'https://api.example-recharge.com',
        apiKey: 'YOUR_API_KEY_HERE',
        apiSecret: 'YOUR_API_SECRET_HERE',

        // Or use environment variables for security
        // apiKey: process.env.RECHARGE_API_KEY,
        // apiSecret: process.env.RECHARGE_API_SECRET,
    },

    // Operator detection patterns (based on mobile number series)
    operatorPatterns: {
        'Jio': ['6', '7', '8', '9'], // Jio uses various series
        'Airtel': ['6', '7', '8', '9'],
        'Vi': ['6', '7', '8', '9'],
        'BSNL': ['6', '7', '8', '9'],
    },

    // Popular recharge plans (for test mode)
    testPlans: {
        'Jio': [
            { id: 'J1', amount: 155, validity: '28 days', data: '2GB/day', description: 'Unlimited calls + 2GB/day' },
            { id: 'J2', amount: 239, validity: '28 days', data: '1.5GB/day', description: 'Unlimited calls + 1.5GB/day' },
            { id: 'J3', amount: 299, validity: '28 days', data: '2GB/day', description: 'Unlimited calls + 2GB/day + Disney+ Hotstar' },
            { id: 'J4', amount: 479, validity: '56 days', data: '1.5GB/day', description: 'Unlimited calls + 1.5GB/day' },
            { id: 'J5', amount: 666, validity: '84 days', data: '1.5GB/day', description: 'Unlimited calls + 1.5GB/day' },
            { id: 'J6', amount: 719, validity: '84 days', data: '2GB/day', description: 'Unlimited calls + 2GB/day + OTT' },
        ],
        'Airtel': [
            { id: 'A1', amount: 155, validity: '28 days', data: '2GB/day', description: 'Unlimited calls + 2GB/day' },
            { id: 'A2', amount: 265, validity: '28 days', data: '1.5GB/day', description: 'Unlimited calls + 1.5GB/day + Airtel Xstream' },
            { id: 'A3', amount: 299, validity: '28 days', data: '2GB/day', description: 'Unlimited calls + 2GB/day' },
            { id: 'A4', amount: 479, validity: '56 days', data: '1.5GB/day', description: 'Unlimited calls + 1.5GB/day' },
            { id: 'A5', amount: 549, validity: '56 days', data: '2GB/day', description: 'Unlimited calls + 2GB/day' },
            { id: 'A6', amount: 719, validity: '84 days', data: '1.5GB/day', description: 'Unlimited calls + 1.5GB/day' },
        ],
        'Vi': [
            { id: 'V1', amount: 155, validity: '28 days', data: '1GB/day', description: 'Unlimited calls + 1GB/day' },
            { id: 'V2', amount: 269, validity: '28 days', data: '1.5GB/day', description: 'Unlimited calls + 1.5GB/day + Vi Movies & TV' },
            { id: 'V3', amount: 299, validity: '28 days', data: '2GB/day', description: 'Unlimited calls + 2GB/day' },
            { id: 'V4', amount: 479, validity: '56 days', data: '1.5GB/day', description: 'Unlimited calls + 1.5GB/day' },
            { id: 'V5', amount: 539, validity: '56 days', data: '2GB/day', description: 'Unlimited calls + 2GB/day' },
            { id: 'V6', amount: 719, validity: '84 days', data: '1.5GB/day', description: 'Unlimited calls + 1.5GB/day' },
        ],
        'BSNL': [
            { id: 'B1', amount: 107, validity: '28 days', data: '1GB/day', description: 'Unlimited calls + 1GB/day' },
            { id: 'B2', amount: 153, validity: '28 days', data: '2GB/day', description: 'Unlimited calls + 2GB/day' },
            { id: 'B3', amount: 187, validity: '28 days', data: '2GB/day', description: 'Unlimited calls + 2GB/day' },
            { id: 'B4', amount: 397, validity: '80 days', data: '2GB/day', description: 'Unlimited calls + 2GB/day' },
            { id: 'B5', amount: 797, validity: '180 days', data: '2GB/day', description: 'Unlimited calls + 2GB/day' },
        ],
    },
};
