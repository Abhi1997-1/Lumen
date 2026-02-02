import 'server-only'
import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const IV_LENGTH = 16

// Helper to get key. In prod, this must be 32 bytes.
function getKey() {
    const key = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // 32 chars default
    return Buffer.from(key).subarray(0, 32);
}

export function encrypt(text: string) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(text: string) {
    if (!text) return text;
    const textParts = text.split(':');
    const ivPart = textParts.shift();
    if (!ivPart) throw new Error('Invalid encrypted text');

    const iv = Buffer.from(ivPart, 'hex');
    const encryptedText = textParts.join(':');
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
