#!/usr/bin/env node
/**
 * Approve all pending companies in AINOS
 * Usage: node approve-all.cjs
 */
const { spawnSync } = require('child_process');

const ADMIN_EMAIL = 'yurekhsolutions@gmail.com';
const BASE_URL = 'http://localhost:3000';

function api(method, path, body, cookie) {
  const opts = {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  };
  const args = ['-s', '-o', '-', '-w', '\n%{http_code}'];
  args.push('-X', method);
  if (body) {
    args.push('-H', 'Content-Type: application/json');
    args.push('-d', JSON.stringify(body));
  }
  if (cookie) {
    args.push('-b', cookie);
  }
  args.push(`${BASE_URL}${path}`);
  const result = spawnSync('curl', args, opts);
  const output = (result.stdout || '').trim();
  const lines = output.split('\n');
  const statusCode = lines[lines.length - 1];
  const body_str = lines.slice(0, -1).join('\n');
  return { statusCode: parseInt(statusCode), body: body_str };
}

async function main() {
  console.log('=== AINOS Batch Company Approver ===\n');

  // Step 1: Login to get session cookie
  console.log('1. Logging in...');
  const loginRes = api('POST', '/api/login', { email: ADMIN_EMAIL, password: 'admin123' });
  console.log(`   Login status: ${loginRes.statusCode}`);

  // Extract cookie from Set-Cookie header
  const cookieMatch = loginRes.body.match(/admin_session=([^;]+)/);
  if (!cookieMatch) {
    console.error('   Failed to get session cookie. Response:', loginRes.body.substring(0, 200));
    process.exit(1);
  }
  const cookie = `admin_session=${cookieMatch[1]}`;
  console.log('   Logged in successfully\n');

  // Step 2: Get all pending companies
  console.log('2. Fetching pending companies...');
  const companiesRes = api('GET', '/api/admin/companies?limit=100&status=pending', null, cookie);
  console.log(`   Status: ${companiesRes.statusCode}`);

  let companies = [];
  try {
    const data = JSON.parse(companiesRes.body);
    companies = data.companies || [];
  } catch (e) {
    console.error('   Failed to parse companies:', companiesRes.body.substring(0, 200));
    process.exit(1);
  }

  // Also fetch docs_submitted and under_review
  for (const status of ['docs_submitted', 'under_review']) {
    const res = api('GET', `/api/admin/companies?limit=100&status=${status}`, null, cookie);
    try {
      const data = JSON.parse(res.body);
      companies = companies.concat(data.companies || []);
    } catch (e) {}
  }

  console.log(`   Found ${companies.length} companies to approve\n`);

  if (companies.length === 0) {
    console.log('   No pending companies found. All done!');
    process.exit(0);
  }

  // Step 3: Approve each company
  console.log('3. Approving companies...\n');
  let approved = 0;
  let failed = 0;

  for (const company of companies) {
    const res = api('POST', `/api/admin/onboarding/${company.id}`, { action: 'approve' }, cookie);
    if (res.statusCode === 200) {
      console.log(`   ✅ ${company.name} — approved`);
      approved++;
    } else {
      console.log(`   ❌ ${company.name} — failed (${res.statusCode})`);
      failed++;
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Approved: ${approved}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${companies.length}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
