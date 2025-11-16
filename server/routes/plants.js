import express from "express";
import Plant from "../models/plant.js";
import { learnAboutPlant } from "../services/knowledgeService.js";
import {
  getAllPlants,
  addPlant,
  updatePlant,
  deletePlant,
} from "../controllers/plantController.js";
import { protect, officerCheck } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAllPlants);
router.post("/", protect, officerCheck, addPlant);
router.put("/:id", protect, officerCheck, updatePlant);
router.delete("/:id", protect, officerCheck, deletePlant);

// This route finds a plant by name, or creates it if it doesn't exist
// file: server/routes/plants.js

// ... (your imports and router definition)

// This route finds a plant by name, or creates it if it doesn't exist
router.get('/details/:scientificName', async (req, res) => {
  const { scientificName } = req.params;

  try {
    // 1. Check if the plant is already in our database
    let plant = await Plant.findOne({ scientific_name: scientificName });

    // 2. If it is, return it.
    if (plant) {
      console.log('Found plant in DB:', plant.scientific_name);
      return res.json(plant);
    }

    // 3. If not, call the AI to learn about it.
    console.log('Plant not found. Calling LLM...');
    const llmData = await learnAboutPlant(scientificName);

    // 4. Create a new plant with the LLM data and default stock/price
    const newPlant = new Plant({
      scientific_name: scientificName,
      common_names: llmData.commonName ? [llmData.commonName] : [scientificName.split(' ')[0]],
      description: llmData.description,
      llm_content_cache: {
        benefits: llmData.benefits,
        care: llmData.care,
      },
      price_default: 100, // Default price for new plants
      stock: 10,           // Default stock
    });

    // --- THIS IS THE FIX ---
    // 5. Save the new plant and get the returned document (which has the _id)
    const savedPlant = await newPlant.save();
    console.log('New plant saved to DB:', savedPlant.scientific_name);

    // 6. Return the 'savedPlant' object, which now includes the '_id'
    res.status(201).json(savedPlant);
    // --- END OF FIX ---

  } catch (error) {
    console.error('Error in /details route:', error.message);
    res.status(500).json({ message: "Failed to get plant details: " + error.message });
  }
});

// ... (your other router.get('/:id', ...) function)
// ... (export default router)

// This route is for finding a plant by its MongoDB _id
// We keep it because it's still useful for other parts of the app
router.get("/:id", async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);

    if (!plant) {
      return res.status(404).json({ message: "Plant not found in database" });
    }

    res.json(plant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;