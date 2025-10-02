/**
 * String Utilities
 * Common string manipulation and formatting functions
 */

/**
 * Capitalize the first letter of a string
 */
export function capitalizeFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Extract the first part of an address before a delimiter
 * @param address - The full address
 * @param delimiter - The delimiter to split on (default: ',')
 */
export function extractFirstPart(address: string, delimiter: string = ','): string {
  if (!address) return address;
  return address.split(delimiter)[0].trim();
}
