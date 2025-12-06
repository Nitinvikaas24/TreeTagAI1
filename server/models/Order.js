import { PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../config/db.js";

const generateOrderNumber = async () => {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `ORD${year}${month}${randomSuffix}`;
};

export const Order = {
  create: async (orderData) => {
    const orderNum = await generateOrderNumber();
    const timestamp = new Date().toISOString();

    const item = {
      PK: `ORDER#${orderNum}`,
      SK: 'DETAILS',
      
      // Foreign Key: Links Order to the User's Email
      GSI1PK: `USER#${orderData.user}`, 
      GSI1SK: `DATE#${timestamp}`,
      
      orderNumber: orderNum,
      user: orderData.user, // Stores the user's EMAIL
      items: orderData.items,
      total: orderData.total,
      status: orderData.status || 'processing',
      paymentMethod: orderData.paymentMethod,
      paymentStatus: orderData.paymentStatus || 'pending',
      shippingAddress: orderData.shippingAddress,
      trackingNumber: orderData.trackingNumber,
      notes: orderData.notes,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    }));
    return item;
  },

  // Optimized: Finds all orders for a specific email
  findByUserEmail: async (email) => {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1', 
      KeyConditionExpression: 'GSI1PK = :user',
      ExpressionAttributeValues: {
        ':user': `USER#${email}`
      }
    });
    const response = await docClient.send(command);
    return response.Items;
  },

  updateStatus: async (orderNumber, newStatus, notes) => {
    const timestamp = new Date().toISOString();
    
    const command = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: `ORDER#${orderNumber}`, SK: 'DETAILS' },
        UpdateExpression: "set #status = :s, #notes = :n, updatedAt = :u",
        ExpressionAttributeNames: { "#status": "status", "#notes": "notes" },
        ExpressionAttributeValues: {
            ":s": newStatus,
            ":n": notes,
            ":u": timestamp
        },
        ReturnValues: "ALL_NEW"
    });

    const response = await docClient.send(command);
    return response.Attributes;
  }
};

export default Order;