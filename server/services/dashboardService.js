import Plant from '../models/plant.js';
import Receipt from '../models/Receipt.js';

export async function getAdminStats() {
  const [salesAggregate, totalTransactions, totalPlants, recentTransactions] = await Promise.all([
    Receipt.aggregate([
      { $group: { _id: null, totalSales: { $sum: '$total' } } }
    ]),
    Receipt.countDocuments(),
    Plant.countDocuments(),
    Receipt.find().sort({ createdAt: -1 }).limit(5)
  ]);

  const totalSales = salesAggregate[0]?.totalSales || 0;

  return {
    totalSales,
    totalTransactions,
    totalPlants,
    recentTransactions
  };
}