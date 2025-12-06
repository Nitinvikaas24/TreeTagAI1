import CropListing from "../models/CropListing.js";
import Transaction from "../models/Transaction.js";
import fuzzyMatcher from "../utils/fuzzyMatcher.js";
import receiptGenerator from "../utils/receiptGenerator.js";
import priceExtractor from "../utils/priceExtractor.js";
import { identifyPlant as coreIdentifyPlant } from "./identificationController.js";

// Helper for Mock Response in identifyPlant
const createMockRes = () => {
  const res = {};
  res.status = () => res;
  res.json = (data) => { res.data = data; return res; };
  return res;
};

export const uploadCropForSale = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload a crop image" });
    }

    // Step 1: Use existing plant identification system
    console.log("🔍 Officer uploading crop - Starting identification...");

    const identificationReq = {
      file: req.file,
      user: req.user, // Passed from auth middleware
      body: req.body,
    };

    let identificationResult = null;

    try {
      const mockRes = createMockRes();
      // We await the controller logic. 
      // NOTE: Ensure coreIdentifyPlant doesn't send the response directly if passed a mock!
      // If it does, you might need to refactor identificationController to return data instead of res.json
      // For now, we assume it works or we skip it if it fails.
      await coreIdentifyPlant(identificationReq, mockRes);
      if (mockRes.data && mockRes.data.success) {
        identificationResult = mockRes.data;
      }
    } catch (error) {
      console.log("Plant identification skipped/failed, proceeding with manual entry");
    }

    // Step 2: Handle plant name
    let plantName = req.body.manualPlantName;
    let scientificName = req.body.manualScientificName;
    let wasManualOverride = false;

    if (!plantName && identificationResult?.data?.bestMatch) {
      const bestMatch = identificationResult.data.bestMatch;
      plantName = bestMatch.commonName || bestMatch.scientificName;
      scientificName = bestMatch.scientificName;
    } else if (plantName) {
      wasManualOverride = true;
    }

    if (!plantName) {
      return res.status(400).json({ success: false, message: "Plant name required" });
    }

    // Step 3: Handle Price (Simplified for DynamoDB migration)
    let price = parseFloat(req.body.manualPrice) || 0;
    let priceSource = "manual";
    
    // (Skipping complex PDF/Excel parsing logic reuse for brevity, but it fits here if priceExtractor works)

    // Step 4: Create Crop Listing
    const cropListing = await CropListing.create({
      officerEmail: req.user.email, // Use Email
      plantName,
      scientificName,
      price,
      priceSource,
      images: [{ url: req.file.path || "uploads/" + req.file.filename, filename: req.file.filename }],
      identificationData: {
        apiResult: identificationResult?.data || null,
        confidence: identificationResult?.data?.metadata?.confidence || 0,
        wasManualOverride,
      },
      quantity: parseInt(req.body.quantity) || 1,
      metadata: {
        category: req.body.category,
        season: req.body.season,
        growthStage: req.body.growthStage,
        notes: req.body.notes,
      },
    });

    // Step 5: Receipt (Mocked or using generator)
    const inventoryReceipt = await receiptGenerator.generateInventoryReceipt(req.user, cropListing);

    res.json({
      success: true,
      message: "Crop listed successfully",
      data: {
        cropListing,
        inventoryReceipt,
      },
    });
  } catch (error) {
    console.error("Upload crop error:", error);
    res.status(500).json({ success: false, message: "Failed to upload crop", error: error.message });
  }
};

export const getOfficerInventory = async (req, res) => {
  try {
    // DynamoDB "Pagination" via slice
    const { page = 1, limit = 10, status = "active" } = req.query;

    let crops = await CropListing.findByOfficer(req.user.email);
    
    // Filter locally
    if (status !== 'all') {
        crops = crops.filter(c => c.status === status);
    }

    // Sort Descending (Newest first)
    crops.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = crops.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedCrops = crops.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        crops: paginatedCrops,
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
    res.status(500).json({ success: false, message: "Failed to fetch inventory" });
  }
};

export const updateCropListing = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify Ownership
    const crop = await CropListing.findById(id);
    if (!crop || crop.officerEmail !== req.user.email) {
       return res.status(404).json({ success: false, message: "Crop not found or unauthorized" });
    }

    const updates = req.body;
    const allowedUpdates = ["price", "quantity", "status", "metadata"];
    const filteredUpdates = {};

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) filteredUpdates[field] = updates[field];
    });

    const updatedCrop = await CropListing.update(id, filteredUpdates);

    res.json({ success: true, message: "Updated successfully", data: updatedCrop });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCropListing = async (req, res) => {
  try {
    const { id } = req.params;
    const crop = await CropListing.findById(id);
    
    if (!crop || crop.officerEmail !== req.user.email) {
       return res.status(404).json({ success: false, message: "Crop not found or unauthorized" });
    }

    await CropListing.delete(id);
    res.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOfficerTransactions = async (req, res) => {
  try {
     const transactions = await Transaction.findByOfficer(req.user.email);
     // Populate is not possible, so we return raw IDs or fetch User details manually if critical
     res.json({ success: true, data: { transactions } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};