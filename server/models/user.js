import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import docClient from "../config/db.js"; // <--- FIXED: Default import

// Define the table name here locally
const TABLE_NAME = "Userdb-dev";

const User = {
  // Create a new user (Farmer)
  create: async (userData) => {
    const params = {
      TableName: TABLE_NAME,
      Item: userData,
    };
    try {
      await docClient.send(new PutCommand(params));
      return userData;
    } catch (error) {
      throw error;
    }
  },

  // Find user by Phone Number (The new Primary Key)
  findByPhoneNumber: async (phoneNumber) => {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        phoneNumber: phoneNumber, // Direct lookup
      },
    };
    try {
      const result = await docClient.send(new GetCommand(params));
      return result.Item;
    } catch (error) {
      throw error;
    }
  },
};

export default User;