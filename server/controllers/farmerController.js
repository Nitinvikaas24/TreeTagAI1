import CropListing from "../models/CropListing.js";
import Transaction from "../models/Transaction.js";
import fuzzyMatcher from "../utils/fuzzyMatcher.js";
import receiptGenerator from "../utils/receiptGenerator.js";
import { identifyPlant as coreIdentifyPlant } from "./identificationController.js";

/**
 * Farmer Controller - Extends existing project with marketplace functionality
 * Handles plant identification, crop matching, and purchase transactions
 */

export const identifyAndFindCrops = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a plant image",
      });
    }

    console.log("🌱 Farmer uploading plant - Starting identification...");

    // Step 1: Use existing plant identification system
    const identificationReq = {
      file: req.file,
      user: req.user,
      body: req.body,
    };

    let identificationResult = null;
    let identificationError = null;

    // Call the core identification function
    try {
      const mockRes = {
        status: () => mockRes,
        json: (data) => {
          if (data.success) {
            identificationResult = data;
          } else {
            identificationError = data.message;
          }
          return mockRes;
        },
      };

      await coreIdentifyPlant(identificationReq, mockRes);
    } catch (error) {
      identificationError = error.message;
    }

    if (!identificationResult || !identificationResult.data) {
      return res.status(400).json({
        success: false,
        message: "Plant identification failed",
        error: identificationError,
      });
    }

    // Step 2: Extract plant name from identification result
    const bestMatch =
      identificationResult.data.bestMatch ||
      identificationResult.data.suggestions?.[0];

    if (!bestMatch) {
      return res.status(400).json({
        success: false,
        message: "No plant identification result found",
      });
    }

    const identifiedPlantName = bestMatch.localizedName || bestMatch.plant_name;
    const confidence = identificationResult.data.overallConfidence || 0;

    console.log(
      `🔍 Plant identified as: ${identifiedPlantName} (${Math.round(
        confidence
      )}% confidence)`
    );

    // Step 3: Find available crops from officers
    const availableCrops = await CropListing.find({
      status: "active",
      quantity: { $gt: 0 },
    }).populate("officer", "name email phone address");

    if (availableCrops.length === 0) {
      return res.json({
        success: true,
        data: {
          identification: {
            plantName: identifiedPlantName,
            confidence,
            service: identificationResult.data.primaryService,
          },
          matches: [],
          message: "No crops available for sale at the moment",
        },
      });
    }

    // Step 4: Use fuzzy matching to find similar crops
    console.log("🔍 Searching for matching crops using fuzzy matching...");

    const matches = fuzzyMatcher.findMatches(
      identifiedPlantName,
      availableCrops,
      0.5
    );

    // Step 5: Categorize matches
    const categorizedMatches = {
      exact: matches.filter((m) => m.similarity >= 0.95),
      strong: matches.filter((m) => m.similarity >= 0.8 && m.similarity < 0.95),
      good: matches.filter((m) => m.similarity >= 0.6 && m.similarity < 0.8),
      weak: matches.filter((m) => m.similarity >= 0.5 && m.similarity < 0.6),
    };

    console.log(
      `Found matches: ${matches.length} total (${categorizedMatches.exact.length} exact, ${categorizedMatches.strong.length} strong)`
    );

    res.json({
      success: true,
      data: {
        identification: {
          plantName: identifiedPlantName,
          scientificName:
            bestMatch.species?.scientificName || bestMatch.scientific_name,
          confidence,
          service: identificationResult.data.primaryService,
          uploadedImage: req.file.path,
        },
        matches: {
          total: matches.length,
          exact: categorizedMatches.exact,
          strong: categorizedMatches.strong,
          good: categorizedMatches.good,
          weak: categorizedMatches.weak,
        },
        recommendations: this.generateRecommendations(categorizedMatches),
      },
    });
  } catch (error) {
    console.error("Identify and find crops error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to identify plant and find crops",
      error: error.message,
    });
  }
};

export const confirmCropSelection = async (req, res) => {
  try {
    const { cropId, quantity = 1 } = req.body;

    if (!cropId) {
      return res.status(400).json({
        success: false,
        message: "Crop ID is required",
      });
    }

    // Step 1: Validate crop availability
    const crop = await CropListing.findById(cropId).populate(
      "officer",
      "name email phone address"
    );

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: "Crop not found",
      });
    }

    if (crop.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Crop is not available for sale",
      });
    }

    if (crop.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${crop.quantity} units available`,
      });
    }

    // Step 2: Create transaction record
    const transaction = new Transaction({
      farmer: req.user._id,
      officer: crop.officer._id,
      cropListing: crop._id,
      farmerIdentification: req.body.identificationData, // From previous step
      matchingProcess: {
        exactMatch: req.body.matchType === "exact",
        fuzzyScore: req.body.fuzzyScore || 0,
        farmerConfirmed: true,
        confirmedCropId: crop._id,
      },
      transactionDetails: {
        quantity: parseInt(quantity),
        unitPrice: crop.price,
        totalAmount: crop.price * quantity,
        paymentStatus: "pending",
      },
      status: "confirmed",
    });

    await transaction.save();

    // Step 3: Update crop quantity
    crop.quantity -= quantity;
    if (crop.quantity === 0) {
      crop.status = "sold";
    }
    await crop.save();

    // Step 4: Generate transaction receipt
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate("farmer", "name email phone address")
      .populate("officer", "name email phone address")
      .populate("cropListing");

    const receipt = await receiptGenerator.generateTransactionReceipt(
      populatedTransaction
    );

    // Update transaction with receipt info
    transaction.receipt = receipt;
    await transaction.save();

    res.json({
      success: true,
      message: "Crop purchase confirmed successfully",
      data: {
        transaction: populatedTransaction,
        receipt,
        remainingQuantity: crop.quantity,
      },
    });
  } catch (error) {
    console.error("Confirm crop selection error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to confirm crop selection",
      error: error.message,
    });
  }
};

export const getFarmerTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "all" } = req.query;

    const transactions = await Transaction.find({
      farmer: req.user._id,
      ...(status !== "all" && { status }),
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("officer", "name email phone")
      .populate("cropListing", "plantName price images");

    const total = await Transaction.countDocuments({
      farmer: req.user._id,
      ...(status !== "all" && { status }),
    });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get farmer transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
      error: error.message,
    });
  }
};

export const downloadReceipt = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findOne({
      _id: transactionId,
      farmer: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (!transaction.receipt || !transaction.receipt.pdfPath) {
      return res.status(404).json({
        success: false,
        message: "Receipt not available",
      });
    }

    // Serve the PDF file
    res.download(
      transaction.receipt.pdfPath,
      transaction.receipt.filename || "receipt.pdf"
    );
  } catch (error) {
    console.error("Download receipt error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download receipt",
      error: error.message,
    });
  }
};

export const searchCrops = async (req, res) => {
  try {
    const {
      query,
      location,
      maxDistance = 10000, // 10km default
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
    } = req.query;

    let searchCriteria = {
      status: "active",
      quantity: { $gt: 0 },
    };

    // Text search
    if (query) {
      searchCriteria.$text = { $search: query };
    }

    // Price range
    if (minPrice || maxPrice) {
      searchCriteria.price = {};
      if (minPrice) searchCriteria.price.$gte = parseFloat(minPrice);
      if (maxPrice) searchCriteria.price.$lte = parseFloat(maxPrice);
    }

    let searchQuery = CropListing.find(searchCriteria);

    // Location-based search
    if (location) {
      const [longitude, latitude] = location.split(",").map(parseFloat);
      searchQuery = searchQuery.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            $maxDistance: parseInt(maxDistance),
          },
        },
      });
    }

    const crops = await searchQuery
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("officer", "name email phone");

    const total = await CropListing.countDocuments(searchCriteria);

    res.json({
      success: true,
      data: {
        crops,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Search crops error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search crops",
      error: error.message,
    });
  }
};

// Helper function to generate recommendations
function generateRecommendations(categorizedMatches) {
  const recommendations = [];

  if (categorizedMatches.exact.length > 0) {
    recommendations.push({
      type: "exact",
      message: `Found ${categorizedMatches.exact.length} exact match(es)! These crops match your plant perfectly.`,
      action: "You can proceed with confidence to purchase these crops.",
      crops: categorizedMatches.exact.slice(0, 3), // Top 3
    });
  }

  if (categorizedMatches.strong.length > 0) {
    recommendations.push({
      type: "strong",
      message: `Found ${categorizedMatches.strong.length} strong match(es). These are very likely the same plant.`,
      action: "Review these options - they have high similarity scores.",
      crops: categorizedMatches.strong.slice(0, 3),
    });
  }

  if (categorizedMatches.good.length > 0) {
    recommendations.push({
      type: "good",
      message: `Found ${categorizedMatches.good.length} good match(es). These might be related varieties.`,
      action: "Consider these options but verify before purchasing.",
      crops: categorizedMatches.good.slice(0, 2),
    });
  }

  if (recommendations.length === 0 && categorizedMatches.weak.length > 0) {
    recommendations.push({
      type: "weak",
      message: "Found some possible matches with low confidence.",
      action:
        "These matches are uncertain. Consider uploading a clearer image or try different angles.",
      crops: categorizedMatches.weak.slice(0, 2),
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: "none",
      message: "No matching crops found in the marketplace.",
      action:
        "Try uploading a clearer image, or check back later as new crops are added regularly.",
      crops: [],
    });
  }

  return recommendations;
}
