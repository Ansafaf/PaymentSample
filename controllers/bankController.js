const db = require('../database/db');

// Simulate bank-to-bank settlement
async function settlementAPI(req, res) {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required'
      });
    }

    // Get transaction from database
    const transaction = db.getTransaction(transactionId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    console.log(`[Bank Settlement] Processing transaction: ${transactionId}`);
    console.log(`[Bank Settlement] Simulating bank-to-bank communication...`);

    // Simulate 2-3 second processing delay
    const delay = 2000 + Math.random() * 1000; // 2-3 seconds
    await new Promise(resolve => setTimeout(resolve, delay));

    // Update transaction status to SETTLED
    const settlementTime = new Date().toISOString();
    db.updateTransaction(transactionId, {
      status: 'SETTLED',
      settlementTime
    });

    console.log(`[Bank Settlement] Transaction ${transactionId} settled successfully`);

    // If this is a mobile recharge, execute the recharge
    let rechargeResult = null;
    if (transaction.mobile && transaction.operator) {
      console.log(`[Bank Settlement] Triggering mobile recharge for ${transaction.mobile}...`);

      const rechargeService = require('../services/rechargeService');
      rechargeResult = await rechargeService.executeRecharge(
        transaction.mobile,
        transaction.operator,
        transaction.amount,
        transaction.planId
      );

      // Update transaction with recharge details
      db.updateTransaction(transactionId, {
        rechargeStatus: rechargeResult.status,
        rechargeTransactionId: rechargeResult.rechargeTransactionId,
        rechargeMessage: rechargeResult.message
      });

      console.log(`[Recharge] Status: ${rechargeResult.status} - ${rechargeResult.message}`);
    }

    // Return settlement confirmation
    res.json({
      success: true,
      transactionId,
      status: 'SETTLED',
      settlementTime,
      message: 'Bank settlement completed successfully',
      recharge: rechargeResult
    });

  } catch (error) {
    console.error('Error in bank settlement:', error);
    res.status(500).json({
      success: false,
      message: 'Settlement failed'
    });
  }
}

module.exports = {
  settlementAPI
};
