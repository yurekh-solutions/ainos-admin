// Diagnostic: POSTs credentials to the live admin /api/login and prints the result
const [email, password, base = 'https://ainos-admin.vercel.app'] = process.argv.slice(2);
fetch(`${base}/api/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
})
  .then(async (r) => console.log(r.status, await r.text()))
  .catch((e) => console.error('request failed:', e.message));
