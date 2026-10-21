// Sets the admin password: writes a bcrypt hash into .env.local ($ escaped so
// Next.js doesn't expand it) and a raw copy to .vercel-tmp/admin_hash.txt for Vercel.
// Usage: node scripts/_setAdminPassword.cjs <password>
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const bcrypt = require(require.resolve('bcryptjs', { paths: [root] }));

const password = process.argv[2];
if (!password) { console.error('Usage: node scripts/_setAdminPassword.cjs <password>'); process.exit(1); }

const hash = bcrypt.hashSync(password, 12);
const envPath = path.join(root, '.env.local');
const escaped = hash.replace(/\$/g, '\\$');
const env = fs.readFileSync(envPath, 'utf8');
const line = `ADMIN_PASSWORD_HASH=${escaped}`;
const next = /^ADMIN_PASSWORD_HASH=.*$/m.test(env)
  ? env.replace(/^ADMIN_PASSWORD_HASH=.*$/m, () => line)
  : env.trimEnd() + '\n' + line + '\n';
fs.writeFileSync(envPath, next);

fs.mkdirSync(path.join(root, '.vercel-tmp'), { recursive: true });
fs.writeFileSync(path.join(root, '.vercel-tmp', 'admin_hash.txt'), hash);
console.log('verify:', bcrypt.compareSync(password, hash));
