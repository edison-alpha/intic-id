/**
 * Pinata IPFS Service
 * Upload images and metadata to IPFS via Pinata
 */

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_API_SECRET = import.meta.env.VITE_PINATA_API_SECRET;
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

export interface PinataUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
  isDuplicate?: boolean;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties?: {
    event_name: string;
    event_date: string;
    venue?: string;
    ticket_type?: string;
    [key: string]: any;
  };
}

/**
 * Upload image file to Pinata IPFS
 */
export const uploadImageToPinata = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        type: 'event-image',
        uploadedAt: new Date().toISOString(),
      },
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 1,
    });
    formData.append('pinataOptions', options);

    console.log('📤 Uploading image to Pinata...');

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to upload image to Pinata');
    }

    const data: PinataUploadResponse = await response.json();
    const ipfsUrl = `${PINATA_GATEWAY}/${data.IpfsHash}`;

    console.log('✅ Image uploaded to IPFS:', ipfsUrl);
    console.log('📦 IPFS Hash:', data.IpfsHash);

    return ipfsUrl;
  } catch (error) {
    console.error('Error uploading image to Pinata:', error);
    throw error;
  }
};

/**
 * Upload JSON metadata to Pinata IPFS
 */
export const uploadMetadataToPinata = async (
  metadata: NFTMetadata
): Promise<{ ipfsUrl: string; cid: string }> => {
  try {
    console.log('📤 Uploading metadata to Pinata...');

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `${metadata.name}-metadata`,
          keyvalues: {
            type: 'nft-metadata',
            eventName: metadata.properties?.event_name || metadata.name,
            uploadedAt: new Date().toISOString(),
          },
        },
        pinataOptions: {
          cidVersion: 1,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to upload metadata to Pinata');
    }

    const data: PinataUploadResponse = await response.json();
    const ipfsUrl = `${PINATA_GATEWAY}/${data.IpfsHash}`;
    const cid = data.IpfsHash;

    console.log('✅ Metadata uploaded to IPFS:', ipfsUrl);
    console.log('📦 CID:', cid);

    return { ipfsUrl, cid };
  } catch (error) {
    console.error('Error uploading metadata to Pinata:', error);
    throw error;
  }
};

/**
 * Generate NFT Ticket Metadata
 */
export const generateTicketMetadata = (
  eventData: {
    eventName: string;
    eventDate: string;
    venue?: string;
    description?: string;
    ticketType?: string;
    category?: string;
    price?: string;
    totalSupply?: number;
  },
  imageUrl: string
): NFTMetadata => {
  return {
    name: `${eventData.eventName} - ${eventData.ticketType || 'General Admission'}`,
    description: eventData.description || `Ticket for ${eventData.eventName}`,
    image: imageUrl,
    attributes: [
      {
        trait_type: 'Event Name',
        value: eventData.eventName,
      },
      {
        trait_type: 'Event Date',
        value: eventData.eventDate,
      },
      ...(eventData.venue
        ? [
            {
              trait_type: 'Venue',
              value: eventData.venue,
            },
          ]
        : []),
      ...(eventData.ticketType
        ? [
            {
              trait_type: 'Ticket Type',
              value: eventData.ticketType,
            },
          ]
        : []),
      ...(eventData.category
        ? [
            {
              trait_type: 'Category',
              value: eventData.category,
            },
          ]
        : []),
      ...(eventData.price
        ? [
            {
              trait_type: 'Price',
              value: `${eventData.price} STX`,
            },
          ]
        : []),
      ...(eventData.totalSupply
        ? [
            {
              trait_type: 'Total Supply',
              value: eventData.totalSupply,
            },
          ]
        : []),
    ],
    properties: {
      event_name: eventData.eventName,
      event_date: eventData.eventDate,
      venue: eventData.venue,
      ticket_type: eventData.ticketType,
      category: eventData.category,
      price: eventData.price,
      total_supply: eventData.totalSupply,
    },
  };
};

/**
 * Get IPFS URL from CID
 */
export const getIpfsUrl = (cid: string): string => {
  return `${PINATA_GATEWAY}/${cid}`;
};

/**
 * Test Pinata connection
 */
export const testPinataConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    console.log('✅ Pinata connection test successful:', data);
    return true;
  } catch (error) {
    console.error('❌ Pinata connection test failed:', error);
    return false;
  }
};
