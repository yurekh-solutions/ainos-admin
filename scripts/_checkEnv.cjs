// Diagnostic: shows how Next.js loads ADMIN_PASSWORD_HASH from .env.local
const path = require('path');
const root = path.join(__dirname, '..');
const { loadEnvConfig } = require(require.resolve('@next/env', { paths: [root] }));
loadEnvConfig(root, true);
const h = process.env.ADMIN_PASSWORD_HASH || '';
console.log('ADMIN_EMAILS =', process.env.ADMIN_EMAILS);
console.log('hash length  =', h.length, '(valid bcrypt = 60)');
console.log('hash prefix  =', h.slice(0, 7));
