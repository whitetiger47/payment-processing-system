require('dotenv').config();

module.exports = {
    port: process.env.PORT,
    maxRetryAttempts: process.env.MAX_RETRY_ATTEMPTS,
    baseBackoffMs: process.env.BASE_BACKOFF_MS,
    gatewayTimeoutMs: process.env.GATEWAY_TIMEOUT_MS,
    lockTtlMs: process.env.LOCK_TTL_MS,

    SUPPORTED_CURRENCIES: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD'],
    PAYMENT_STATED: {
        PENDING: 'Pending',
        PROCESSING: 'Processing',
        SUCCESS: 'Success',
        FAILED: 'Failed',
    },
};