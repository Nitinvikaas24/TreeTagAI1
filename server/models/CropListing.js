import { PutCommand, QueryCommand, UpdateCommand, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../config/db.js";
import { v4 as uuidv4 } from 'uuid';

export const CropListing = {
  create: async (data) => {
    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const item = {
      PK: `CROP#${id}`,
      SK: 'DETAILS',
      
      // GSI to find crops by Officer
      GSI1PK: `OFFICER#${data.officerEmail}`,
      GSI1SK: `DATE#${timestamp}`,

      _id: id,
      officerEmail: data.officerEmail, // Storing email
      plantName: data.plantName,
      scientificName: data.scientificName,
      price: data.price,
      priceSource: data.priceSource,
      quantity: data.quantity || 1,
      status: 'active',
      images: data.images || [],
      
      identificationData: data.identificationData || {},
      receiptData: data.receiptData || null,
      metadata: data.metadata || {},

      createdAt: timestamp,
      updatedAt: timestamp
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    }));

    return item;
  },

  // Fetch all crops for an officer
  findByOfficer: async (officerEmail) => {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :officer',
      ExpressionAttributeValues: {
        ':officer': `OFFICER#${officerEmail}`
      }
    });
    const response = await docClient.send(command);
    return response.Items;
  },

  findById: async (id) => {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `CROP#${id}`, SK: 'DETAILS' }
    });
    const response = await docClient.send(command);
    return response.Item;
  },

  update: async (id, updates) => {
    // Construct Dynamic Update Expression
    let updateExp = "set updatedAt = :u";
    const expValues = { ":u": new Date().toISOString() };
    const expNames = {};

    Object.keys(updates).forEach((key, idx) => {
      updateExp += `, #${key} = :val${idx}`;
      expNames[`#${key}`] = key;
      expValues[`:val${idx}`] = updates[key];
    });

    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `CROP#${id}`, SK: 'DETAILS' },
      UpdateExpression: updateExp,
      ExpressionAttributeNames: expNames,
      ExpressionAttributeValues: expValues,
      ReturnValues: "ALL_NEW"
    });

    const response = await docClient.send(command);
    return response.Attributes;
  },

  delete: async (id) => {
    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: `CROP#${id}`, SK: 'DETAILS' }
    }));
  }
};

export default CropListing;