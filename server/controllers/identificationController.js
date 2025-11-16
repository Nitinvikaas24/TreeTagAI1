import axios from "axios";
import plantNetService from "../services/plantNetService.js";

export const identifyPlant1 = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image",
      });
    }

    // Use PlantNet API for plant identification
    console.log("🔍 Using PlantNet for identification...");
    const result = await new plantNetService().identifyPlant(req.file.buffer);

    if (!result.results?.length) {
      return res.status(404).json({
        success: false,
        message: "No plant matches found",
        confidence: 0,
      });
    }

    // Format the best match and other suggestions
    const bestMatch = result.results[0];
    const confidence = Math.round(bestMatch.score * 100);

    const response = {
      success: true,
      data: {
        bestMatch: {
          scientificName: bestMatch.species?.scientificName,
          commonName: bestMatch.species?.commonNames?.[0] || "Unknown",
          confidence: confidence,
          details: {
            commonNames: { en: bestMatch.species?.commonNames || [] },
            taxonomy: bestMatch.species?.genus
              ? { genus: bestMatch.species.genus }
              : {},
          },
        },
        suggestions: result.results.map((item, index) => ({
          rank: index + 1,
          scientificName: item.species?.scientificName,
          commonName: item.species?.commonNames?.[0] || "Unknown",
          confidence: Math.round(item.score * 100),
          details: {
            commonNames: { en: item.species?.commonNames || [] },
            taxonomy: item.species?.genus ? { genus: item.species.genus } : {},
          },
        })),
        metadata: {
          timestamp: new Date().toISOString(),
          totalResults: result.results.length,
          confidence: confidence,
        },
      },
      message: `Plant identified successfully with ${confidence}% confidence`,
    };

    console.log(
      `✅ Plant identification completed: ${bestMatch.species?.scientificName} (${confidence}% confidence)`
    );
    return res.status(200).json(response);
  } catch (error) {
    console.error("❌ Plant identification error:", error);
    return res.status(500).json({
      success: false,
      message: "Error identifying plant",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};
