/**
 * Clarity Value Converter
 * Convert JSON representation back to ClarityValue for Stacks.js
 */
const {
  uintCV,
  intCV,
  boolCV,
  stringAsciiCV,
  stringUtf8CV,
  standardPrincipalCV,
  contractPrincipalCV,
  tupleCV,
  listCV,
  noneCV,
  someCV,
  bufferCV,
  trueCV,
  falseCV
} = require('@stacks/transactions');

/**
 * Convert JSON Clarity value back to ClarityValue
 * This reverses the cvToJSON transformation
 */
function jsonToClarityValue(json) {
  if (!json || typeof json !== 'object') {
    throw new Error('Invalid JSON Clarity value');
  }

  const type = json.type || '';

  switch (type) {
    case 'uint':
      return uintCV(json.value);

    case 'int':
      return intCV(json.value);

    case 'bool':
      return json.value === true || json.value === 'true' ? trueCV() : falseCV();

    case 'string-ascii':
      return stringAsciiCV(json.value);

    case 'string-utf8':
      return stringUtf8CV(json.value);

    case 'principal':
      // Check if it's a contract principal (has a dot)
      if (json.value.includes('.')) {
        const [address, contractName] = json.value.split('.');
        return contractPrincipalCV(address, contractName);
      }
      return standardPrincipalCV(json.value);

    case 'tuple':
      const tupleData = {};
      if (json.value && typeof json.value === 'object') {
        for (const [key, value] of Object.entries(json.value)) {
          tupleData[key] = jsonToClarityValue(value);
        }
      }
      return tupleCV(tupleData);

    case 'list':
      if (!Array.isArray(json.value)) {
        throw new Error('List value must be an array');
      }
      return listCV(json.value.map(item => jsonToClarityValue(item)));

    case 'optional':
      return json.value ? someCV(jsonToClarityValue(json.value)) : noneCV();

    case 'buffer':
      // Buffer should be hex string
      return bufferCV(Buffer.from(json.value, 'hex'));

    default:
      // Check if type starts with specific patterns
      if (type.startsWith('(string-ascii')) {
        return stringAsciiCV(json.value);
      }
      if (type.startsWith('(string-utf8')) {
        return stringUtf8CV(json.value);
      }
      if (type.startsWith('(tuple')) {
        const tupleData = {};
        if (json.value && typeof json.value === 'object') {
          for (const [key, value] of Object.entries(json.value)) {
            tupleData[key] = jsonToClarityValue(value);
          }
        }
        return tupleCV(tupleData);
      }
      
      throw new Error(`Unsupported Clarity type: ${type}`);
  }
}

/**
 * Convert array of JSON Clarity values to ClarityValues
 */
function jsonArrayToClarityValues(jsonArray) {
  if (!Array.isArray(jsonArray)) {
    return [];
  }
  
  return jsonArray.map(json => {
    // If it's already a string (from double-stringify), parse it
    if (typeof json === 'string') {
      try {
        json = JSON.parse(json);
      } catch (e) {
        console.warn('Failed to parse JSON string:', json);
        return null;
      }
    }
    
    try {
      return jsonToClarityValue(json);
    } catch (error) {
      console.error('Failed to convert JSON to ClarityValue:', error.message, json);
      return null;
    }
  }).filter(cv => cv !== null);
}

module.exports = {
  jsonToClarityValue,
  jsonArrayToClarityValues
};
