# 🔧 IMPLEMENTASI LENGKAP - Event Registry Integration

## File yang Perlu Diupdate

### 1. src/pages/CreateEventNFT.tsx

Tambahkan setelah line 860 (setelah deployment berhasil):

```typescript
// ============================================================================
// EVENT REGISTRY INTEGRATION
// ============================================================================

const registerToEventRegistry = async (
  contractId: string,
  contractName: string
) => {
  try {
    console.log('📝 Step: Registering to Event Registry...');
    toast.info('Registering event to platform registry...');
    
    // Calculate event date in blocks (approximate)
    const eventDateTime = new Date(`${formData.eventDate} ${formData.eventTime || '00:00'}`);
    const currentTime = Date.now();
    const timeUntilEvent = eventDateTime.getTime() - currentTime;
    const blocksUntilEvent = Math.floor(timeUntilEvent / 1000 / 600); // ~10 min per block
    const eventDateBlock = Math.max(1, blocksUntilEvent); // Ensure positive
    
    // Prepare coordinates
    const coordinates = selectedVenue?.coordinates 
      ? `${selectedVenue.coordinates.lat.toFixed(6)},${selectedVenue.coordinates.lon.toFixed(6)}`
      : "0,0";
    
    // Convert price to micro-units
    const priceInMicro = Math.floor(parseFloat(formData.ticketPrice) * 1000000);
    
    // Registry contract (update with actual deployed address)
    const REGISTRY_CONTRACT = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.event-registry-full-fixed';
    
    console.log('📋 Registry data:', {
      contractId,
      contractName,
      eventName: formData.eventName,
      category: formData.category,
      venue: formData.venue,
      eventDateBlock,
      price: priceInMicro,
      supply: parseInt(formData.totalSupply)
    });

    // Prepare transaction using Stacks.js
    const {openContractCall } = await import('@stacks/connect');
    const { uintCV, principalCV, stringAsciiCV, stringUtf8CV } = await import('@stacks/transactions');
    
    await openContractCall({
      contractAddress: REGISTRY_CONTRACT.split('.')[0],
      contractName: REGISTRY_CONTRACT.split('.')[1],
      functionName: 'register-event',
      functionArgs: [
        principalCV(contractId),                              // contract-address
        stringAsciiCV(contractName.substring(0, 128)),        // contract-name
        stringUtf8CV(formData.eventName.substring(0, 256)),   // event-name
        stringUtf8CV((formData.description || "No description").substring(0, 1024)), // description
        stringAsciiCV(formData.category.substring(0, 64)),    // category
        stringUtf8CV(formData.venue.substring(0, 256)),       // venue
        stringUtf8CV((formData.venueAddress || formData.venue).substring(0, 512)), // venue-address
        stringAsciiCV(coordinates.substring(0, 64)),          // venue-coordinates
        uintCV(eventDateBlock),                               // event-date
        uintCV(priceInMicro),                                 // ticket-price
        uintCV(parseInt(formData.totalSupply)),               // total-supply
        stringAsciiCV((imageIpfsUrl || "").substring(0, 256)), // image-uri
        stringAsciiCV((metadataIpfsUrl || "").substring(0, 256)) // metadata-uri
      ],
      onFinish: (data: any) => {
        console.log('✅ Event registered to platform!', data);
        toast.success('🎉 Event successfully registered to platform!');
        
        // Update localStorage with registry info
        const deployedContracts = JSON.parse(
          localStorage.getItem(`deployed-contracts-${wallet?.address}`) || '[]'
        );
        
        const updatedContracts = deployedContracts.map((c: any) => 
          c.contractAddress === contractId 
            ? { ...c, isRegistered: true, registryTxId: data.txId }
            : c
        );
        
        localStorage.setItem(
          `deployed-contracts-${wallet?.address}`,
          JSON.stringify(updatedContracts)
        );
      },
      onCancel: () => {
        console.log('⚠️ Registration cancelled by user');
        toast.warning('Event deployed but not registered. You can register it later from My Events.');
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to register to Event Registry:', error);
    toast.error('Registration failed. Event is deployed but not yet discoverable.');
  }
};
```

**Integrate in handleDeployContract** (around line 920):

```typescript
// After this block:
if (deployedContract) {
  // Index NFT ticket data using Hiro API
  const contractId = deployedContract.contractId || `${wallet?.address}.${contractName}`;
  const nftData = await getNFTTicketData(contractId);
  
  if (nftData) {
    // ... save to localStorage code ...
  }
  
  // ✅ ADD THIS: Register to Event Registry
  try {
    await registerToEventRegistry(contractId, contractName);
  } catch (error) {
    console.error('Registry registration error:', error);
    // Don't fail the whole process if registry fails
  }
  
  // ... rest of code ...
}
```

### 2. Alternative: Manual Registration Button

Jika tidak ingin auto-register, tambahkan button untuk manual registration:

```typescript
const ManualRegisterButton = ({ contractId, contractName }: { contractId: string; contractName: string }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  
  const handleRegister = async () => {
    setIsRegistering(true);
    try {
      await registerToEventRegistry(contractId, contractName);
    } finally {
      setIsRegistering(false);
    }
  };
  
  return (
    <button 
      onClick={handleRegister}
      disabled={isRegistering}
      className="btn btn-primary"
    >
      {isRegistering ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Registering...
        </>
      ) : (
        <>
          <Rocket className="w-4 h-4 mr-2" />
          Register to Platform
        </>
      )}
    </button>
  );
};
```

## 📝 Complete Implementation Code

Buat file baru: `src/services/eventRegistryService.ts`

```typescript
/**
 * Event Registry Integration Service
 * Handles registration of deployed events to the central registry
 */

import { openContractCall } from '@stacks/connect';
import {
  uintCV,
  principalCV,
  stringAsciiCV,
  stringUtf8CV,
  PostConditionMode
} from '@stacks/transactions';
import { toast } from 'sonner';

// Registry contract address (update after deployment)
const REGISTRY_CONTRACT_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const REGISTRY_CONTRACT_NAME = 'event-registry-full-fixed';

export interface EventRegistrationData {
  contractId: string;
  contractName: string;
  eventName: string;
  description: string;
  category: string;
  venue: string;
  venueAddress: string;
  coordinates: { lat: number; lon: number } | null;
  eventDate: Date;
  ticketPrice: number;
  totalSupply: number;
  imageIpfsUrl: string;
  metadataIpfsUrl: string;
}

/**
 * Calculate event date as block height (approximate)
 * Bitcoin block time ≈ 10 minutes
 */
function calculateEventBlockHeight(eventDate: Date): number {
  const now = Date.now();
  const eventTime = eventDate.getTime();
  const millisecondsUntilEvent = eventTime - now;
  
  // Convert to blocks (10 minutes = 600 seconds per block)
  const blocksUntilEvent = Math.floor(millisecondsUntilEvent / 1000 / 600);
  
  // Ensure positive, minimum 1 block in future
  return Math.max(1, blocksUntilEvent);
}

/**
 * Format coordinates as "lat,lon" string
 */
function formatCoordinates(coords: { lat: number; lon: number } | null): string {
  if (!coords) return "0,0";
  return `${coords.lat.toFixed(6)},${coords.lon.toFixed(6)}`;
}

/**
 * Convert STX price to micro-STX (multiply by 1,000,000)
 */
function toMicroSTX(stxAmount: number): number {
  return Math.floor(stxAmount * 1000000);
}

/**
 * Register event to the central Event Registry
 */
export async function registerEventToRegistry(
  data: EventRegistrationData,
  onSuccess?: (txId: string) => void,
  onCancel?: () => void,
  onError?: (error: any) => void
): Promise<void> {
  try {
    console.log('📝 Registering event to platform registry...', data);
    
    // Calculate values
    const eventBlockHeight = calculateEventBlockHeight(data.eventDate);
    const coordinates = formatCoordinates(data.coordinates);
    const priceInMicro = toMicroSTX(data.ticketPrice);
    
    // Validate
    if (!data.contractId || !data.contractName) {
      throw new Error('Contract ID and name are required');
    }
    
    if (data.totalSupply <= 0) {
      throw new Error('Total supply must be greater than 0');
    }
    
    console.log('📊 Registry call parameters:', {
      contract: `${REGISTRY_CONTRACT_ADDRESS}.${REGISTRY_CONTRACT_NAME}`,
      contractId: data.contractId,
      contractName: data.contractName,
      eventBlockHeight,
      priceInMicro,
      totalSupply: data.totalSupply
    });
    
    // Prepare function arguments
    const functionArgs = [
      principalCV(data.contractId),                               // contract-address
      stringAsciiCV(data.contractName.substring(0, 128)),         // contract-name (max 128)
      stringUtf8CV(data.eventName.substring(0, 256)),             // event-name (max 256)
      stringUtf8CV(data.description.substring(0, 1024)),          // description (max 1024)
      stringAsciiCV(data.category.substring(0, 64)),              // category (max 64)
      stringUtf8CV(data.venue.substring(0, 256)),                 // venue (max 256)
      stringUtf8CV(data.venueAddress.substring(0, 512)),          // venue-address (max 512)
      stringAsciiCV(coordinates.substring(0, 64)),                // venue-coordinates (max 64)
      uintCV(eventBlockHeight),                                   // event-date
      uintCV(priceInMicro),                                       // ticket-price
      uintCV(data.totalSupply),                                   // total-supply
      stringAsciiCV((data.imageIpfsUrl || "").substring(0, 256)), // image-uri (max 256)
      stringAsciiCV((data.metadataIpfsUrl || "").substring(0, 256)) // metadata-uri (max 256)
    ];
    
    // Open contract call
    await openContractCall({
      contractAddress: REGISTRY_CONTRACT_ADDRESS,
      contractName: REGISTRY_CONTRACT_NAME,
      functionName: 'register-event',
      functionArgs,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (txData: any) => {
        console.log('✅ Event registered successfully!', txData);
        toast.success('🎉 Event registered to platform!');
        if (onSuccess) onSuccess(txData.txId);
      },
      onCancel: () => {
        console.log('⚠️ Registration cancelled');
        toast.warning('Registration cancelled. You can try again later.');
        if (onCancel) onCancel();
      }
    });
    
  } catch (error: any) {
    console.error('❌ Registration failed:', error);
    toast.error(`Registration failed: ${error.message}`);
    if (onError) onError(error);
    throw error;
  }
}

/**
 * Check if an event is registered in the registry
 */
export async function isEventRegistered(
  contractAddress: string
): Promise<boolean> {
  try {
    // TODO: Implement read-only call to check registration
    // const result = await callReadOnlyFunction({
    //   contractAddress: REGISTRY_CONTRACT_ADDRESS,
    //   contractName: REGISTRY_CONTRACT_NAME,
    //   functionName: 'get-event-by-contract',
    //   functionArgs: [principalCV(contractAddress)],
    //   network: getNetwork()
    // });
    // return result !== null;
    
    return false; // Placeholder
  } catch (error) {
    console.error('Error checking registration:', error);
    return false;
  }
}

/**
 * Get event details from registry
 */
export async function getEventFromRegistry(
  contractAddress: string
): Promise<any | null> {
  try {
    // TODO: Implement read-only call
    // const result = await callReadOnlyFunction({
    //   contractAddress: REGISTRY_CONTRACT_ADDRESS,
    //   contractName: REGISTRY_CONTRACT_NAME,
    //   functionName: 'get-event-by-contract',
    //   functionArgs: [principalCV(contractAddress)],
    //   network: getNetwork()
    // });
    // return result;
    
    return null; // Placeholder
  } catch (error) {
    console.error('Error getting event from registry:', error);
    return null;
  }
}
```

## 🔄 Updated Flow

```typescript
// In CreateEventNFT.tsx handleDeployContract:

// 1. Deploy contract
const txId = await deployContract(contractName, contractCode);

// 2. Wait for confirmation
await new Promise(resolve => setTimeout(resolve, 2000));

// 3. Index contract
const indexedContracts = await indexAllContractsByAddress(wallet?.address || '');
const deployedContract = indexedContracts.find(/* ... */);

// 4. Register to Event Registry ✅ NEW!
if (deployedContract) {
  const contractId = deployedContract.contractId || `${wallet?.address}.${contractName}`;
  
  try {
    await registerEventToRegistry({
      contractId,
      contractName,
      eventName: formData.eventName,
      description: formData.description || '',
      category: formData.category,
      venue: formData.venue,
      venueAddress: formData.venueAddress || formData.venue,
      coordinates: selectedVenue?.coordinates || null,
      eventDate: new Date(`${formData.eventDate} ${formData.eventTime || '00:00'}`),
      ticketPrice: parseFloat(formData.ticketPrice),
      totalSupply: parseInt(formData.totalSupply),
      imageIpfsUrl: imageIpfsUrl || '',
      metadataIpfsUrl: metadataIpfsUrl || ''
    },
    (txId) => {
      // Success callback
      console.log('Registry txId:', txId);
    },
    () => {
      // Cancel callback
      console.log('User cancelled registration');
    });
  } catch (error) {
    console.error('Registration error:', error);
    // Don't fail entire process
  }
}

// 5. Save to localStorage
// ... existing code ...
```

## ✅ Benefits After Implementation

1. **Event Discoverability**: ✅ Events appear in BrowseEvents automatically
2. **Platform Integration**: ✅ Full platform features enabled
3. **Marketplace Ready**: ✅ Tickets can be listed and resold
4. **Analytics**: ✅ Track all events on-chain
5. **User Experience**: ✅ Seamless one-click deploy + register

## 🚀 Deployment Steps

1. Deploy Event Registry contract first
2. Update `REGISTRY_CONTRACT_ADDRESS` in service file
3. Update CreateEventNFT.tsx with registration call
4. Test end-to-end flow on testnet
5. Deploy to mainnet

---

**Status**: 🟢 **Solution Ready for Implementation**
