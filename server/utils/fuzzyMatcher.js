import stringSimilarity from 'string-similarity';

/**
 * Fuzzy matching utility for plant names
 * Extends the existing project without modifying core plant identification
 */

class FuzzyMatcher {
  constructor() {
    // Synonyms and aliases for common plant names
    this.plantAliases = {
      'tomato': ['lycopersicon esculentum', 'solanum lycopersicum', 'love apple'],
      'potato': ['solanum tuberosum', 'irish potato', 'white potato'],
      'rice': ['oryza sativa', 'paddy', 'dhan'],
      'wheat': ['triticum aestivum', 'common wheat'],
      'corn': ['zea mays', 'maize', 'indian corn'],
      'mango': ['mangifera indica', 'king of fruits'],
      'banana': ['musa', 'plantain'],
      'coconut': ['cocos nucifera', 'coco palm'],
      'neem': ['azadirachta indica', 'indian lilac'],
      'tulsi': ['ocimum tenuiflorum', 'holy basil'],
      'rose': ['rosa', 'gulab'],
      'jasmine': ['jasminum', 'mogra', 'chameli']
    };
  }

  /**
   * Find the best matches for a plant name from available crop listings
   * @param {string} targetPlantName - The plant name to match
   * @param {Array} availableCrops - Array of crop listings
   * @param {number} threshold - Minimum similarity threshold (default: 0.5)
   * @returns {Array} Sorted array of matches with similarity scores
   */
  findMatches(targetPlantName, availableCrops, threshold = 0.5) {
    if (!targetPlantName || !availableCrops || availableCrops.length === 0) {
      return [];
    }

    const normalizedTarget = this.normalizePlantName(targetPlantName);
    const matches = [];

    availableCrops.forEach(crop => {
      const plantNameScore = this.calculateSimilarity(normalizedTarget, crop.plantName);
      let scientificNameScore = 0;
      
      if (crop.scientificName) {
        scientificNameScore = this.calculateSimilarity(normalizedTarget, crop.scientificName);
      }

      // Check aliases
      const aliasScore = this.checkAliases(normalizedTarget, crop.plantName);

      // Take the highest score among plant name, scientific name, and aliases
      const bestScore = Math.max(plantNameScore, scientificNameScore, aliasScore);

      if (bestScore >= threshold) {
        matches.push({
          crop,
          similarity: bestScore,
          matchType: this.getMatchType(bestScore),
          details: {
            plantNameScore,
            scientificNameScore,
            aliasScore
          }
        });
      }
    });

    // Sort by similarity score (highest first)
    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Calculate similarity between two plant names
   */
  calculateSimilarity(name1, name2) {
    if (!name1 || !name2) return 0;
    
    const normalized1 = this.normalizePlantName(name1);
    const normalized2 = this.normalizePlantName(name2);
    
    // Exact match
    if (normalized1 === normalized2) return 1.0;
    
    // Use Dice coefficient for similarity
    return stringSimilarity.compareTwoStrings(normalized1, normalized2);
  }

  /**
   * Normalize plant name for better matching
   */
  normalizePlantName(plantName) {
    if (!plantName) return '';
    
    return plantName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\b(plant|tree|crop|leaf|flower|fruit)\b/g, '') // Remove common words
      .trim();
  }

  /**
   * Check if plants are aliases of each other
   */
  checkAliases(targetName, cropName) {
    const normalizedTarget = targetName.toLowerCase();
    const normalizedCrop = cropName.toLowerCase();

    // Check direct aliases
    for (const [mainName, aliases] of Object.entries(this.plantAliases)) {
      const allNames = [mainName, ...aliases].map(name => name.toLowerCase());
      
      const targetInAliases = allNames.some(alias => 
        normalizedTarget.includes(alias) || alias.includes(normalizedTarget)
      );
      const cropInAliases = allNames.some(alias => 
        normalizedCrop.includes(alias) || alias.includes(normalizedCrop)
      );

      if (targetInAliases && cropInAliases) {
        return 0.9; // High score for alias matches
      }
    }

    return 0;
  }

  /**
   * Determine match type based on similarity score
   */
  getMatchType(score) {
    if (score >= 0.95) return 'exact';
    if (score >= 0.8) return 'strong';
    if (score >= 0.6) return 'good';
    if (score >= 0.5) return 'weak';
    return 'poor';
  }

  /**
   * Get recommendation message based on match type
   */
  getRecommendationMessage(matchType, similarity) {
    const percentage = Math.round(similarity * 100);
    
    switch (matchType) {
      case 'exact':
        return `Perfect match found (${percentage}% confidence)`;
      case 'strong':
        return `Strong match found (${percentage}% confidence)`;
      case 'good':
        return `Good match found (${percentage}% confidence) - Please confirm`;
      case 'weak':
        return `Possible match found (${percentage}% confidence) - Please verify`;
      default:
        return `Low confidence match (${percentage}%) - Consider retrying`;
    }
  }

  /**
   * Add custom aliases to the matcher
   */
  addCustomAliases(mainName, aliases) {
    const normalizedMain = mainName.toLowerCase();
    if (!this.plantAliases[normalizedMain]) {
      this.plantAliases[normalizedMain] = [];
    }
    this.plantAliases[normalizedMain].push(...aliases.map(alias => alias.toLowerCase()));
  }
}

export default new FuzzyMatcher();
