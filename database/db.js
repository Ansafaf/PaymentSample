// // In-memory database using Map
// const transactionsDB = new Map();

// // Save a new transaction
// function saveTransaction(transaction) {
//   transactionsDB.set(transaction.id, transaction);
//   return transaction;
// }

// // Get transaction by ID
// function getTransaction(transactionId) {
//   return transactionsDB.get(transactionId);
// }

// // Update transaction
// function updateTransaction(transactionId, updates) {
//   const transaction = transactionsDB.get(transactionId);
//   if (transaction) {
//     const updatedTransaction = { ...transaction, ...updates };
//     transactionsDB.set(transactionId, updatedTransaction);
//     return updatedTransaction;
//   }
//   return null;
// }

// // Get all transactions (for debugging)
// function getAllTransactions() {
//   return Array.from(transactionsDB.values());
// }

// module.exports = {
//   saveTransaction,
//   getTransaction,
//   updateTransaction,
//   getAllTransactions
// };
