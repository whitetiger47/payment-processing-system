const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const logger = require('../utils/logger');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function charge(payment) {
  const delay = randomBetween(
    config.GATEWAY_MIN_DELAY_MS,
    config.GATEWAY_MAX_DELAY_MS
  );

  logger.info('Gateway charge initiated', {
    paymentId: payment.id,
    amount: payment.amount,
    currency: payment.currency,
    delayMs: delay,
  });

  return Promise.race([
    simulateCharge(payment, delay),
    simulateTimeout(payment),
  ]);
}

async function simulateCharge(payment, delay) {
  await sleep(delay);

  const random = Math.random();

  if (random < config.GATEWAY_SUCCESS_RATE) {
    const transactionId = uuidv4();
    logger.info('Gateway charge succeeded', {
      paymentId: payment.id,
      transactionId,
    });
    return { success: true, transactionId };
  }

  if (random < config.GATEWAY_SUCCESS_RATE + config.GATEWAY_FAILURE_RATE) {
    logger.warn('Gateway charge failed', {
      paymentId: payment.id,
      code: 'GATEWAY_ERROR',
    });
    return { success: false, code: 'GATEWAY_ERROR', message: 'Payment declined by gateway' };
  }

  await sleep(config.GATEWAY_TIMEOUT_MS + 1000);
  return { success: false, code: 'TIMEOUT', message: 'Gateway timed out' };
}

function simulateTimeout(payment) {
  return new Promise((_, reject) =>
    setTimeout(() => {
      logger.error('Gateway timeout hit', { paymentId: payment.id });
      reject(new Error('GATEWAY_TIMEOUT'));
    }, config.GATEWAY_TIMEOUT_MS)
  );
}

module.exports = { charge };