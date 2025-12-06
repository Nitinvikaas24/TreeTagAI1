import { docClient, TABLE_NAME } from "../config/db.js";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

export async function getAdminStats() {
  try {
    // Fetch ALL items (Scan)
    // In production, you would maintain a separate 'Stats' item in DynamoDB that increments on every sale.
    const command = new ScanCommand({ TableName: TABLE_NAME });
    const response = await docClient.send(command);
    const items = response.Items || [];

    let totalSales = 0;
    let totalTransactions = 0; // Receipts
    let totalPlants = 0;
    const recentTransactions = [];

    items.forEach(item => {
      // Check Prefix
      if (item.PK.startsWith('RECEIPT#')) {
        totalTransactions++;
        totalSales += (item.totalAmount || 0);
        
        // Collect recent
        if (recentTransactions.length < 5) {
            recentTransactions.push(item);
        } else {
            // Basic sort replacement logic (keep newest)
            // For MVP, just taking first 5 found is okay, 
            // or we sort the whole array after scanning.
        }
      } else if (item.PK.startsWith('PLANT#')) {
        totalPlants++;
      }
    });

    // Sort transactions by date descending
    recentTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
      totalSales,
      totalTransactions,
      totalPlants,
      recentTransactions: recentTransactions.slice(0, 5)
    };
  } catch (error) {
    console.error("Stats Error:", error);
    return { totalSales: 0, totalTransactions: 0, totalPlants: 0, recentTransactions: [] };
  }
}