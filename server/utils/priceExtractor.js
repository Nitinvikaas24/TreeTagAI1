import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

/**
 * Excel and PDF price extraction utility
 * Extends existing project to handle price parsing from receipts
 */

class PriceExtractor {
  constructor() {
    this.pricePatterns = [
      /₹\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
      /INR\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
      /Rs\.?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
      /price[:\s]*₹?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      /cost[:\s]*₹?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      /amount[:\s]*₹?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      /total[:\s]*₹?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi
    ];

    this.plantNamePatterns = [
      /plant[:\s]*([a-zA-Z\s]+)/gi,
      /crop[:\s]*([a-zA-Z\s]+)/gi,
      /item[:\s]*([a-zA-Z\s]+)/gi,
      /product[:\s]*([a-zA-Z\s]+)/gi
    ];
  }

  /**
   * Extract price and plant information from Excel file
   */
  async extractFromExcel(filePath, plantName = null) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      
      const results = [];
      
      workbook.eachSheet((worksheet) => {
        const sheetData = this.processExcelSheet(worksheet, plantName);
        if (sheetData.length > 0) {
          results.push(...sheetData);
        }
      });

      return this.consolidateExcelResults(results, plantName);
      
    } catch (error) {
      console.error('Excel extraction error:', error);
      return {
        success: false,
        error: error.message,
        extractedPrice: null,
        confidence: 0
      };
    }
  }

  processExcelSheet(worksheet, targetPlant) {
    const results = [];
    const data = [];
    
    // Convert worksheet to array format
    worksheet.eachRow((row, rowNumber) => {
      const rowData = [];
      row.eachCell((cell, colNumber) => {
        rowData.push(cell.text || cell.value || '');
      });
      data.push({ row: rowNumber, cells: rowData });
    });

    // Look for price and plant name patterns
    data.forEach(({ row, cells }) => {
      const rowText = cells.join(' ').toLowerCase();
      
      // Check if this row contains plant name (if specified)
      let plantMatch = !targetPlant;
      if (targetPlant) {
        const normalizedTarget = targetPlant.toLowerCase();
        plantMatch = rowText.includes(normalizedTarget) || 
                    this.fuzzyMatchPlantName(rowText, normalizedTarget);
      }

      if (plantMatch) {
        // Extract prices from this row
        const prices = this.extractPricesFromText(cells.join(' '));
        if (prices.length > 0) {
          results.push({
            row,
            prices,
            context: rowText,
            plantName: this.extractPlantNameFromText(rowText) || targetPlant
          });
        }
      }
    });

    return results;
  }

  consolidateExcelResults(results, targetPlant) {
    if (results.length === 0) {
      return {
        success: false,
        message: 'No price information found',
        extractedPrice: null,
        confidence: 0
      };
    }

    // Sort by confidence and take the best match
    const bestResult = results.reduce((best, current) => {
      const currentConfidence = this.calculateConfidence(current, targetPlant);
      const bestConfidence = this.calculateConfidence(best, targetPlant);
      return currentConfidence > bestConfidence ? current : best;
    });

    const extractedPrice = Math.max(...bestResult.prices);
    const confidence = this.calculateConfidence(bestResult, targetPlant);

    return {
      success: true,
      extractedPrice,
      confidence,
      context: bestResult.context,
      plantName: bestResult.plantName,
      allResults: results
    };
  }

  /**
   * Extract price information from PDF (text-based)
   * Note: This is a basic implementation. For complex PDFs, consider using pdf-parse
   */
  async extractFromPDF(filePath, plantName = null) {
    try {
      // For now, return a placeholder implementation
      // In production, you would use a PDF parsing library like pdf-parse
      return {
        success: false,
        message: 'PDF parsing not yet implemented. Please use Excel files or manual entry.',
        extractedPrice: null,
        confidence: 0
      };
      
    } catch (error) {
      console.error('PDF extraction error:', error);
      return {
        success: false,
        error: error.message,
        extractedPrice: null,
        confidence: 0
      };
    }
  }

  /**
   * Extract prices from text using regex patterns
   */
  extractPricesFromText(text) {
    const prices = [];
    
    this.pricePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const priceStr = match[1].replace(/,/g, '');
        const price = parseFloat(priceStr);
        if (!isNaN(price) && price > 0) {
          prices.push(price);
        }
      }
    });

    return [...new Set(prices)]; // Remove duplicates
  }

  /**
   * Extract plant name from text
   */
  extractPlantNameFromText(text) {
    for (const pattern of this.plantNamePatterns) {
      const match = pattern.exec(text);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  }

  /**
   * Calculate confidence score for extracted data
   */
  calculateConfidence(result, targetPlant) {
    let confidence = 0;

    // Base confidence for finding prices
    confidence += 30;

    // Bonus for plant name match
    if (targetPlant && result.plantName) {
      const similarity = this.stringSimilarity(
        targetPlant.toLowerCase(), 
        result.plantName.toLowerCase()
      );
      confidence += similarity * 40;
    }

    // Bonus for multiple prices (suggests structured data)
    if (result.prices.length > 1) {
      confidence += 10;
    }

    // Bonus for context keywords
    const contextKeywords = ['price', 'cost', 'amount', 'total', 'rate'];
    const contextLower = result.context.toLowerCase();
    const keywordMatches = contextKeywords.filter(keyword => 
      contextLower.includes(keyword)
    ).length;
    confidence += keywordMatches * 5;

    return Math.min(confidence, 100);
  }

  /**
   * Simple string similarity calculation
   */
  stringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Fuzzy match plant names
   */
  fuzzyMatchPlantName(text, targetPlant) {
    const words = text.split(/\s+/);
    const targetWords = targetPlant.split(/\s+/);
    
    let matches = 0;
    targetWords.forEach(targetWord => {
      if (words.some(word => 
        word.includes(targetWord) || targetWord.includes(word)
      )) {
        matches++;
      }
    });

    return matches / targetWords.length >= 0.5;
  }

  /**
   * Validate extracted price
   */
  validatePrice(price, context = {}) {
    if (!price || isNaN(price) || price <= 0) {
      return { valid: false, reason: 'Invalid price value' };
    }

    // Basic validation rules
    if (price > 100000) {
      return { valid: false, reason: 'Price too high (>₹1,00,000)' };
    }

    if (price < 1) {
      return { valid: false, reason: 'Price too low (<₹1)' };
    }

    return { valid: true };
  }
}

export default new PriceExtractor();
