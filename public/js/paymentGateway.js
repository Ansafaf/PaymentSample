// Payment Gateway JavaScript

document.addEventListener('DOMContentLoaded', function () {
    // Tab switching functionality
    initializeTabs();

    // UPI functionality
    initializeUPI();

    // Card functionality
    initializeCard();

    // Net Banking functionality
    initializeNetBanking();

    // Wallet functionality
    initializeWallet();
});

// Tab Switching
function initializeTabs() {
    const tabs = document.querySelectorAll('.nav-link');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', function (e) {
            e.preventDefault();

            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(pane => {
                pane.classList.remove('active', 'show');
            });

            // Add active class to clicked tab
            this.classList.add('active');

            // Show corresponding tab pane
            const targetId = this.getAttribute('href').substring(1);
            const targetPane = document.getElementById(targetId);
            if (targetPane) {
                targetPane.classList.add('active', 'show');
            }
        });
    });

    // Mobile accordion functionality
    const cardHeaders = document.querySelectorAll('.card-header a');
    cardHeaders.forEach(header => {
        header.addEventListener('click', function (e) {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetCollapse = document.querySelector(targetId);

                // Close all other collapses
                document.querySelectorAll('.collapse').forEach(collapse => {
                    if (collapse !== targetCollapse) {
                        collapse.classList.remove('show');
                    }
                });

                // Toggle current collapse
                targetCollapse.classList.toggle('show');
            }
        });
    });
}

// UPI Functionality
function initializeUPI() {
    const vpaInput = document.getElementById('vpaInput');
    const verifyPayBtn = document.querySelector('.verifyPay_btn');
    const errorMsg = document.getElementById('errorMsg');

    if (vpaInput) {
        vpaInput.addEventListener('input', function () {
            const upiRegex = /^[\w.-]+@[\w.-]+$/;
            const isValid = upiRegex.test(this.value);

            if (this.value.length > 0) {
                if (isValid) {
                    this.classList.remove('is-invalid');
                    this.classList.add('is-valid');
                    verifyPayBtn.disabled = false;
                    errorMsg.style.display = 'none';
                } else {
                    this.classList.add('is-invalid');
                    this.classList.remove('is-valid');
                    verifyPayBtn.disabled = true;
                    errorMsg.style.display = 'block';
                }
            } else {
                this.classList.remove('is-invalid', 'is-valid');
                verifyPayBtn.disabled = true;
                errorMsg.style.display = 'none';
            }
        });
    }

    if (verifyPayBtn) {
        verifyPayBtn.addEventListener('click', function () {
            const upiId = vpaInput.value;
            const amount = new URLSearchParams(window.location.search).get('amount') || 299;
            const orderId = new URLSearchParams(window.location.search).get('orderId') || `ORD${Date.now()}`;

            processUpiPayment(upiId, amount, orderId);
        });
    }

    // QR Code payment simulation (for testing)
    const simulateQrBtn = document.getElementById('simulateQrPayment');
    if (simulateQrBtn) {
        simulateQrBtn.addEventListener('click', function () {
            const amount = new URLSearchParams(window.location.search).get('amount') || 299;
            const orderId = new URLSearchParams(window.location.search).get('orderId') || `ORD${Date.now()}`;

            // Simulate QR code payment with a dummy UPI ID
            showSuccessMessage('Processing QR payment...');
            processUpiPayment('scanned@upi', amount, orderId);
        });
    }

    // QR Code Timer
    startQRTimer();
}

function startQRTimer() {
    const timerElement = document.getElementById('timer');
    const progressBar = document.querySelector('.bar');

    if (!timerElement || !progressBar) return;

    let timeLeft = 300; // 5 minutes in seconds
    const totalTime = 300;

    const interval = setInterval(() => {
        timeLeft--;

        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')} min ${seconds.toString().padStart(2, '0')} sec`;

        // Update progress bar
        const progress = ((totalTime - timeLeft) / totalTime) * 100;
        progressBar.style.width = progress + '%';

        if (timeLeft <= 0) {
            clearInterval(interval);
            timerElement.textContent = '00 min 00 sec';
            showExpiredMessage();
        }
    }, 1000);
}

function showExpiredMessage() {
    const qrSection = document.querySelector('.QRcode_section');
    if (qrSection) {
        qrSection.innerHTML = `
            <h2 class="QRcode-scan-pay" style="color: #e74c3c;">QR Code Expired</h2>
            <p>Please refresh the page to generate a new QR code</p>
            <button class="btn miBlackbtn" onclick="location.reload()">Refresh</button>
        `;
    }
}

async function processUpiPayment(upiId, amount, orderId) {
    try {
        // Get payment type and details from URL and sessionStorage
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type') || 'general';
        const rechargeDetails = type === 'recharge' ? JSON.parse(sessionStorage.getItem('rechargeDetails') || '{}') : null;
        const paymentDetails = type === 'general' ? JSON.parse(sessionStorage.getItem('paymentDetails') || '{}') : null;

        const response = await fetch('/payment/upi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                upiId,
                amount,
                orderId,
                type,
                rechargeDetails,
                paymentDetails
            })
        });

        const data = await response.json();

        if (data.success) {
            showSuccessMessage('Payment initiated successfully!');
            // Wait for payment to complete (simulated)
            setTimeout(() => {
                window.location.href = `/payment/success/${data.transactionId}`;
            }, 3000);
        } else {
            showErrorMessage(data.message || 'Payment failed');
        }
    } catch (error) {
        console.error('Payment error:', error);
        showErrorMessage('Something went wrong. Please try again.');
    }
}

// Card Functionality
function initializeCard() {
    const cardNumber = document.getElementById('card-number');
    const cardHolder = document.getElementById('card-holder-name');
    const expMonth = document.getElementById('card_exp_month');
    const expYear = document.getElementById('card_exp_year');
    const cvv = document.getElementById('cvv');
    const payBtn = document.getElementById('common_pay_btn');

    if (cardNumber) {
        cardNumber.addEventListener('input', function (e) {
            // Format card number with spaces
            let value = e.target.value.replace(/\s/g, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;

            // Detect card type
            detectCardType(value);

            // Validate
            validateCard();
        });
    }

    if (expMonth) {
        expMonth.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');
            if (parseInt(value) > 12) value = '12';
            e.target.value = value;
            validateCard();
        });
    }

    if (expYear) {
        expYear.addEventListener('input', function (e) {
            e.target.value = e.target.value.replace(/\D/g, '');
            validateCard();
        });
    }

    if (cvv) {
        cvv.addEventListener('input', function (e) {
            e.target.value = e.target.value.replace(/\D/g, '');
            validateCard();
        });
    }

    if (payBtn) {
        payBtn.addEventListener('click', function () {
            if (!payBtn.disabled) {
                processCardPayment();
            }
        });
    }

    function validateCard() {
        const isCardValid = cardNumber && cardNumber.value.replace(/\s/g, '').length >= 13;
        const isHolderValid = cardHolder && cardHolder.value.length > 0;
        const isExpValid = expMonth && expYear && expMonth.value.length === 2 && expYear.value.length === 2;
        const isCvvValid = cvv && cvv.value.length >= 3;

        if (payBtn) {
            payBtn.disabled = !(isCardValid && isHolderValid && isExpValid && isCvvValid);
        }
    }
}

function detectCardType(cardNumber) {
    const cardType = document.querySelector('.cardType');
    if (!cardType) return;

    const patterns = {
        visa: /^4/,
        mastercard: /^5[1-5]/,
        amex: /^3[47]/,
        discover: /^6(?:011|5)/
    };

    for (let [type, pattern] of Object.entries(patterns)) {
        if (pattern.test(cardNumber)) {
            cardType.src = `/images/${type}.png`;
            cardType.style.display = 'block';
            return;
        }
    }

    cardType.style.display = 'none';
}

async function processCardPayment() {
    const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
    const cardHolder = document.getElementById('card-holder-name').value;
    const expiryMonth = document.getElementById('card_exp_month').value;
    const expiryYear = document.getElementById('card_exp_year').value;
    const cvv = document.getElementById('cvv').value;
    const amount = new URLSearchParams(window.location.search).get('amount') || 299;
    const orderId = new URLSearchParams(window.location.search).get('orderId') || `ORD${Date.now()}`;

    // Get payment type and details from URL and sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type') || 'general';
    const rechargeDetails = type === 'recharge' ? JSON.parse(sessionStorage.getItem('rechargeDetails') || '{}') : null;
    const paymentDetails = type === 'general' ? JSON.parse(sessionStorage.getItem('paymentDetails') || '{}') : null;

    try {
        const response = await fetch('/payment/card', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cardNumber,
                cardHolder,
                expiryMonth,
                expiryYear,
                cvv,
                amount,
                orderId,
                type,
                rechargeDetails,
                paymentDetails
            })
        });

        const data = await response.json();

        if (data.success) {
            showSuccessMessage('Payment processed successfully!');
            // Wait for payment to complete (simulated)
            setTimeout(() => {
                window.location.href = `/payment/success/${data.transactionId}`;
            }, 3000);
        } else {
            showErrorMessage(data.message || 'Payment failed');
        }
    } catch (error) {
        console.error('Payment error:', error);
        showErrorMessage('Something went wrong. Please try again.');
    }
}

// Net Banking Functionality
function initializeNetBanking() {
    const bankRadios = document.querySelectorAll('.bank-name');
    const payNowBtn = document.getElementById('pay-now');

    bankRadios.forEach(radio => {
        radio.addEventListener('change', function () {
            if (payNowBtn) {
                payNowBtn.disabled = false;
            }
        });
    });

    if (payNowBtn) {
        payNowBtn.addEventListener('click', function () {
            const selectedBank = document.querySelector('.bank-name:checked');
            if (selectedBank) {
                processNetBanking(selectedBank.name);
            }
        });
    }
}

async function processNetBanking(bankCode) {
    const amount = new URLSearchParams(window.location.search).get('amount') || 299;
    const orderId = new URLSearchParams(window.location.search).get('orderId') || `ORD${Date.now()}`;

    // Get payment type and details from URL and sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type') || 'general';
    const rechargeDetails = type === 'recharge' ? JSON.parse(sessionStorage.getItem('rechargeDetails') || '{}') : null;
    const paymentDetails = type === 'general' ? JSON.parse(sessionStorage.getItem('paymentDetails') || '{}') : null;

    try {
        const response = await fetch('/payment/netbanking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bankCode,
                amount,
                orderId,
                type,
                rechargeDetails,
                paymentDetails
            })
        });

        const data = await response.json();

        if (data.success) {
            showSuccessMessage('Processing payment...');
            // Simulate bank processing and redirect to success
            setTimeout(() => {
                window.location.href = `/payment/success/${data.transactionId}`;
            }, 3000);
        } else {
            showErrorMessage(data.message || 'Payment failed');
        }
    } catch (error) {
        console.error('Payment error:', error);
        showErrorMessage('Something went wrong. Please try again.');
    }
}

// Wallet Functionality
function initializeWallet() {
    const walletPayBtn = document.getElementById('wallet-pay-now');

    if (walletPayBtn) {
        walletPayBtn.addEventListener('click', function () {
            showErrorMessage('Wallet payment coming soon!');
        });
    }
}

// Helper Functions
function showSuccessMessage(message) {
    // Create a better success notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #4caf50, #45a049);
        color: white;
        padding: 20px 30px;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        font-size: 16px;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = '✓ ' + message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2500);
}

function showErrorMessage(message) {
    // Create a better error notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #f44336, #d32f2f);
        color: white;
        padding: 20px 30px;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        font-size: 16px;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = '✗ ' + message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
