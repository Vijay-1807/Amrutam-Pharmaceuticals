import crypto from 'crypto';
import { config } from '../../config/index';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;

// Derive a fixed-length key from the configured secret so any entropy source works.
const masterKey = crypto
  .createHash('sha256')
  .update(config.ENCRYPTION_KEY)
  .digest();

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const version = config.ENCRYPTION_KEY_VERSION;
  return [version, iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(':');
}

export function decrypt(payload: string): string {
  const [version, ivB64, tagB64, dataB64] = payload.split(':');
  if (!version || !ivB64 || !tagB64 || !dataB64) {
    throw new Error('Malformed encrypted payload');
  }
  // Key rotation: new payloads carry ENCRYPTION_KEY_VERSION; decrypt still accepts
  // older versions when previous keys are present in ENCRYPTION_OLD_KEYS ("version:key" pairs).
  const key = resolveKey(version);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
}

function resolveKey(version: string): Buffer {
  if (version === config.ENCRYPTION_KEY_VERSION) return masterKey;
  const oldKeys = (process.env.ENCRYPTION_OLD_KEYS || '')
    .split(',')
    .map((pair) => pair.split(':'))
    .filter(([, secret]) => secret);
  const entry = oldKeys.find(([v]) => v === version);
  if (!entry) throw new Error(`Unknown encryption key version: ${version}`);
  return crypto.createHash('sha256').update(entry[1]).digest();
}

const PBKDF2_ITERATIONS = 150000;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, 'sha512').toString('hex');
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  // Legacy format "salt:hash" kept for previously stored credentials
  if (parts.length === 2 && !stored.includes('pbkdf2')) {
    const [salt, hash] = parts;
    const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
    try {
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), verifyHash);
    } catch {
      return false;
    }
  }
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const [, iterationsStr, salt, hash] = parts;
  const iterations = parseInt(iterationsStr, 10);
  const verifyHash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512');
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), verifyHash);
  } catch {
    return false;
  }
}

export function generateRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}
