import * as plantNetService from "../services/plantNetService.js";
import PlantIdentification from "../models/PlantIdentification.js"; 

export const identifyPlant = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload an image" });
    }

    // 1. Call PlantNet API
    console.log("🔍 Identifying plant...");
    const result = await new plantNetService.identifyPlant(req.file.buffer);

    if (!result.results?.length) {
      return res.status(404).json({ success: false, message: "No plant matches found" });
    }

    const bestMatch = result.results[0];
    const confidence = Math.round(bestMatch.score * 100);

    const identifiedData = {
      scientificName: bestMatch.species?.scientificName,
      commonName: bestMatch.species?.commonNames?.[0] || "Unknown",
      probability: confidence,
      subtype: bestMatch.species?.genus?.scientificName || "",
    };

    // 2. Save to DynamoDB (Using Phone Number)
    // We check for phoneNumber now, not email
    if (req.user && req.user.phoneNumber) {
      try {
        await PlantIdentification.create({
          userPhoneNumber: req.user.phoneNumber, // <--- FIXED: Using phone number
          originalImage: "image_buffer", 
          identifiedPlant: identifiedData,
          apiResponse: result,
          status: 'completed'
        });
        console.log("✅ Scan saved to history for:", req.user.phoneNumber);
      } catch (dbError) {
        console.error("⚠️ Failed to save history:", dbError.message);
      }
    }

    // 3. Send Response
    return res.status(200).json({
      success: true,
      data: {
        bestMatch: identifiedData,
        suggestions: result.results.slice(0, 3).map(item => ({
          scientificName: item.species?.scientificName,
          commonName: item.species?.commonNames?.[0],
          confidence: Math.round(item.score * 100)
        }))
      }
    });

  } catch (error) {
    console.error("❌ Identification error:", error);
    return res.status(500).json({ success: false, message: "Error identifying plant" });
  }
};