import axios from "axios";
import PlantIdentification from "../models/PlantIdentification.js";
import { translateText } from "../utils/translate.js";
import { getWikipediaInfo } from "../utils/wikipedia.js";
import Plant from "../models/Plant.js";

/**
 * REAL API ONLY - Plant identification controller
 * This version makes actual API calls and has NO mock/fallback data
 */

export const identifyPlant = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image",
      });
    }

    console.log("🌱 Starting REAL plant identification process...");
    console.log(`📁 File: ${req.file.mimetype}, ${req.file.size} bytes`);

    // Verify API keys
    const PLANT_ID_KEY = process.env.PLANT_ID_API_KEY;
    const PLANTNET_KEY = process.env.PLANTNET_API_KEY;

    if (!PLANT_ID_KEY && !PLANTNET_KEY) {
      return res.status(500).json({
        success: false,
        message: "No plant identification API keys configured",
        mockData: false,
      });
    }

    // Create initial identification record (if database available and user authenticated)
    let identification = null;
    if (req.user) {
      try {
        identification = await PlantIdentification.create({
          user: req.user._id,
          originalImage: req.file.path,
          status: "pending",
        });
        console.log(`📝 Created identification record: ${identification._id}`);
      } catch (dbError) {
        console.log(
          "⚠️ Database not connected, proceeding without saving record"
        );
      }
    }

    let identificationResult = null;
    let primaryService = null;
    let fallbackUsed = false;
    let errors = [];
    const startTime = Date.now();

    // Try Plant.id first (if available)
    if (PLANT_ID_KEY) {
      try {
        console.log("🔍 Making REAL Plant.id API call...");
        primaryService = "Plant.id";

        const base64Image = req.file.buffer.toString("base64");

        const requestPayload = {
          images: [`data:${req.file.mimetype};base64,${base64Image}`],
          modifiers: ["crops_fast", "similar_images", "health_only"],
          plant_details: [
            "common_names",
            "url",
            "wiki_description",
            "taxonomy",
            "watering",
            "best_light_condition",
            "best_soil_type",
            "common_uses",
            "toxicity",
          ],
          language: req.user?.preferredLanguage || "en",
          datetime: Math.floor(Date.now() / 1000),
        };

        console.log("📡 Sending request to Plant.id API...");

        const response = await axios.post(
          "https://api.plant.id/v3/identification",
          requestPayload,
          {
            headers: {
              "Api-Key": PLANT_ID_KEY,
              "Content-Type": "application/json",
            },
            timeout: 45000,
          }
        );

        console.log(`📨 Plant.id response status: ${response.status}`);

        if (response.data.is_plant === false) {
          throw new Error(
            "Plant.id determined this image does not contain a plant"
          );
        }

        const suggestions = response.data.suggestions || [];
        if (suggestions.length === 0) {
          throw new Error("Plant.id found no plant matches");
        }

        const confidence = Math.round((suggestions[0].probability || 0) * 100);
        console.log(
          `✅ Plant.id successful: ${confidence}% confidence, ${suggestions.length} suggestions`
        );

        identificationResult = {
          success: true,
          suggestions: suggestions.map((suggestion, index) => ({
            rank: index + 1,
            scientificName: suggestion.plant_name,
            commonName:
              suggestion.plant_details?.common_names?.en?.[0] ||
              suggestion.plant_name,
            confidence: Math.round((suggestion.probability || 0) * 100),
            probability: suggestion.probability || 0,
            details: {
              commonNames: suggestion.plant_details?.common_names || {},
              taxonomy: suggestion.plant_details?.taxonomy || {},
              description:
                suggestion.plant_details?.wiki_description?.value || "",
              url: suggestion.plant_details?.url || "",
              careInfo: {
                light:
                  suggestion.plant_details?.best_light_condition || "Unknown",
                water: suggestion.plant_details?.watering?.max || "Unknown",
                soil: suggestion.plant_details?.best_soil_type || "Unknown",
              },
              uses: suggestion.plant_details?.common_uses || [],
              toxicity: suggestion.plant_details?.toxicity || "Unknown",
              edibleParts: suggestion.plant_details?.edible_parts || [],
            },
            source: "Plant.id API (Real)",
          })),
          confidence,
          totalResults: suggestions.length,
        };
      } catch (plantIdError) {
        console.log(`❌ Plant.id API failed: ${plantIdError.message}`);
        errors.push(`Plant.id: ${plantIdError.message}`);
      }
    }

    // Try PlantNet if Plant.id failed (if available)
    if (!identificationResult && PLANTNET_KEY) {
      try {
        console.log("🔄 Making REAL PlantNet API call as fallback...");
        primaryService = "PlantNet";
        fallbackUsed = true;

        const FormData = (await import("form-data")).default;
        const formData = new FormData();

        formData.append("images", req.file.buffer, {
          filename: "plant.jpg",
          contentType: req.file.mimetype,
        });
        formData.append("organs", "leaf");
        formData.append("organs", "flower");

        console.log("📡 Sending request to PlantNet API...");

        const response = await axios.post(
          "https://my-api.plantnet.org/v2/identify/all",
          formData,
          {
            params: {
              "api-key": PLANTNET_KEY,
            },
            headers: {
              ...formData.getHeaders(),
            },
            timeout: 30000,
          }
        );

        console.log(`📨 PlantNet response status: ${response.status}`);

        const results = response.data.results || [];
        if (results.length === 0) {
          throw new Error("PlantNet found no plant matches");
        }

        const confidence = Math.round((results[0].score || 0) * 100);
        console.log(
          `✅ PlantNet successful: ${confidence}% confidence, ${results.length} results`
        );

        identificationResult = {
          success: true,
          suggestions: results.map((result, index) => ({
            rank: index + 1,
            scientificName: result.species.scientificName,
            commonName:
              result.species.commonNames?.[0] || result.species.scientificName,
            confidence: Math.round((result.score || 0) * 100),
            probability: result.score || 0,
            details: {
              commonNames: { en: result.species.commonNames || [] },
              taxonomy: {
                family: result.species.family?.scientificName || "",
                genus: result.species.genus?.scientificName || "",
              },
              description: "",
              careInfo: {
                light: "Unknown",
                water: "Unknown",
                soil: "Unknown",
              },
            },
            source: "PlantNet API (Real)",
          })),
          confidence,
          totalResults: results.length,
        };
      } catch (plantNetError) {
        console.log(`❌ PlantNet API failed: ${plantNetError.message}`);
        errors.push(`PlantNet: ${plantNetError.message}`);
      }
    }

    const duration = Date.now() - startTime;

    // If both APIs failed, return error
    if (!identificationResult) {
      console.log("❌ ALL REAL API CALLS FAILED");

      if (identification) {
        identification.status = "failed";
        identification.error = `All APIs failed: ${errors.join(", ")}`;
        await identification.save();
      }

      return res.status(500).json({
        success: false,
        message: "All plant identification APIs failed",
        errors: errors,
        mockData: false,
        realApiAttempted: true,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });
    }

    // Success - Update database record if available
    if (identification) {
      try {
        identification.status = "completed";
        identification.results = identificationResult;
        identification.confidence = identificationResult.confidence;
        identification.primaryService = primaryService;
        identification.processingTime = duration;
        await identification.save();
        console.log(`✅ Updated identification record: ${identification._id}`);
      } catch (dbError) {
        console.log("⚠️ Failed to update database record:", dbError.message);
      }
    }

    // Success response
    console.log(`✅ IDENTIFICATION SUCCESSFUL via ${primaryService}`);
    console.log(`🎯 Confidence: ${identificationResult.confidence}%`);
    console.log(`⏱️  Duration: ${duration}ms`);

    res.json({
      success: true,
      message: `Plant identified successfully using REAL ${primaryService} API`,
      data: {
        identificationId: identification?._id || `real_${Date.now()}`,
        primaryService: `${primaryService} (Real API)`,
        fallbackUsed,
        mockData: false,
        realApiUsed: true,
        overallConfidence: identificationResult.confidence,
        bestMatch: identificationResult.suggestions[0] || null,
        suggestions: identificationResult.suggestions || [],
        totalResults: identificationResult.totalResults || 0,
        duration: `${duration}ms`,
        processedAt: new Date().toISOString(),
        apiCallConfirmation:
          "This response contains REAL API data only - no mock data",
      },
    });
  } catch (error) {
    console.error("❌ Identification controller error:", error.message);

    res.status(500).json({
      success: false,
      message: "Plant identification failed",
      error: error.message,
      mockData: false,
      realApiAttempted: true,
      timestamp: new Date().toISOString(),
    });
  }
};

export const getIdentificationHistory = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const identifications = await PlantIdentification.find({
      user: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("-__v");

    res.json({
      success: true,
      data: identifications,
      count: identifications.length,
    });
  } catch (error) {
    console.error("Get identification history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve identification history",
      error: error.message,
    });
  }
};

export const deleteIdentification = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { id } = req.params;

    const identification = await PlantIdentification.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!identification) {
      return res.status(404).json({
        success: false,
        message: "Identification not found",
      });
    }

    res.json({
      success: true,
      message: "Identification deleted successfully",
    });
  } catch (error) {
    console.error("Delete identification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete identification",
      error: error.message,
    });
  }
};
