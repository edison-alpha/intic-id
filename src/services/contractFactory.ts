/**
 * Contract Factory Service
 * Handles interaction with NFT Contract Factory smart contract
 * Enables deployment of custom NFT ticket contracts for events
 */

import {
  makeContractCall,
  callReadOnlyFunction,
  cvToValue,
  stringUtf8CV,
  uintCV,
  boolCV,
  standardPrincipalCV,
  AnchorMode,
  PostConditionMode,
} from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';
import type { StacksNetwork } from '@stacks/network';

export interface ContractTemplate {
  id: string;
  name: string;
  baseFee: number;
  features: string[];
  category: 'basic' | 'premium' | 'festival';
}

export interface DeploymentData {
  eventName: string;
  eventDescription: string;
  venue: string;
  totalSupply: number;
  ticketPrice: number;
  royaltyPercentage: number;
  metadataUri?: string;
}

export interface DeploymentResult {
  txId: string;
  contractAddress: string;
  queueId: number;
  estimatedTime: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

class ContractFactoryService {
  private network: StacksNetwork;
  private contractAddress: string;
  private contractName: string;

  constructor() {
    this.network = new StacksTestnet();
    // Contract factory address (would be deployed first)
    this.contractAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'; // Example address
    this.contractName = 'nft-contract-factory';
  }

  /**
   * Get deployment fee for a specific template
   */
  async getDeploymentFee(template: string): Promise<number> {
    try {
      const result = await callReadOnlyFunction({
        network: this.network,
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-deployment-fee',
        functionArgs: [stringUtf8CV(template)],
        senderAddress: this.contractAddress,
      });

      const fee = cvToValue(result);
      return fee.value / 1000000; // Convert from microSTX to STX
    } catch (error) {
      console.error('Error getting deployment fee:', error);
      // Return default fees based on template
      switch (template) {
        case 'basic': return 0.05;
        case 'premium': return 0.2;
        case 'festival': return 0.5;
        default: return 0.05;
      }
    }
  }

  /**
   * Deploy basic event contract
   */
  async deployBasicContract(
    deploymentData: DeploymentData,
    privateKey: string
  ): Promise<DeploymentResult> {
    const { eventName, totalSupply, ticketPrice } = deploymentData;

    const functionArgs = [
      stringUtf8CV(eventName),
      stringUtf8CV(deploymentData.eventDescription || ''),
      stringUtf8CV(deploymentData.venue || ''),
      uintCV(totalSupply),
      uintCV(Math.floor(ticketPrice * 1000000)), // Convert to microSTX
    ];

    return this.executeDeployment('deploy-basic-contract', functionArgs, privateKey);
  }

  /**
   * Deploy premium event contract
   */
  async deployPremiumContract(
    deploymentData: DeploymentData,
    privateKey: string
  ): Promise<DeploymentResult> {
    const { eventName, eventDescription, venue, totalSupply, ticketPrice, royaltyPercentage } = deploymentData;

    const functionArgs = [
      stringUtf8CV(eventName),
      stringUtf8CV(eventDescription || ''),
      stringUtf8CV(venue || ''),
      uintCV(totalSupply),
      uintCV(Math.floor(ticketPrice * 1000000)),
      uintCV(royaltyPercentage),
      boolCV(true), // early access enabled
    ];

    return this.executeDeployment('deploy-premium-contract', functionArgs, privateKey);
  }

  /**
   * Deploy festival event contract
   */
  async deployFestivalContract(
    deploymentData: DeploymentData,
    privateKey: string
  ): Promise<DeploymentResult> {
    const { eventName, eventDescription, venue, totalSupply, ticketPrice, royaltyPercentage } = deploymentData;

    const functionArgs = [
      stringUtf8CV(eventName),
      stringUtf8CV(eventDescription || ''),
      stringUtf8CV(venue || ''),
      uintCV(totalSupply),
      uintCV(Math.floor(ticketPrice * 1000000)),
      uintCV(royaltyPercentage),
      uintCV(3), // multi-day access (3 days)
    ];

    return this.executeDeployment('deploy-festival-contract', functionArgs, privateKey);
  }

  /**
   * Execute contract deployment
   */
  private async executeDeployment(
    functionName: string,
    functionArgs: any[],
    privateKey: string
  ): Promise<DeploymentResult> {
    try {
      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName,
        functionArgs,
        senderKey: privateKey,
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        fee: 200000, // 0.2 STX fee
      };

      const transaction = await makeContractCall(txOptions);
      const txId = transaction.txid();

      // Generate queue ID for tracking
      const queueId = Math.floor(Math.random() * 10000);

      return {
        txId,
        contractAddress: '', // Will be available after mining
        queueId,
        estimatedTime: 300, // 5 minutes estimated
        status: 'pending'
      };

    } catch (error: any) {
      console.error('Deployment failed:', error);
      throw new Error(`Contract deployment failed: ${error.message}`);
    }
  }

  /**
   * Get deployment info for a user
   */
  async getDeploymentInfo(deployerAddress: string): Promise<any> {
    try {
      const result = await callReadOnlyFunction({
        network: this.network,
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-deployment-info',
        functionArgs: [standardPrincipalCV(deployerAddress)],
        senderAddress: this.contractAddress,
      });

      return cvToValue(result);
    } catch (error) {
      console.error('Error getting deployment info:', error);
      return null;
    }
  }

  /**
   * Get contract info by address
   */
  async getContractInfo(contractAddress: string): Promise<any> {
    try {
      const result = await callReadOnlyFunction({
        network: this.network,
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-contract-info',
        functionArgs: [stringUtf8CV(contractAddress)],
        senderAddress: this.contractAddress,
      });

      return cvToValue(result);
    } catch (error) {
      console.error('Error getting contract info:', error);
      return null;
    }
  }

  /**
   * Get total deployments count
   */
  async getTotalDeployments(): Promise<number> {
    try {
      const result = await callReadOnlyFunction({
        network: this.network,
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-total-deployments',
        functionArgs: [],
        senderAddress: this.contractAddress,
      });

      return cvToValue(result).value;
    } catch (error) {
      console.error('Error getting total deployments:', error);
      return 0;
    }
  }

  /**
   * Check if user owns a contract
   */
  async isContractOwner(contractAddress: string, userAddress: string): Promise<boolean> {
    try {
      const result = await callReadOnlyFunction({
        network: this.network,
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'is-contract-owner',
        functionArgs: [
          stringUtf8CV(contractAddress),
          standardPrincipalCV(userAddress)
        ],
        senderAddress: this.contractAddress,
      });

      return cvToValue(result).value;
    } catch (error) {
      console.error('Error checking contract ownership:', error);
      return false;
    }
  }
}

// Export singleton instance
export const contractFactoryService = new ContractFactoryService();
export default contractFactoryService;
