// Stubbed Transaction model - Mongoose disabled
// This file provides a mock implementation to avoid runtime errors when Mongoose is commented out.

class TransactionMock {
    constructor(data) {
        Object.assign(this, data);
        // Assign default fields if not provided
        this.status = this.status || 'pending';
        this.createdAt = this.createdAt || new Date().toISOString();
    }
    async save() {
        // In a real DB, this would persist. Here we just return the instance.
        return this;
    }
}

// Static mock methods
TransactionMock.findOne = async (query) => null;
TransactionMock.findById = async (id) => null;
TransactionMock.findOneAndUpdate = async (filter, update) => null;
TransactionMock.find = async (query) => [];
TransactionMock.create = async (data) => new TransactionMock(data);

module.exports = TransactionMock;
