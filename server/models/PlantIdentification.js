import { PutCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import docClient from "../config/db.js"; // <--- FIXED: Default import (no curly braces)
import { v4 as uuidv4 } from 'uuid';

// Define the specific table for Plants
const TABLE_NAME = "Plantdb-dev"; 

export const PlantIdentification = {
  create: async (data) => {
    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const item = {
      PK: `PLANTID#${id}`,
      SK: 'DETAILS',
      
      // Link to User (GSI1)
      GSI1PK: `USER#${data.userEmail}`,
      GSI1SK: `DATE#${timestamp}`,
      
      _id: id,
      userEmail: data.userEmail,
      originalImage: data.originalImage,
      identifiedPlant: {
        scientificName: data.identifiedPlant?.scientificName,
        commonName: data.identifiedPlant?.commonName,
        probability: data.identifiedPlant?.probability,
        subtype: data.identifiedPlant?.subtype,
        translatedName: data.identifiedPlant?.translatedName || {}
      },
      apiResponse: data.apiResponse || {}, 
      status: data.status || 'pending',
      error: data.error,
      
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    }));

    return item;
  },

  findById: async (id) => {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `PLANTID#${id}`,
        SK: 'DETAILS'
      }
    });
    const response = await docClient.send(command);
    return response.Item;
  },

  // Get history for a user
  findByUserEmail: async (email) => {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :user',
      ExpressionAttributeValues: {
        ':user': `USER#${email}`
      },
      ScanIndexForward: false // Show newest first
    });
    const response = await docClient.send(command);
    return response.Items;
  }
};

export default PlantIdentification;