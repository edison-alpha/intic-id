/**
 * Smart Contract Deployment Script for Pulse Robot Platform
 * Deploys all contracts to Stacks testnet in proper order
 */

const { StacksTestnet, StacksMainnet } = require('@stacks/network');
const {
  makeContractDeploy,
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  createSTXPostCondition,
  FungibleConditionCode,
} = require('@stacks/transactions');
const { readFileSync } = require('fs');
const path = require('path');

// Configuration
const NETWORK = process.env.STACKS_NETWORK === 'mainnet' ? new StacksMainnet() : new StacksTestnet();
const PRIVATE_KEY = process.env.STACKS_PRIVATE_KEY;
const DEPLOYER_ADDRESS = process.env.STACKS_ADDRESS;

if (!PRIVATE_KEY || !DEPLOYER_ADDRESS) {
  throw new Error('Please set STACKS_PRIVATE_KEY and STACKS_ADDRESS environment variables');
}

console.log(`🚀 Deploying to ${NETWORK.coreApiUrl}`);
console.log(`📍 Deployer: ${DEPLOYER_ADDRESS}`);

// Contract sources
const CONTRACTS = {
  'sip-009-nft-trait': 'sip-009-nft-trait.clar',
  'sip-010-trait': 'sip-010-trait.clar',
  'sip-013-semi-fungible-token-trait': 'sip-013-semi-fungible-token-trait.clar',
  'nft-ticket': 'nft-ticket.clar',
  'proof-of-fandom': 'proof-of-fandom.clar',
  'sbtc-payment': 'sbtc-payment.clar',
  'governance': 'governance.clar',
};

// Utility functions
const readContract = (filename) => {
  const contractPath = path.join(__dirname, '..', 'contracts', filename);
  return readFileSync(contractPath, 'utf8');
};

const deployContract = async (contractName, contractCode, fee = 10000) => {
  console.log(`\n📄 Deploying ${contractName}...`);

  const txOptions = {
    contractName,
    codeBody: contractCode,
    senderKey: PRIVATE_KEY,
    network: NETWORK,
    anchorMode: AnchorMode.Any,
    fee,
  };

  try {
    const transaction = await makeContractDeploy(txOptions);
    const result = await broadcastTransaction(transaction, NETWORK);

    console.log(`✅ ${contractName} deployment broadcasted`);
    console.log(`📊 Transaction ID: ${result.txid}`);
    console.log(`🔗 Explorer: ${NETWORK.coreApiUrl.replace('api', 'explorer')}/txid/${result.txid}`);

    return result.txid;
  } catch (error) {
    console.error(`❌ Failed to deploy ${contractName}:`, error);
    throw error;
  }
};

const waitForConfirmation = async (txid) => {
  console.log(`⏳ Waiting for transaction confirmation: ${txid}`);

  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${NETWORK.coreApiUrl}/extended/v1/tx/${txid}`);
      const txData = await response.json();

      if (txData.tx_status === 'success') {
        console.log(`✅ Transaction confirmed: ${txid}`);
        return true;
      } else if (txData.tx_status === 'abort_by_response' || txData.tx_status === 'abort_by_post_condition') {
        console.error(`❌ Transaction failed: ${txData.tx_status}`);
        throw new Error(`Transaction failed: ${txData.tx_status}`);
      }

      console.log(`⏳ Status: ${txData.tx_status}, attempt ${attempts + 1}/${maxAttempts}`);
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      attempts++;
    } catch (error) {
      console.log(`⏳ Checking transaction status, attempt ${attempts + 1}/${maxAttempts}`);
      await new Promise(resolve => setTimeout(resolve, 10000));
      attempts++;
    }
  }

  throw new Error(`Transaction confirmation timeout: ${txid}`);
};

const callContract = async (contractAddress, contractName, functionName, functionArgs = [], fee = 5000) => {
  console.log(`\n🔧 Calling ${contractName}.${functionName}...`);

  const txOptions = {
    contractAddress,
    contractName,
    functionName,
    functionArgs,
    senderKey: PRIVATE_KEY,
    network: NETWORK,
    anchorMode: AnchorMode.Any,
    fee,
    postConditionMode: PostConditionMode.Allow,
  };

  try {
    const transaction = await makeContractCall(txOptions);
    const result = await broadcastTransaction(transaction, NETWORK);

    console.log(`✅ ${contractName}.${functionName} call broadcasted`);
    console.log(`📊 Transaction ID: ${result.txid}`);

    return result.txid;
  } catch (error) {
    console.error(`❌ Failed to call ${contractName}.${functionName}:`, error);
    throw error;
  }
};

// Main deployment function
const deployAll = async () => {
  const deployedContracts = {};

  try {
    console.log('🎬 Starting Pulse Robot Platform deployment...\n');

    // Step 1: Deploy trait contracts first (dependencies)
    console.log('📋 Step 1: Deploying trait contracts...');

    for (const traitName of ['sip-009-nft-trait', 'sip-010-trait', 'sip-013-semi-fungible-token-trait']) {
      const contractCode = readContract(CONTRACTS[traitName]);
      const txid = await deployContract(traitName, contractCode);
      await waitForConfirmation(txid);
      deployedContracts[traitName] = {
        address: DEPLOYER_ADDRESS,
        txid,
        status: 'deployed'
      };
    }

    // Step 2: Deploy core contracts
    console.log('\n🎯 Step 2: Deploying core contracts...');

    // Deploy NFT Ticket contract
    const nftTicketCode = readContract(CONTRACTS['nft-ticket']);
    let txid = await deployContract('nft-ticket', nftTicketCode, 15000);
    await waitForConfirmation(txid);
    deployedContracts['nft-ticket'] = {
      address: DEPLOYER_ADDRESS,
      txid,
      status: 'deployed'
    };

    // Deploy Proof of Fandom contract
    const proofOfFandomCode = readContract(CONTRACTS['proof-of-fandom']);
    txid = await deployContract('proof-of-fandom', proofOfFandomCode, 15000);
    await waitForConfirmation(txid);
    deployedContracts['proof-of-fandom'] = {
      address: DEPLOYER_ADDRESS,
      txid,
      status: 'deployed'
    };

    // Deploy sBTC Payment contract
    const sbtcPaymentCode = readContract(CONTRACTS['sbtc-payment']);
    txid = await deployContract('sbtc-payment', sbtcPaymentCode, 15000);
    await waitForConfirmation(txid);
    deployedContracts['sbtc-payment'] = {
      address: DEPLOYER_ADDRESS,
      txid,
      status: 'deployed'
    };

    // Deploy Governance contract
    const governanceCode = readContract(CONTRACTS['governance']);
    txid = await deployContract('governance', governanceCode, 15000);
    await waitForConfirmation(txid);
    deployedContracts['governance'] = {
      address: DEPLOYER_ADDRESS,
      txid,
      status: 'deployed'
    };

    // Step 3: Initialize contracts
    console.log('\n⚙️  Step 3: Initializing contracts...');

    // Initialize Proof of Fandom with default badge types
    console.log('🏆 Creating default badge types...');

    const { stringUtf8CV, uintCV, boolCV } = require('@stacks/transactions');

    // Create "Event Attendee" badge type
    txid = await callContract(
      DEPLOYER_ADDRESS,
      'proof-of-fandom',
      'create-badge-type',
      [
        stringUtf8CV('Event Attendee'),
        stringUtf8CV('Badge for attending events on the platform'),
        stringUtf8CV('attendance'),
        uintCV(5), // max tier
        boolCV(false), // not transferable
        stringUtf8CV('https://pulse-robot.com/metadata/badges/attendee.json')
      ]
    );
    await waitForConfirmation(txid);

    // Create "Community Champion" badge type
    txid = await callContract(
      DEPLOYER_ADDRESS,
      'proof-of-fandom',
      'create-badge-type',
      [
        stringUtf8CV('Community Champion'),
        stringUtf8CV('Badge for active community participation'),
        stringUtf8CV('community'),
        uintCV(3),
        boolCV(true), // transferable
        stringUtf8CV('https://pulse-robot.com/metadata/badges/champion.json')
      ]
    );
    await waitForConfirmation(txid);

    // Create "Early Adopter" badge type
    txid = await callContract(
      DEPLOYER_ADDRESS,
      'proof-of-fandom',
      'create-badge-type',
      [
        stringUtf8CV('Early Adopter'),
        stringUtf8CV('Badge for early platform adopters'),
        stringUtf8CV('special'),
        uintCV(1),
        boolCV(true),
        stringUtf8CV('https://pulse-robot.com/metadata/badges/early-adopter.json')
      ]
    );
    await waitForConfirmation(txid);

    // Initialize Governance with default proposal types
    console.log('🗳️ Setting up governance proposal types...');

    txid = await callContract(
      DEPLOYER_ADDRESS,
      'governance',
      'add-proposal-type',
      [
        stringUtf8CV('treasury-spend'),
        uintCV(100000000), // 1 sBTC
        uintCV(1500), // 15% quorum
        uintCV(288), // 2 day delay
        boolCV(false)
      ]
    );
    await waitForConfirmation(txid);

    txid = await callContract(
      DEPLOYER_ADDRESS,
      'governance',
      'add-proposal-type',
      [
        stringUtf8CV('parameter-change'),
        uintCV(50000000), // 0.5 sBTC
        uintCV(1000), // 10% quorum
        uintCV(432), // 3 day delay
        boolCV(true) // requires super majority
      ]
    );
    await waitForConfirmation(txid);

    // Create default staking pool
    console.log('💰 Creating default staking pool...');

    txid = await callContract(
      DEPLOYER_ADDRESS,
      'sbtc-payment',
      'create-staking-pool',
      [
        stringUtf8CV('Genesis Pool'),
        uintCV(1500), // 15% APY
        uintCV(1000000), // 0.01 sBTC minimum
        uintCV(52560), // 1 year lock
        uintCV(1000000000000) // 10,000 sBTC max capacity
      ]
    );
    await waitForConfirmation(txid);

    // Step 4: Create sample events (optional for testnet)
    if (NETWORK instanceof StacksTestnet) {
      console.log('\n🎪 Step 4: Creating sample events for testnet...');

      const currentTime = Math.floor(Date.now() / 1000);
      const futureDate = currentTime + (30 * 24 * 60 * 60); // 30 days from now

      txid = await callContract(
        DEPLOYER_ADDRESS,
        'nft-ticket',
        'create-event',
        [
          stringUtf8CV('Bitcoin Conference 2025'),
          stringUtf8CV('The premier Bitcoin conference featuring industry leaders and innovators'),
          stringUtf8CV('Austin Convention Center, Austin, TX'),
          uintCV(futureDate),
          uintCV(futureDate + 3600), // 1 hour later
          stringUtf8CV('conference'),
          uintCV(5000000), // 0.05 sBTC
          uintCV(1000),
          uintCV(500), // 5% royalty
          boolCV(true), // early access
          uintCV(futureDate - (7 * 24 * 60 * 60)), // early access ends 7 days before
          stringUtf8CV('https://pulse-robot.com/metadata/events/bitcoin-conf-2025.json')
        ]
      );
      await waitForConfirmation(txid);
    }

    console.log('\n🎉 Deployment Summary:');
    console.log('========================');

    for (const [contractName, details] of Object.entries(deployedContracts)) {
      console.log(`✅ ${contractName}`);
      console.log(`   Address: ${details.address}`);
      console.log(`   TX ID: ${details.txid}`);
      console.log(`   Status: ${details.status}`);
    }

    console.log('\n📋 Contract Addresses for Frontend:');
    console.log('===================================');
    console.log(`NFT_TICKET_CONTRACT=${DEPLOYER_ADDRESS}.nft-ticket`);
    console.log(`PROOF_OF_FANDOM_CONTRACT=${DEPLOYER_ADDRESS}.proof-of-fandom`);
    console.log(`SBTC_PAYMENT_CONTRACT=${DEPLOYER_ADDRESS}.sbtc-payment`);
    console.log(`GOVERNANCE_CONTRACT=${DEPLOYER_ADDRESS}.governance`);

    console.log('\n🔗 Next Steps:');
    console.log('==============');
    console.log('1. Add the contract addresses to your .env file');
    console.log('2. Update your frontend services to use the deployed contracts');
    console.log('3. Test the integration with your Turnkey wallet');
    console.log('4. Create your first event and start selling NFT tickets!');

    return deployedContracts;

  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    console.log('\n📋 Deployed contracts so far:');
    for (const [contractName, details] of Object.entries(deployedContracts)) {
      console.log(`✅ ${contractName}: ${details.address} (${details.txid})`);
    }
    process.exit(1);
  }
};

// Execute deployment
if (require.main === module) {
  deployAll()
    .then(() => {
      console.log('\n🚀 Deployment completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Deployment failed:', error);
      process.exit(1);
    });
}

module.exports = { deployAll, deployContract, callContract, waitForConfirmation };