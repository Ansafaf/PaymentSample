const rechargeService = require('../services/rechargeService');

// Detect operator from mobile number
async function detectOperatorAPI(req, res) {
    try {
        const { mobile } = req.params;

        // Validate mobile number
        if (!mobile || mobile.length !== 10 || !/^\d{10}$/.test(mobile)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid mobile number. Must be 10 digits.'
            });
        }

        const operator = rechargeService.detectOperator(mobile);

        res.json({
            success: true,
            operator,
            mobile
        });

    } catch (error) {
        console.error('Error detecting operator:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to detect operator'
        });
    }
}

// Get recharge plans for operator
async function getPlansAPI(req, res) {
    try {
        const { operator } = req.params;

        if (!operator) {
            return res.status(400).json({
                success: false,
                message: 'Operator is required'
            });
        }

        const plans = await rechargeService.getRechargePlans(operator);

        res.json({
            success: true,
            operator,
            plans
        });

    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recharge plans'
        });
    }
}

// Execute recharge
async function executeRechargeAPI(req, res) {
    try {
        const { mobile, operator, amount, planId } = req.body;

        // Validate input
        if (!mobile || !operator || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: mobile, operator, amount'
            });
        }

        // Validate mobile number
        if (mobile.length !== 10 || !/^\d{10}$/.test(mobile)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid mobile number'
            });
        }

        // Execute recharge
        const result = await rechargeService.executeRecharge(mobile, operator, parseFloat(amount), planId);

        if (result.success) {
            res.json({
                success: true,
                ...result
            });
        } else {
            res.status(400).json({
                success: false,
                ...result
            });
        }

    } catch (error) {
        console.error('Error executing recharge:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to execute recharge'
        });
    }
}

module.exports = {
    detectOperatorAPI,
    getPlansAPI,
    executeRechargeAPI
};
