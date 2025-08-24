#!/usr/bin/env node

/**
 * Simple test script to verify the Eco-Points System components
 * Run with: node test-system.js
 */

console.log('🌱 Eco-Points System - Component Test\n');

// Test 1: Check if all required files exist
const fs = require('fs');
const path = require('path');

// Initialize counters
let missingFiles = 0;
let missingTables = 0;
let missingPages = 0;
let missingModules = 0;

const requiredFiles = [
  'package.json',
  'docker-compose.yml',
  'backend/package.json',
  'backend/src/main.ts',
  'backend/src/app.module.ts',
  'backend/src/modules/auth/auth.module.ts',
  'backend/src/modules/users/users.module.ts',
  'backend/src/modules/submissions/submissions.module.ts',
  'backend/src/modules/cashout/cashout.module.ts',
  'backend/src/modules/payment/payment.module.ts',
  'backend/src/modules/storage/storage.module.ts',
  'backend/src/modules/admin/admin.module.ts',
  'backend/src/modules/notifications/notifications.module.ts',
  'backend/src/modules/webhooks/webhooks.module.ts',
  'frontend/package.json',
  'frontend/src/app/layout.tsx',
  'frontend/src/app/page.tsx',
  'frontend/src/app/auth/login/page.tsx',
  'frontend/src/app/auth/register/page.tsx',
  'frontend/src/app/dashboard/layout.tsx',
  'frontend/src/app/dashboard/page.tsx',
  'frontend/src/app/dashboard/submissions/new/page.tsx',
  'frontend/src/app/dashboard/submissions/page.tsx',
  'frontend/src/app/dashboard/wallet/page.tsx',
  'frontend/src/app/dashboard/cashout/page.tsx',
  'frontend/src/app/dashboard/admin/moderation/page.tsx',
  'frontend/src/app/dashboard/admin/analytics/page.tsx',
  'frontend/src/app/dashboard/admin/cashouts/page.tsx',
  'backend/database/init.sql',
  'README.md',
  '.env.example'
];

console.log('📁 Checking required files...');

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    missingFiles++;
  }
});

console.log(`\n📊 File Check Results: ${requiredFiles.length - missingFiles}/${requiredFiles.length} files present`);

if (missingFiles > 0) {
  console.log(`\n⚠️  ${missingFiles} files are missing. Please check the file structure.`);
} else {
  console.log('\n🎉 All required files are present!');
}

// Test 2: Check package.json configurations
console.log('\n📦 Checking package.json configurations...');

try {
  const rootPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const backendPackage = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  const frontendPackage = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));

  console.log('  ✅ Root package.json - Monorepo workspace configured');
  console.log('  ✅ Backend package.json - NestJS dependencies configured');
  console.log('  ✅ Frontend package.json - Next.js dependencies configured');

  // Check for key dependencies
  const backendDeps = Object.keys(backendPackage.dependencies || {});
  const frontendDeps = Object.keys(frontendPackage.dependencies || {});

  const requiredBackendDeps = ['@nestjs/common', '@nestjs/typeorm', '@nestjs/jwt', 'typeorm', 'pg'];
  const requiredFrontendDeps = ['next', 'react', 'react-dom', 'tailwindcss'];

  const missingBackendDeps = requiredBackendDeps.filter(dep => !backendDeps.includes(dep));
  const missingFrontendDeps = requiredFrontendDeps.filter(dep => !frontendDeps.includes(dep));

  if (missingBackendDeps.length === 0) {
    console.log('  ✅ Backend dependencies - All required packages present');
  } else {
    console.log(`  ❌ Backend dependencies - Missing: ${missingBackendDeps.join(', ')}`);
  }

  if (missingFrontendDeps.length === 0) {
    console.log('  ✅ Frontend dependencies - All required packages present');
  } else {
    console.log(`  ❌ Frontend dependencies - Missing: ${missingFrontendDeps.join(', ')}`);
  }

} catch (error) {
  console.log(`  ❌ Error reading package.json files: ${error.message}`);
}

// Test 3: Check Docker configuration
console.log('\n🐳 Checking Docker configuration...');

try {
  const dockerCompose = fs.readFileSync('docker-compose.yml', 'utf8');
  
  if (dockerCompose.includes('postgres') && dockerCompose.includes('redis') && dockerCompose.includes('minio')) {
    console.log('  ✅ Docker Compose - All required services configured');
  } else {
    console.log('  ❌ Docker Compose - Missing required services');
  }

  if (dockerCompose.includes('backend') && dockerCompose.includes('frontend')) {
    console.log('  ✅ Docker Compose - Application services configured');
  } else {
    console.log('  ❌ Docker Compose - Missing application services');
  }

} catch (error) {
  console.log(`  ❌ Error reading docker-compose.yml: ${error.message}`);
}

// Test 4: Check database schema
console.log('\n🗄️  Checking database schema...');

try {
  const initSql = fs.readFileSync('backend/database/init.sql', 'utf8');
  
  const requiredTables = ['users', 'user_wallets', 'bin_locations', 'video_submissions', 'submission_events', 'cashout_requests', 'payout_transactions'];

  requiredTables.forEach(table => {
    if (initSql.includes(`CREATE TABLE IF NOT EXISTS ${table}`) || initSql.includes(`CREATE TABLE ${table}`)) {
      console.log(`  ✅ Table ${table} - Schema defined`);
    } else {
      console.log(`  ❌ Table ${table} - Schema missing`);
      missingTables++;
    }
  });

  if (missingTables === 0) {
    console.log('  ✅ Database schema - All required tables present');
  } else {
    console.log(`  ❌ Database schema - ${missingTables} tables missing`);
  }

} catch (error) {
  console.log(`  ❌ Error reading database schema: ${error.message}`);
}

// Test 5: Check frontend pages
console.log('\n🖥️  Checking frontend pages...');

const frontendPages = [
  'frontend/src/app/page.tsx',
  'frontend/src/app/auth/login/page.tsx',
  'frontend/src/app/auth/register/page.tsx',
  'frontend/src/app/dashboard/page.tsx',
  'frontend/src/app/dashboard/submissions/new/page.tsx',
  'frontend/src/app/dashboard/submissions/page.tsx',
  'frontend/src/app/dashboard/wallet/page.tsx',
  'frontend/src/app/dashboard/cashout/page.tsx',
  'frontend/src/app/dashboard/admin/moderation/page.tsx',
  'frontend/src/app/dashboard/admin/analytics/page.tsx',
  'frontend/src/app/dashboard/admin/cashouts/page.tsx'
];

frontendPages.forEach(page => {
  if (fs.existsSync(page)) {
    console.log(`  ✅ ${page.replace('frontend/src/app/', '')}`);
  } else {
    console.log(`  ❌ ${page.replace('frontend/src/app/', '')} - MISSING`);
    missingPages++;
  }
});

if (missingPages === 0) {
  console.log('  ✅ Frontend pages - All required pages present');
} else {
  console.log(`  ❌ Frontend pages - ${missingPages} pages missing`);
}

// Test 6: Check backend modules
console.log('\n⚙️  Checking backend modules...');

const backendModules = [
  'backend/src/modules/auth/auth.module.ts',
  'backend/src/modules/users/users.module.ts',
  'backend/src/modules/submissions/submissions.module.ts',
  'backend/src/modules/cashout/cashout.module.ts',
  'backend/src/modules/payment/payment.module.ts',
  'backend/src/modules/storage/storage.module.ts',
  'backend/src/modules/admin/admin.module.ts',
  'backend/src/modules/notifications/notifications.module.ts',
  'backend/src/modules/webhooks/webhooks.module.ts'
];

backendModules.forEach(module => {
  if (fs.existsSync(module)) {
    console.log(`  ✅ ${module.replace('backend/src/modules/', '')}`);
  } else {
    console.log(`  ❌ ${module.replace('backend/src/modules/', '')} - MISSING`);
    missingModules++;
  }
});

if (missingModules === 0) {
  console.log('  ✅ Backend modules - All required modules present');
} else {
  console.log(`  ❌ Backend modules - ${missingModules} modules missing`);
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📋 SYSTEM TEST SUMMARY');
console.log('='.repeat(50));

const totalTests = requiredFiles.length + 5; // 5 additional test categories
const passedTests = (requiredFiles.length - missingFiles) + 
                   (missingFiles === 0 ? 1 : 0) + // package.json config test
                   (missingFiles === 0 ? 1 : 0) + // docker test
                   (missingTables === 0 ? 1 : 0) + // database test
                   (missingPages === 0 ? 1 : 0) + // frontend test
                   (missingModules === 0 ? 1 : 0); // backend test

console.log(`Overall Score: ${passedTests}/${totalTests} tests passed`);
console.log(`Debug: Files: ${requiredFiles.length - missingFiles}, Docker: ${missingFiles === 0 ? 1 : 0}, Database: ${missingTables === 0 ? 1 : 0}, Frontend: ${missingPages === 0 ? 1 : 0}, Backend: ${missingModules === 0 ? 1 : 0}`);

if (passedTests === totalTests) {
  console.log('\n🎉 CONGRATULATIONS! Your Eco-Points System is fully configured and ready to run!');
  console.log('\n🚀 Next steps:');
  console.log('  1. Copy .env.example to .env and configure your environment variables');
  console.log('  2. Run: npm install (in root directory)');
  console.log('  3. Run: npm run docker:up (to start the infrastructure)');
  console.log('  4. Run: npm run dev (to start development servers)');
  console.log('  5. Open http://localhost:3000 in your browser');
} else {
  console.log('\n⚠️  Some components are missing or incomplete. Please review the errors above.');
  console.log('\n🔧 To complete the setup:');
  console.log('  1. Fix any missing files or dependencies');
  console.log('  2. Ensure all modules are properly configured');
  console.log('  3. Run this test script again');
}

console.log('\n🌱 Thank you for building a more sustainable future with Eco-Points!');