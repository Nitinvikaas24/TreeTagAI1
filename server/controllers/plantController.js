import Plant from '../models/plant.js'; // Assuming the model is named plant.js and exported correctly
import mongoose from 'mongoose';

// Controller function to get all plants (for Admin Dashboard)
export const getAllPlants = async (req, res) => {
    try {
        const plants = await Plant.find({});
        res.status(200).json(plants);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve plants: ' + error.message });
    }
};

// Controller function to add a new plant
export const addPlant = async (req, res) => {
    // Note: We are assuming all required data (scientific_name, price_default, stock) is in req.body
    const newPlant = new Plant(req.body);
    try {
        // Validation check for duplicate scientific_name (handled by Mongoose schema but good practice)
        await newPlant.save();
        res.status(201).json(newPlant);
    } catch (error) {
        // Handle common errors like duplicate keys (code 11000)
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A plant with this scientific name already exists.' });
        }
        res.status(500).json({ message: 'Failed to add plant: ' + error.message });
    }
};

// Controller function to update an existing plant
export const updatePlant = async (req, res) => {
    const { id } = req.params;
    
    // Check if the ID format is valid (avoids Mongoose casting error)
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid Plant ID format.' });
    }

    try {
        const updatedPlant = await Plant.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true } // { new: true } returns the updated document
        );

        if (!updatedPlant) {
            return res.status(404).json({ message: 'Plant not found for update.' });
        }

        res.status(200).json(updatedPlant);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update plant: ' + error.message });
    }
};

// Controller function to delete a plant
export const deletePlant = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid Plant ID format.' });
    }

    try {
        const result = await Plant.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({ message: 'Plant not found for deletion.' });
        }

        // Return the deleted plant object or a simple success message
        res.status(200).json({ message: 'Plant successfully deleted.', deletedPlant: result });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete plant: ' + error.message });
    }
};

// Export all functions
//export { getAllPlants, addPlant, updatePlant, deletePlant };