import axios from "axios";

/**
 * Call Plant.id API v3 for plant identification
 * @param {string} base64Image - Base64 encoded image
 * @param {string} filename - Original filename for context
 * @returns {Promise<Object>} Plant identification results
 */
export async function callPlantIdAPI(base64Image, filename = "") {
  const apiKey = process.env.PLANT_ID_API_KEY;

  if (!apiKey) {
    throw new Error("Plant.id API key not configured");
  }

  try {
    console.log("🔍 Calling Plant.id API v3...");

    const requestData = {
      images: [`data:image/jpeg;base64,${base64Image}`],

      // Enable multiple modifiers for best accuracy
      modifiers: [
        "crops_fast", // Crop out the plant from background
        "similar_images", // Get visually similar images
        "health_only", // Health assessment
      ],

      // Request comprehensive plant details
      plant_details: [
        "common_names", // Common names in multiple languages
        "url", // Wikipedia/reference URLs
        "name_authority", // Scientific name authority
        "wiki_description", // Wikipedia description
        "taxonomy", // Full taxonomic classification
        "edible_parts", // Edible information
        "watering", // Care instructions
        "best_light_condition", // Light requirements
        "best_soil_type", // Soil preferences
        "common_uses", // Common uses
        "toxicity", // Safety information
      ],

      // Language and settings
      language: "en",
      plant_net_candidate: true,
      datetime: Math.floor(Date.now() / 1000),
      async: false,
    };

    const response = await axios.post(
      "https://api.plant.id/v3/identification",
      requestData,
      {
        headers: {
          "Content-Type": "application/json",
          "Api-Key": apiKey,
          "User-Agent": "TreeTagAI/1.0",
        },
        timeout: 30000,
      }
    );

    console.log("✅ Plant.id API response received");
    return processPlantIdResponse(response.data, filename);
  } catch (error) {
    console.error(
      "❌ Plant.id API error:",
      error.response?.data || error.message
    );

    if (error.response?.status === 429) {
      throw new Error(
        "Plant.id API rate limit exceeded. Please try again later."
      );
    } else if (error.response?.status === 401) {
      throw new Error("Invalid Plant.id API key");
    } else if (error.response?.status === 402) {
      throw new Error("Plant.id API quota exceeded");
    }

    throw new Error(`Plant.id identification failed: ${error.message}`);
  }
}

/**
 * Process Plant.id API response into standardized format
 * @param {Object} apiResponse - Raw API response
 * @param {string} filename - Original filename
 * @returns {Object} Processed results
 */
function processPlantIdResponse(apiResponse, filename = "") {
  try {
    const suggestions = apiResponse.result?.classification?.suggestions || [];

    if (!suggestions.length) {
      throw new Error("No plant matches found in Plant.id API response");
    }

    // Process suggestions into standardized format
    const processedSuggestions = suggestions.map((suggestion, index) => {
      const plantDetails = suggestion.plant_details || {};
      const commonNames = plantDetails.common_names || {};

      // Get the best common name
      const primaryCommonName = getBestCommonName(commonNames);

      // Calculate confidence
      const confidence = Math.round(suggestion.probability * 100);
      const score = suggestion.probability;

      // Extract pricing (mock for now, can be enhanced)
      const basePrice = filename.toLowerCase().includes("banana")
        ? 45.0
        : filename.toLowerCase().includes("rose")
        ? 35.0
        : 25.0 + confidence * 0.5; // Price based on confidence

      return {
        rank: index + 1,
        species: {
          scientificName: suggestion.plant_name || "Unknown",
          scientificNameAuthorship: plantDetails.name_authority || "",
          genus: {
            scientificName: extractGenus(suggestion.plant_name),
          },
          family: {
            scientificName: plantDetails.taxonomy?.family || "Unknown",
          },
          commonNames: extractCommonNamesArray(commonNames),
        },
        localizedName: primaryCommonName,
        confidence: confidence,
        score: score,

        // Pricing information
        pricing: {
          price: basePrice,
          currency: "INR",
          unit: "plant",
        },

        // Wikipedia summary
        wikipediaSummary:
          plantDetails.wiki_description?.value ||
          `${primaryCommonName} is a plant species with scientific name ${suggestion.plant_name}.`,

        // Detailed care information
        details: {
          taxonomy: {
            family: plantDetails.taxonomy?.family || "Unknown",
            genus: extractGenus(suggestion.plant_name),
            kingdom: "Plantae",
          },
          edibleParts: plantDetails.edible_parts || [],
          watering:
            plantDetails.watering?.max ||
            plantDetails.best_watering ||
            "Regular watering as needed",
          lightCondition:
            plantDetails.best_light_condition || "Varies by species",
          soilType: plantDetails.best_soil_type || "Well-draining soil",
          commonUses: plantDetails.common_uses || ["Ornamental"],
          toxicity: plantDetails.toxicity || "Unknown - exercise caution",

          // Care information
          careInfo: {
            watering:
              plantDetails.watering?.max ||
              plantDetails.best_watering ||
              "Regular watering",
            lightCondition: plantDetails.best_light_condition || "Partial sun",
            soilType: plantDetails.best_soil_type || "Well-draining",
          },
        },

        // Source metadata
        source: "Plant.id API v3",
        similarImages: suggestion.similar_images || [],
        healthAssessment: suggestion.health_assessment || null,
      };
    });

    return {
      suggestions: processedSuggestions,
      totalResults: processedSuggestions.length,
      confidence: processedSuggestions[0]?.confidence || 0,
      processingTime: apiResponse.meta_data?.processing_time || 0,
      metadata: {
        apiSource: "Plant.id API v3",
        imageCount: apiResponse.images?.length || 1,
        modifiersUsed: apiResponse.modifiers || [],
        language: "en",
      },
    };
  } catch (error) {
    console.error("❌ Error processing Plant.id response:", error);
    throw new Error("Failed to process Plant.id API results");
  }
}

/**
 * Get best common name from Plant.id response
 * @param {Object} commonNames - Common names object
 * @returns {string} Best available common name
 */
function getBestCommonName(commonNames) {
  if (!commonNames || typeof commonNames !== "object") return "Unknown Plant";

  // Priority languages
  const languages = ["en", "es", "fr", "de", "it"];

  for (const lang of languages) {
    if (
      commonNames[lang] &&
      Array.isArray(commonNames[lang]) &&
      commonNames[lang].length > 0
    ) {
      return commonNames[lang][0];
    }
  }

  // Fallback to first available
  const firstLang = Object.keys(commonNames)[0];
  if (
    firstLang &&
    Array.isArray(commonNames[firstLang]) &&
    commonNames[firstLang].length > 0
  ) {
    return commonNames[firstLang][0];
  }

  return "Unknown Plant";
}

/**
 * Extract array of common names for compatibility
 * @param {Object} commonNames - Common names object
 * @returns {Array} Array of common names
 */
function extractCommonNamesArray(commonNames) {
  const names = [];

  if (commonNames && typeof commonNames === "object") {
    Object.values(commonNames).forEach((langArray) => {
      if (Array.isArray(langArray)) {
        names.push(...langArray);
      }
    });
  }

  return names.length > 0 ? names : ["Unknown"];
}

/**
 * Extract genus from scientific name
 * @param {string} scientificName - Full scientific name
 * @returns {string} Genus name
 */
function extractGenus(scientificName) {
  if (!scientificName || typeof scientificName !== "string") return "Unknown";

  const parts = scientificName.split(" ");
  return parts[0] || "Unknown";
}

/**
 * Main identification function that converts buffer to base64 and calls API
 * @param {Buffer} imageBuffer - Image buffer
 * @param {Object} options - Options including language, location, etc.
 * @returns {Promise<Object>} Identification results
 */
async function identifyPlant(imageBuffer, options = {}) {
  try {
    // Convert buffer to base64
    const base64Image = imageBuffer.toString("base64");

    // Call the API
    const result = await callPlantIdAPI(
      base64Image,
      options.filename || "uploaded_image.jpg"
    );

    return result;
  } catch (error) {
    console.error("Plant identification error:", error);
    throw error;
  }
}

export default {
  callPlantIdAPI,
  identifyPlant,
};
