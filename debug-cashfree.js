const { Cashfree } = require('cashfree-pg');

console.log('Static PGCreateOrder exists?', typeof Cashfree.PGCreateOrder);
console.log('Prototype PGCreateOrder exists?', typeof Cashfree.prototype.PGCreateOrder);

try {
    const cf = new Cashfree();
    console.log('Instance PGCreateOrder exists?', typeof cf.PGCreateOrder);
} catch (e) {
    console.log('Instantiate error', e.message);
}
