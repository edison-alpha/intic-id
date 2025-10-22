/**
 * Clarity Value Parser
 * Parse Clarity values from Hiro API response
 */
function parseClarityValue(value) {
  if (!value) return null;

  // Handle different Clarity types
  if (value.type === 'uint') {
    return parseInt(value.value);
  } else if (value.type === 'int') {
    return parseInt(value.value);
  } else if (value.type === 'bool') {
    return value.value === 'true' || value.value === true;
  } else if (value.type === 'principal') {
    return value.value;
  } else if (value.type === 'tuple') {
    const tuple = {};
    for (const [key, val] of Object.entries(value.data || {})) {
      tuple[key] = parseClarityValue(val);
    }
    return tuple;
  } else if (value.type === 'list') {
    return (value.value || []).map((item) => parseClarityValue(item));
  } else if (value.type === 'optional') {
    return value.value ? parseClarityValue(value.value) : null;
  } else if (value.type === 'response') {
    if (value.success) {
      return parseClarityValue(value.value);
    } else {
      throw new Error(`Contract error: ${JSON.stringify(value.value)}`);
    }
  }

  return value.value || value;
}

module.exports = {
  parseClarityValue
};