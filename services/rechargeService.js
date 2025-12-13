const axios = require('axios');
const config = require('../config/config');

// Detect mobile operator from number
function detectOperator(mobileNumber) {
    // In test mode, use simple logic
    // In live mode, you would call an API to detect operator

    if (config.mode === 'test') {
        // Simple detection based on first digit (for demo purposes)
        const firstDigit = mobileNumber.charAt(0);

        // Simulate operator detection
        if (['6', '7'].includes(firstDigit)) return 'Jio';
        if (['8'].includes(firstDigit)) return 'Airtel';
        if (['9'].includes(firstDigit)) return 'Vi';

        return 'Jio'; // Default
    } else {
        // In live mode, call real operator detection API
        // Example: Use HLR lookup API
        return 'Unknown';
    }
}

// Get recharge plans for an operator
async function getRechargePlans(operator) {
    if (config.mode === 'test') {
        // Return test plans from config
        return config.testPlans[operator] || [];
    } else {
        // In live mode, fetch from real API
        try {
            const response = await axios.get(`${config.rechargeAPI.baseURL}/plans`, {
                params: { operator },
                headers: {
                    'Authorization': `Bearer ${config.rechargeAPI.apiKey}`
                }
            });
            return response.data.plans || [];
        } catch (error) {
            console.error('Error fetching plans:', error.message);
            return [];
        }
    }
}

// Execute mobile recharge
async function executeRecharge(mobileNumber, operator, amount, planId) {
    console.log(`[Recharge Service] Executing recharge for ${mobileNumber}`);
    console.log(`[Recharge Service] Operator: ${operator}, Amount: ₹${amount}`);

    if (config.mode === 'test') {
        // Simulate recharge in test mode
        console.log('[Recharge Service] TEST MODE - Simulating recharge...');

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Generate fake recharge transaction ID
        const rechargeTransactionId = `RCH${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        // Simulate successful recharge
        return {
            success: true,
            rechargeTransactionId,
            status: 'SUCCESS',
            message: 'Recharge completed successfully (TEST MODE)',
            mobileNumber,
            operator,
            amount,
            timestamp: new Date().toISOString()
        };

    } else {
        // Execute real recharge via API
        try {
            console.log('[Recharge Service] LIVE MODE - Calling recharge API...');

            const response = await axios.post(
                `${config.rechargeAPI.baseURL}/recharge`,
                {
                    mobile: mobileNumber,
                    operator: operator,
                    amount: amount,
                    planId: planId
                },
                {
                    headers: {
                        'Authorization': `Bearer ${config.rechargeAPI.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Parse API response
            if (response.data.status === 'SUCCESS') {
                return {
                    success: true,
                    rechargeTransactionId: response.data.transactionId,
                    status: 'SUCCESS',
                    message: 'Recharge completed successfully',
                    mobileNumber,
                    operator,
                    amount,
                    timestamp: response.data.timestamp
                };
            } else {
                return {
                    success: false,
                    status: 'FAILED',
                    message: response.data.message || 'Recharge failed',
                    mobileNumber,
                    operator,
                    amount
                };
            }

        } catch (error) {
            console.error('[Recharge Service] Error:', error.message);
            return {
                success: false,
                status: 'FAILED',
                message: error.response?.data?.message || 'Recharge API error',
                mobileNumber,
                operator,
                amount
            };
        }
    }
}

// Check recharge status
async function checkRechargeStatus(rechargeTransactionId) {
    if (config.mode === 'test') {
        // In test mode, always return success
        return {
            status: 'SUCCESS',
            message: 'Recharge completed (TEST MODE)'
        };
    } else {
        // Check status from real API
        try {
            const response = await axios.get(
                `${config.rechargeAPI.baseURL}/status/${rechargeTransactionId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${config.rechargeAPI.apiKey}`
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error checking recharge status:', error.message);
            return {
                status: 'UNKNOWN',
                message: 'Unable to check status'
            };
        }
    }
}

module.exports = {
    detectOperator,
    getRechargePlans,
    executeRecharge,
    checkRechargeStatus
};
