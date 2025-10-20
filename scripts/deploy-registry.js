/**
 * Deploy Event Registry Contract to Stacks Testnet
 * This is a ONE-TIME deployment that creates the central registry
 */

const { StacksTestnet } = require('@stacks/network');
const { makeContractDeploy, broadcastTransaction, AnchorMode } = require('@stacks/transactions');
const fs = require('fs');
const path = require('path');

// Configuration
const NETWORK = new StacksTestnet();
const CONTRACT_NAME = 'event-registry';
const CONTRACT_PATH = path.join(__dirname, '../contracts/event-registry.clar');

// IMPORTANT: Set this environment variable with your deployer private key
// For testnet, you can get testnet STX from: https://explorer.hiro.so/sandbox/faucet?chain=testnet
const DEPLOYER_KEY = process.env.STACKS_PRIVATE_KEY;

async function deployRegistry() {
  console.log('🚀 Starting Event Registry deployment...\n');

  // Validate private key
  if (!DEPLOYER_KEY) {
    console.error('❌ Error: STACKS_PRIVATE_KEY environment variable not set');
    console.log('\nTo deploy:');
    console.log('1. Get testnet STX from: https://explorer.hiro.so/sandbox/faucet?chain=testnet');
    console.log('2. Set your private key: export STACKS_PRIVATE_KEY=your_key_here');
    console.log('3. Run this script again\n');
    process.exit(1);
  }

  try {
    // Read contract code
    console.log('📄 Reading contract code...');
    const contractCode = fs.readFileSync(CONTRACT_PATH, 'utf8');
    console.log(`   Contract: ${CONTRACT_NAME}.clar`);
    console.log(`   Size: ${contractCode.length} bytes\n`);

    // Prepare deployment transaction
    console.log('📝 Preparing deployment transaction...');
    const txOptions = {
      contractName: CONTRACT_NAME,
      codeBody: contractCode,
      senderKey: DEPLOYER_KEY,
      network: NETWORK,
      anchorMode: AnchorMode.Any,
      fee: 250000, // 0.25 STX deployment fee
    };

    const transaction = await makeContractDeploy(txOptions);

    // Broadcast transaction
    console.log('📡 Broadcasting transaction to Stacks Testnet...');
    const broadcastResponse = await broadcastTransaction(transaction, NETWORK);

    if (broadcastResponse.error) {
      console.error('❌ Deployment failed:', broadcastResponse.error);
      if (broadcastResponse.reason) {
        console.error('   Reason:', broadcastResponse.reason);
      }
      process.exit(1);
    }

    // Success
    console.log('\n✅ Event Registry deployed successfully!\n');
    console.log('📋 Deployment Details:');
    console.log(`   Transaction ID: ${broadcastResponse.txid}`);
    console.log(`   Contract Name: ${CONTRACT_NAME}`);
    console.log(`   Explorer: https://explorer.hiro.so/txid/${broadcastResponse.txid}?chain=testnet\n`);

    // Save deployment info
    const deploymentInfo = {
      contractName: CONTRACT_NAME,
      txId: broadcastResponse.txid,
      network: 'testnet',
      deployedAt: new Date().toISOString(),
      status: 'pending',
    };

    const deploymentFile = path.join(__dirname, '../deployments/event-registry.json');
    fs.mkdirSync(path.dirname(deploymentFile), { recursive: true });
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

    console.log('💾 Deployment info saved to: deployments/event-registry.json');
    console.log('\n⏳ Please wait for transaction confirmation (usually 10-20 minutes)');
    console.log('   You can track progress at the explorer link above\n');

    // Next steps
    console.log('📌 NEXT STEPS:');
    console.log('1. Wait for transaction confirmation');
    console.log('2. Update REGISTRY_CONTRACT_ADDRESS in your frontend config');
    console.log('3. Start creating events!\n');

  } catch (error) {
    console.error('❌ Deployment error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run deployment
deployRegistry().catch(console.error);
