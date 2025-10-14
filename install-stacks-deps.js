// Install required Stacks dependencies
import { execSync } from 'child_process';

const dependencies = [
  '@stacks/transactions',
  '@stacks/network',
  '@stacks/common',
  '@stacks/auth',
  '@stacks/connect',
  '@turnkey/react-wallet-kit'
];

console.log('Installing Stacks blockchain dependencies...');

try {
  execSync(`npm install ${dependencies.join(' ')}`, { stdio: 'inherit' });
  console.log('✅ All dependencies installed successfully!');
} catch (error) {
  console.error('❌ Error installing dependencies:', error.message);
  process.exit(1);
}