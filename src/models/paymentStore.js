const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const logger = require('../utils/logger');

const payments = new Map();
const idempotencyKeys = new Map();
const locks = new Map();

function createPayment(data) {
  const payment = {
    id: uuidv4(),
    amount: data.amount,
    currency: data.currency,
    status: config.PAYMENT_STATES.PENDING,
    idempotencyKey: data.idempotencyKey,
    attempts: 0,
    maxAttempts: config.MAX_RETRY_ATTEMPTS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: data.metadata || {},
  };

  payments.set(payment.id, payment);
  logger.info('Payment created', { paymentId: payment.id, amount: payment.amount });
  return payment;
}

function findById(paymentId) {
  return payments.get(paymentId) || null;
}

function findByIdempotencyKey(key) {
  const paymentId = idempotencyKeys.get(key);
  if (!paymentId) return null;
  return findById(paymentId);
}

function updatePayment(paymentId, updates) {
  const payment = findById(paymentId);
  if (!payment) throw new Error(`Payment not found: ${paymentId}`);

  const updated = {
    ...payment,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  payments.set(paymentId, updated);
  logger.info('Payment updated', { paymentId, status: updated.status });
  return updated;
}

function saveIdempotencyKey(key, paymentId) {
  idempotencyKeys.set(key, paymentId);
}


function acquireLock(paymentId) {
  if (locks.has(paymentId)) {
    const lockedAt = locks.get(paymentId);
    const age = Date.now() - lockedAt;

    if (age < config.LOCK_TTL_MS) {
      logger.warn('Lock already held', { paymentId, ageMs: age });
      return false;
    }

    logger.warn('Stale lock detected, releasing', { paymentId, ageMs: age });
  }

  locks.set(paymentId, Date.now());
  logger.info('Lock acquired', { paymentId });
  return true;
}

function releaseLock(paymentId) {
  locks.delete(paymentId);
  logger.info('Lock released', { paymentId });
}

function isLocked(paymentId) {
  if (!locks.has(paymentId)) return false;

  const age = Date.now() - locks.get(paymentId);
  return age < config.LOCK_TTL_MS;
}

function getAllPayments() {
  return Array.from(payments.values());
}

module.exports = {
  createPayment,
  findById,
  findByIdempotencyKey,
  updatePayment,
  saveIdempotencyKey,
  acquireLock,
  releaseLock,
  isLocked,
  getAllPayments,
};