import CropListing from "../models/CropListing.js";
import Transaction from "../models/Transaction.js";
import fuzzyMatcher from "../utils/fuzzyMatcher.js";
import receiptGenerator from "../utils/receiptGenerator.js";
import priceExtractor from "../utils/priceExtractor.js";
import { identifyPlant as coreIdentifyPlant } from "./identificationController.js";

/**
 * Officer Controller - Extends existing project with marketplace functionality
 * Handles crop listing, price management, and inventory
 */

export const uploadCropForSale = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a crop image",
      });
    }

    // Step 1: Use existing plant identification system
    console.log("🌱 Officer uploading crop - Starting identification...");

    // Create a mock req object for the core identification function
    const identificationReq = {
      file: req.file,
      user: req.user,
      body: req.body,
    };

    let identificationResult = null;
    let identificationError = null;

    // Use existing plant identification logic
    try {
      // Call the core identification function
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
      console.log(
        "Plant identification failed, proceeding with manual entry option"
      );
      identificationError = error.message;
    }

    // Step 2: Handle plant name (API result or manual override)
    let plantName = req.body.manualPlantName;
    let scientificName = req.body.manualScientificName;
    let wasManualOverride = false;

    if (!plantName && identificationResult && identificationResult.data) {
      // Use API identification result
      const bestMatch =
        identificationResult.data.bestMatch ||
        identificationResult.data.suggestions?.[0];

      if (bestMatch) {
        plantName = bestMatch.localizedName || bestMatch.plant_name;
        scientificName =
          bestMatch.species?.scientificName || bestMatch.scientific_name;
      }
    } else if (plantName) {
      wasManualOverride = true;
    }

    if (!plantName) {
      return res.status(400).json({
        success: false,
        message: "Plant identification failed and no manual name provided",
      });
    }

    // Step 3: Handle price (Excel/PDF extraction or manual entry)
    let price = parseFloat(req.body.manualPrice);
    let priceSource = "manual";
    let receiptData = null;

    // Check if receipt file was uploaded
    if (req.files && req.files.receipt) {
      const receiptFile = req.files.receipt[0];
      console.log("📄 Processing receipt for price extraction...");

      try {
        let extractionResult;

        if (
          receiptFile.mimetype.includes("excel") ||
          receiptFile.mimetype.includes("spreadsheet")
        ) {
          extractionResult = await priceExtractor.extractFromExcel(
            receiptFile.path,
            plantName
          );
        } else if (receiptFile.mimetype === "application/pdf") {
          extractionResult = await priceExtractor.extractFromPDF(
            receiptFile.path,
            plantName
          );
        }

        if (
          extractionResult &&
          extractionResult.success &&
          extractionResult.extractedPrice
        ) {
          price = extractionResult.extractedPrice;
          priceSource = "receipt";
          receiptData = {
            filename: receiptFile.filename,
            extractedPrice: extractionResult.extractedPrice,
            uploadDate: new Date(),
          };
          console.log(`💰 Price extracted from receipt: ₹${price}`);
        }
      } catch (error) {
        console.log("Receipt processing failed, using manual price");
      }
    }

    if (!price || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price not found in receipt and no manual price provided",
      });
    }

    // Step 4: Create crop listing
    const cropListing = new CropListing({
      officer: req.user._id,
      plantName,
      scientificName,
      price,
      priceSource,
      images: [
        {
          url: req.file.path,
          filename: req.file.filename,
        },
      ],
      identificationData: {
        apiResult: identificationResult?.data || null,
        confidence: identificationResult?.data?.overallConfidence || 0,
        identificationService:
          identificationResult?.data?.primaryService || "manual",
        wasManualOverride,
      },
      receiptData,
      quantity: parseInt(req.body.quantity) || 1,
      metadata: {
        category: req.body.category,
        season: req.body.season,
        growthStage: req.body.growthStage,
        notes: req.body.notes,
      },
    });

    await cropListing.save();

    // Step 5: Generate inventory receipt
    const inventoryReceipt = await receiptGenerator.generateInventoryReceipt(
      req.user,
      cropListing
    );

    res.json({
      success: true,
      message: "Crop listed successfully",
      data: {
        cropListing,
        identificationUsed: !wasManualOverride,
        identificationConfidence:
          identificationResult?.data?.overallConfidence || 0,
        priceSource,
        inventoryReceipt,
      },
    });
  } catch (error) {
    console.error("Upload crop error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload crop",
      error: error.message,
    });
  }
};

export const getOfficerInventory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "active" } = req.query;

    const crops = await CropListing.find({
      officer: req.user._id,
      ...(status !== "all" && { status }),
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("officer", "name email phone");

    const total = await CropListing.countDocuments({
      officer: req.user._id,
      ...(status !== "all" && { status }),
    });

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
    console.error("Get inventory error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch inventory",
      error: error.message,
    });
  }
};

export const updateCropListing = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const crop = await CropListing.findOne({
      _id: id,
      officer: req.user._id,
    });

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: "Crop listing not found",
      });
    }

    // Update allowed fields
    const allowedUpdates = ["price", "quantity", "status", "metadata"];
    const updateData = {};

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    Object.assign(crop, updateData);
    await crop.save();

    res.json({
      success: true,
      message: "Crop listing updated successfully",
      data: crop,
    });
  } catch (error) {
    console.error("Update crop error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update crop listing",
      error: error.message,
    });
  }
};

export const deleteCropListing = async (req, res) => {
  try {
    const { id } = req.params;

    const crop = await CropListing.findOneAndDelete({
      _id: id,
      officer: req.user._id,
    });

    if (!crop) {
      return res.status(404).json({
        success: false,
        message: "Crop listing not found",
      });
    }

    res.json({
      success: true,
      message: "Crop listing deleted successfully",
    });
  } catch (error) {
    console.error("Delete crop error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete crop listing",
      error: error.message,
    });
  }
};

export const getOfficerTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "all" } = req.query;

    const transactions = await Transaction.find({
      officer: req.user._id,
      ...(status !== "all" && { status }),
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("farmer", "name email phone")
      .populate("cropListing", "plantName price images");

    const total = await Transaction.countDocuments({
      officer: req.user._id,
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
    console.error("Get transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
      error: error.message,
    });
  }
};
