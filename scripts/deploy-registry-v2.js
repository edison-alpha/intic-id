// Deploy Event Registry V2 - Simplified Version
// Usage: node scripts/deploy-registry-v2.js

import { makeContractDeploy, broadcastTransaction, AnchorMode } from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const NETWORK = new StacksTestnet();
const CONTRACT_NAME = 'event-registry-v2';

// Private key from environment or use test key
const PRIVATE_KEY = process.env.STACKS_PRIVATE_KEY || 
  'your-private-key-here'; // REPLACE WITH YOUR KEY

async function deployRegistryV2() {
  try {
    console.log('🚀 Deploying Event Registry V2 (Simplified)...\n');

    // Read contract code
    const contractPath = path.join(__dirname, '..', 'contracts', 'intic-smart-contracts', 'event-registry-v2.clar');
    const contractCode = fs.readFileSync(contractPath, 'utf8');

    console.log('📄 Contract:', CONTRACT_NAME);
    console.log('📏 Code size:', contractCode.length, 'bytes');
    console.log('🌐 Network: Testnet\n');

    // Create deployment transaction
    const txOptions = {
      contractName: CONTRACT_NAME,
      codeBody: contractCode,
      senderKey: PRIVATE_KEY,
      network: NETWORK,
      anchorMode: AnchorMode.Any,
    };

    console.log('🔨 Building transaction...');
    const transaction = await makeContractDeploy(txOptions);

    console.log('📡 Broadcasting transaction...');
    const broadcastResponse = await broadcastTransaction(transaction, NETWORK);

    if (broadcastResponse.error) {
      console.error('❌ Deployment failed:', broadcastResponse.error);
      console.error('Reason:', broadcastResponse.reason);
      process.exit(1);
    }

    const txId = broadcastResponse.txid;
    console.log('\n✅ Registry V2 deployed successfully!');
    console.log('📝 Transaction ID:', txId);
    console.log('🔗 Explorer:', `https://explorer.hiro.so/txid/${txId}?chain=testnet`);
    console.log('\n⏳ Wait ~30 seconds for confirmation...');
    console.log('\n📋 Key Changes in V2:');
    console.log('   ✅ Removed duplicate metadata (name, description, venue, etc)');
    console.log('   ✅ Only stores contract addresses');
    console.log('   ✅ Details fetched from contracts via indexer');
    console.log('   ✅ Like OpenSea architecture');
    console.log('   ✅ No sync needed - always fresh data!');

    // Save deployment info
    const deploymentInfo = {
      contractName: CONTRACT_NAME,
      txId: txId,
      network: 'testnet',
      deployedAt: new Date().toISOString(),
      explorerUrl: `https://explorer.hiro.so/txid/${txId}?chain=testnet`,
    };

    const infoPath = path.join(__dirname, '..', 'deployment-registry-v2.json');
    fs.writeFileSync(infoPath, JSON.stringify(deploymentInfo, null, 2));
    console.log('\n💾 Deployment info saved to:', infoPath);

  } catch (error) {
    console.error('❌ Error deploying registry:', error);
    process.exit(1);
  }
}

// Run deployment
deployRegistryV2();
