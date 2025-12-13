# Payment Gateway Application

## Overview
A comprehensive payment gateway application supporting multiple payment methods including UPI, Credit/Debit Cards, Net Banking, and Digital Wallets.

## Features
- ✅ UPI Payments with QR Code
- ✅ Credit/Debit Card Payments
- ✅ Net Banking Integration
- ✅ Digital Wallet Support
- ✅ Responsive Design (Mobile & Desktop)
- ✅ Real-time Payment Status
- ✅ Secure Transaction Processing

## Access Points

### 1. Payment Gateway
**URL:** `http://localhost:3000/payment-gateway`

**Query Parameters:**
- `amount` - Payment amount (default: 299)
- `orderId` - Order ID (auto-generated if not provided)
- `description` - Payment description

**Example:**
```
http://localhost:3000/payment-gateway?amount=500&orderId=ORD123&description=Product Purchase
```

### 2. UPI QR Code API
**URL:** `http://localhost:3000/api/upi-qr`

**Query Parameters:**
- `amount` - Payment amount
- `note` - Transaction note

**Example:**
```
http://localhost:3000/api/upi-qr?amount=299&note=Payment for Order
```

### 3. Recharge Page
**URL:** `http://localhost:3000/recharge`

### 4. General Payment
**URL:** `http://localhost:3000/`

## Payment Methods

### UPI Payment
1. **Scan & Pay:** Scan the QR code with any UPI app
2. **UPI ID:** Enter your UPI ID/VPA and verify

### Card Payment
- Supports Visa, Mastercard, Amex, Discover
- Real-time card validation
- Secure CVV handling

### Net Banking
- Popular banks pre-loaded
- Search functionality for all banks
- Direct bank redirection

### Wallets
- Coming soon

## Environment Variables

Add these to your `.env` file:

```env
# Owner/Merchant Details
OWNER_NAME=Your Business Name
OWNER_ACCOUNT_NO=1234567890
OWNER_IFSC=BANK0001234
OWNER_UPI=yourbusiness@upi

# Database (if using MongoDB)
MONGODB_URI=mongodb://localhost:27017/payment-gateway

# Server
PORT=3000
```

## Installation

```bash
# Install dependencies
npm install

# Required packages
npm install express ejs body-parser mongoose qrcode

# Start server
npm start
```

## File Structure

```
payment-app/
├── controllers/
│   ├── paymentGatewayController.js
│   └── qrController.js
├── models/
│   └── Transaction.js
├── routes/
│   ├── paymentGatewayRoutes.js
│   └── qrRoutes.js
├── views/
│   └── paymentGateway.ejs
├── public/
│   ├── css/
│   │   └── paymentGateway.css
│   ├── js/
│   │   └── paymentGateway.js
│   └── images/
│       └── (payment icons and logos)
├── config/
│   └── Ownerconfig.js
├── .env
└── server.js
```

## API Endpoints

### Payment Processing

#### Process UPI Payment
```
POST /payment/upi
Body: { upiId, amount, orderId }
```

#### Process Card Payment
```
POST /payment/card
Body: { cardNumber, cardHolder, expiryMonth, expiryYear, cvv, amount, orderId }
```

#### Process Net Banking
```
POST /payment/netbanking
Body: { bankCode, amount, orderId }
```

#### Process Wallet Payment
```
POST /payment/wallet
Body: { walletType, amount, orderId }
```

#### Get Transaction Status
```
GET /payment/status/:transactionId
```

## Integration with Existing Flows

The payment gateway can be accessed from:

1. **After Recharge Screen:**
   - Add a "Pay Now" button on recharge confirmation
   - Redirect to: `/payment-gateway?amount={rechargeAmount}&orderId={rechargeOrderId}`

2. **After General Payment Screen:**
   - Add payment method selection
   - Redirect to: `/payment-gateway?amount={amount}&orderId={orderId}`

## Example Integration

```javascript
// In your recharge success page
<a href="/payment-gateway?amount=<%= rechargeAmount %>&orderId=<%= orderId %>&description=Mobile Recharge" 
   class="btn btn-primary">
   Proceed to Payment
</a>
```

## Testing

### Test UPI IDs
- `test@paytm`
- `test@ybl`
- `test@okaxis`

### Test Card Numbers
- Visa: `4111111111111111`
- Mastercard: `5555555555554444`
- Amex: `378282246310005`

**Note:** These are for testing UI only. Actual payment processing requires integration with payment gateway providers.

## Security Notes

⚠️ **Important:**
- Never store actual card numbers
- Use tokenization for saved cards
- Implement PCI DSS compliance for production
- Use HTTPS in production
- Validate all inputs server-side
- Implement rate limiting
- Add CSRF protection

## Next Steps

1. ✅ Set up database connection
2. ✅ Configure environment variables
3. ⏳ Add actual payment gateway integration (Razorpay/Stripe/PayU)
4. ⏳ Implement transaction history
5. ⏳ Add email/SMS notifications
6. ⏳ Implement refund functionality
7. ⏳ Add payment analytics dashboard

## Support

For issues or questions, please check the implementation plan in the artifacts directory.
