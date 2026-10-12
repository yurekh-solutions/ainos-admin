#!/usr/bin/env node
/**
 * Approve all pending companies directly via Prisma
 * Usage: node approve-all-direct.cjs
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const eqIdx = line.indexOf('=');
    if (eqIdx > 0) {
      const key = line.substring(0, eqIdx).trim();
      let val = line.substring(eqIdx + 1).trim();
      // Strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (key && val) process.env[key] = val;
    }
  });
}

const prisma = new PrismaClient();

async function main() {
  console.log('=== AINOS Batch Company Approver (Direct DB) ===\n');

  // Find all pending companies
  const pendingCompanies = await prisma.company.findMany({
    where: {
      onboardingStatus: { in: ['pending', 'docs_submitted', 'under_review'] },
    },
    select: {
      id: true,
      name: true,
      onboardingStatus: true,
      users: { select: { email: true, name: true } },
    },
  });

  console.log(`Found ${pendingCompanies.length} companies to approve:\n`);

  if (pendingCompanies.length === 0) {
    console.log('No pending companies. All done!');
    process.exit(0);
  }

  let approved = 0;
  let failed = 0;

  for (const company of pendingCompanies) {
    try {
      // Update company status
      await prisma.company.update({
        where: { id: company.id },
        data: {
          onboardingStatus: 'approved',
          docsVerified: true,
          docsVerifiedAt: new Date(),
          docsVerifiedBy: 'yurekhsolutions@gmail.com',
          onboardingReviewedAt: new Date(),
          onboardingReviewedBy: 'yurekhsolutions@gmail.com',
          onboardingRejectionReason: null,
        },
      });

      // Approve all pending documents
      const pendingDocs = await prisma.document.findMany({
        where: { companyId: company.id, verificationStatus: 'pending' },
      });

      if (pendingDocs.length > 0) {
        await prisma.document.updateMany({
          where: { companyId: company.id, verificationStatus: 'pending' },
          data: {
            verificationStatus: 'approved',
            verifiedBy: 'yurekhsolutions@gmail.com',
            verifiedAt: new Date(),
          },
        });

        await prisma.company.update({
          where: { id: company.id },
          data: { totalDocsApproved: pendingDocs.length },
        });
      }

      console.log(`   ✅ ${company.name} (${company.onboardingStatus} → approved)`);
      approved++;
    } catch (error) {
      console.log(`   ❌ ${company.name} — ${error.message}`);
      failed++;
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Approved: ${approved}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${pendingCompanies.length}`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
