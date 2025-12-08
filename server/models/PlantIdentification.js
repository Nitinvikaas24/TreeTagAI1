import { PutCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import docClient from "../config/db.js";
import { v4 as uuidv4 } from 'uuid';

const TABLE_NAME = "Plantdb-dev"; 

export const PlantIdentification = {
  create: async (data) => {
    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const item = {
      PK: `PLANTID#${id}`,
      SK: 'DETAILS',
      
      // Link to User via Phone Number
      // GSI1PK = "USER#+919876543210"
      GSI1PK: `USER#${data.userPhoneNumber}`, 
      GSI1SK: `DATE#${timestamp}`,
      
      _id: id,
      userPhoneNumber: data.userPhoneNumber, // <--- Storing phone number
      identifiedPlant: data.identifiedPlant,
      status: data.status || 'pending',
      createdAt: timestamp
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    }));

    return item;
  },

  // Get history by Phone Number
  findByUserPhone: async (phoneNumber) => {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :user',
      ExpressionAttributeValues: {
        ':user': `USER#${phoneNumber}`
      },
      ScanIndexForward: false // Newest first
    });
    const response = await docClient.send(command);
    return response.Items;
  }
};

export default PlantIdentification;