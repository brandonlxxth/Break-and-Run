/**
 * Normalizes a name for storage and comparison:
 * - Converts to lowercase
 * - Trims whitespace from front and end
 */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Formats a name for display:
 * - Capitalizes the first letter
 * - Preserves the rest of the name as-is
 */
export function formatNameForDisplay(name: string): string {
  const normalized = normalizeName(name);
  if (normalized.length === 0) {
    return name;
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}


