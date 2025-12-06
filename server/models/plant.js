import { PutCommand, GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import docClient from "../config/db.js";
const TABLE_NAME = "Userdb-dev";

export const Plant = {
  create: async (plantData) => {
    const timestamp = new Date().toISOString();
    
    const item = {
      PK: `PLANT#${plantData.scientific_name}`,
      SK: 'DETAILS',
      scientific_name: plantData.scientific_name,
      common_names: plantData.common_names || [],
      price_default: plantData.price_default,
      stock: plantData.stock || 0,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    }));
    return item;
  },

  findByScientificName: async (name) => {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `PLANT#${name}`,
        SK: 'DETAILS'
      }
    });
    const response = await docClient.send(command);
    return response.Item;
  },

  findAll: async () => {
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'begins_with(PK, :prefix)',
      ExpressionAttributeValues: {
        ':prefix': 'PLANT#'
      }
    });
    const response = await docClient.send(command);
    return response.Items;
  }
};

export default Plant;