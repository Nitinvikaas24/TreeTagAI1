import express from "express";
import { Plant } from "../models/plant.js"; // DynamoDB Model
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

// Route to find plant or learn via AI
router.get('/details/:scientificName', async (req, res) => {
  const { scientificName } = req.params;

  try {
    // 1. Check DB (DynamoDB)
    let plant = await Plant.findByScientificName(scientificName);

    if (plant) {
      console.log('Found plant in DB:', plant.scientific_name);
      return res.json(plant);
    }

    // 2. Call AI
    console.log('Plant not found. Calling LLM...');
    // Assuming learnAboutPlant returns: { description, benefits, care, commonName }
    const llmData = await learnAboutPlant(scientificName);

    // 3. Create new plant in DynamoDB
    const newPlantData = {
      scientific_name: scientificName,
      common_names: llmData.commonName ? [llmData.commonName] : [scientificName.split(' ')[0]],
      description: llmData.description,
      // Store LLM content. You might need to add this field to your Plant.create logic if not present
      price_default: 100,
      stock: 10
    };
    
    // Note: Ensure your Plant.create model supports 'description' if you want to save it.
    // For now, we fit it into the existing schema structure.
    const savedPlant = await Plant.create(newPlantData);
    
    console.log('New plant saved to DB:', savedPlant.scientific_name);
    res.status(201).json(savedPlant);

  } catch (error) {
    console.error('Error in /details route:', error.message);
    res.status(500).json({ message: "Failed to get plant details: " + error.message });
  }
});

// Find by ID (Expects scientific_name as ID in this DB design)
router.get("/:id", async (req, res) => {
  try {
    const plant = await Plant.findByScientificName(req.params.id);
    if (!plant) {
      return res.status(404).json({ message: "Plant not found" });
    }
    res.json(plant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;