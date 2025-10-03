/**
 * Parse words from French text, normalizing for tracking purposes
 */
export function parseWords(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Convert to lowercase and remove punctuation except apostrophes (important for French)
  // Keep hyphens for compound words (e.g., "c'est", "aujourd'hui")
  const normalized = text
    .toLowerCase()
    .replace(/[.,!?;:"""()[\]{}]/g, ' ') // Remove punctuation but keep apostrophes and hyphens
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Split by spaces and filter out empty strings
  const words = normalized
    .split(' ')
    .filter(word => word.length > 0);

  return words;
}

/**
 * Count words in text (for statistics)
 */
export function countWords(text: string): number {
  return parseWords(text).length;
}

/**
 * Get unique words from text
 */
export function getUniqueWords(text: string): string[] {
  const words = parseWords(text);
  return Array.from(new Set(words));
}
