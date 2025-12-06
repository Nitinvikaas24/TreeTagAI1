import { PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../config/db.js";
import { v4 as uuidv4 } from 'uuid';

export const Transaction = {
  create: async (data) => {
    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const item = {
      PK: `TX#${id}`,
      SK: 'DETAILS',
      
      GSI1PK: `OFFICER#${data.officerEmail}`,
      GSI1SK: `DATE#${timestamp}`,

      _id: id,
      officerEmail: data.officerEmail,
      farmerEmail: data.farmerEmail,
      cropListingId: data.cropListingId,
      amount: data.amount,
      status: data.status || 'completed',
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    }));
    return item;
  },

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
  }
};

export default Transaction;