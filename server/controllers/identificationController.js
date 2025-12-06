import * as plantNetService from "../services/plantNetService.js";
import { PlantIdentification } from "../models/PlantIdentification.js"; // DynamoDB Model

export const identifyPlant = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image",
      });
    }

    // 1. Call PlantNet API
    console.log("🔍 Using PlantNet for identification...");
    const result = await new plantNetService().identifyPlant(req.file.buffer);

    if (!result.results?.length) {
      return res.status(404).json({
        success: false,
        message: "No plant matches found",
      });
    }

    const bestMatch = result.results[0];
    const confidence = Math.round(bestMatch.score * 100);

    // 2. Prepare Data for Response & DB
    const identifiedData = {
      scientificName: bestMatch.species?.scientificName,
      commonName: bestMatch.species?.commonNames?.[0] || "Unknown",
      probability: confidence,
      subtype: bestMatch.species?.genus?.scientificName || "",
      translatedName: {} // Placeholder for translation logic if added back
    };

    // 3. Save to DynamoDB (History)
    // We only save if the user is logged in (req.user exists)
    if (req.user && req.user.email) {
      try {
        await PlantIdentification.create({
          userEmail: req.user.email,
          originalImage: "memory_buffer", // In a real app, upload to S3 and save URL here
          identifiedPlant: identifiedData,
          apiResponse: result, // Store full raw data for debugging
          status: 'completed'
        });
      } catch (dbError) {
        console.error("Warning: Failed to save identification history to DynamoDB", dbError);
        // We continue even if saving fails, so the user still gets the result
      }
    }

    // 4. Send Response
    return res.status(200).json({
      success: true,
      data: {
        bestMatch: {
          ...identifiedData,
          details: {
            commonNames: { en: bestMatch.species?.commonNames || [] },
            taxonomy: bestMatch.species?.genus ? { genus: bestMatch.species.genus } : {},
          },
        },
        suggestions: result.results.map((item, index) => ({
          rank: index + 1,
          scientificName: item.species?.scientificName,
          commonName: item.species?.commonNames?.[0] || "Unknown",
          confidence: Math.round(item.score * 100),
        })),
        metadata: {
          timestamp: new Date().toISOString(),
          confidence: confidence,
        },
      },
      message: `Plant identified successfully with ${confidence}% confidence`,
    });

  } catch (error) {
    console.error("❌ Plant identification error:", error);
    return res.status(500).json({
      success: false,
      message: "Error identifying plant",
      error: error.message,
    });
  }
};