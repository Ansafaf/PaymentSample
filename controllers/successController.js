const db = require('../database/db');

// Render success page
function renderSuccessPage(req, res) {
    try {
        const { transactionId } = req.params;

        // Get transaction from database
        const transaction = db.getTransaction(transactionId);

        if (!transaction) {
            return res.status(404).render('error', {
                message: 'Transaction not found'
            });
        }

        // Format settlement time
        let formattedTime = 'N/A';
        if (transaction.settlementTime) {
            const date = new Date(transaction.settlementTime);
            formattedTime = date.toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'medium'
            });
        }

        // Render success page with transaction details
        res.render('success', {
            transaction: {
                id: transaction.id,
                name: transaction.name,
                amount: transaction.amount,
                paymentMethod: transaction.paymentMethod,
                status: transaction.status,
                settlementTime: formattedTime
            }
        });

    } catch (error) {
        console.error('Error rendering success page:', error);
        res.status(500).send('Internal server error');
    }
}

module.exports = {
    renderSuccessPage
};
