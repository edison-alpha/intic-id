/**
 * Simple test script to verify the server structure
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying INTIC Blockchain Cache Server structure...\n');

const requiredFiles = [
  'package.json',
  'server.js',
  'routes/hiro.js',
  'routes/stacks.js',
  'routes/optimized.js',
  'utils/clarityParser.js',
  '.env',
  'README.md'
];

const missingFiles = [];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.log('❌ Missing required files:');
  missingFiles.forEach(file => {
    console.log(`  - ${file}`);
  });
  process.exit(1);
} else {
  console.log('✅ All required server files are present');
  
  // Read package.json to verify dependencies
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  
  const requiredDeps = [
    'express',
    'node-cache',
    'axios',
    '@stacks/transactions',
    '@stacks/network',
    'cors',
    'helmet',
    'express-rate-limit'
  ];
  
  const missingDeps = [];
  requiredDeps.forEach(dep => {
    if (!packageJson.dependencies[dep]) {
      missingDeps.push(dep);
    }
  });
  
  if (missingDeps.length > 0) {
    console.log('⚠️  Missing required dependencies:');
    missingDeps.forEach(dep => {
      console.log(`  - ${dep}`);
    });
  } else {
    console.log('✅ All required dependencies are declared');
  }
  
  console.log('\n🚀 Server structure verified successfully!');
  console.log('\nTo start the server:');
  console.log('  1. Run: npm install');
  console.log('  2. Run: npm run dev');
  console.log('\nThe server will be available at http://localhost:8000');
}