import { Plant } from '../models/plant.js';
import docClient from "../config/db.js"; // <--- 1. FIXED: Remove { TABLE_NAME }
import { UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = "Plantdb-dev";
// Get all plants
export const getAllPlants = async (req, res) => {
    try {
        const plants = await Plant.findAll();
        res.status(200).json(plants);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve plants: ' + error.message });
    }
};

// Add plant
export const addPlant = async (req, res) => {
    try {
        const newPlant = await Plant.create(req.body);
        res.status(201).json(newPlant);
    } catch (error) {
        res.status(500).json({ message: 'Failed to add plant: ' + error.message });
    }
};

// Update plant
export const updatePlant = async (req, res) => {
    // Note: In our DynamoDB design, Scientific Name is the ID. 
    // If 'id' param is the scientific_name, this works. 
    // If 'id' is a random ID, we need to adjust. Assuming scientific_name here based on your model.
    const { id } = req.params; // Expecting scientific_name here

    try {
        const command = new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { PK: `PLANT#${id}`, SK: 'DETAILS' },
            UpdateExpression: "set price_default = :p, stock = :s",
            ExpressionAttributeValues: {
                ":p": req.body.price_default,
                ":s": req.body.stock
            },
            ReturnValues: "ALL_NEW"
        });

        const result = await docClient.send(command);
        res.status(200).json(result.Attributes);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update plant: ' + error.message });
    }
};

// Delete plant
export const deletePlant = async (req, res) => {
    const { id } = req.params; // Expecting scientific_name

    try {
        const command = new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { PK: `PLANT#${id}`, SK: 'DETAILS' }
        });

        await docClient.send(command);
        res.status(200).json({ message: 'Plant successfully deleted.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete plant: ' + error.message });
    }
};