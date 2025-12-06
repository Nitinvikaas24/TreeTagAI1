import { PutCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import docClient from "../config/db.js"; // <--- FIXED: Default import
import { v4 as uuidv4 } from 'uuid';

// Define the specific table for Receipts
const TABLE_NAME = "Receiptdb-dev";

const Receipt = {
  // Create a new Receipt
  create: async (data) => {
    const receiptId = uuidv4();
    const timestamp = new Date().toISOString();

    const newReceipt = {
      receiptId: receiptId,           // Primary Key
      userPhoneNumber: data.userPhoneNumber, // To link to the Farmer
      amount: data.amount,
      type: data.type || "general",
      description: data.description,
      date: timestamp,
      ...data // Any other details
    };

    const params = {
      TableName: TABLE_NAME,
      Item: newReceipt,
    };

    try {
      await docClient.send(new PutCommand(params));
      return newReceipt;
    } catch (error) {
      console.error("Error creating receipt:", error);
      throw error;
    }
  },

  // Get a specific receipt by ID
  findById: async (receiptId) => {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        receiptId: receiptId,
      },
    };
    try {
      const result = await docClient.send(new GetCommand(params));
      return result.Item;
    } catch (error) {
      throw error;
    }
  },

  // Find all receipts for a specific Farmer (using Phone Number)
  findByUser: async (userPhoneNumber) => {
    const params = {
      TableName: TABLE_NAME,
      IndexName: "UserPhoneIndex", // <--- You must create this Index in AWS
      KeyConditionExpression: "userPhoneNumber = :phone",
      ExpressionAttributeValues: {
        ":phone": userPhoneNumber,
      },
    };

    try {
      const result = await docClient.send(new QueryCommand(params));
      return result.Items;
    } catch (error) {
      throw error;
    }
  },
};

export default Receipt;