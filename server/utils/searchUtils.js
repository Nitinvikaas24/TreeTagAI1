import Plant from '../models/Plant.js';

/**
 * Search for plants with advanced filtering options
 */
export const searchPlants = async ({
    query = '',
    category = null,
    minPrice = 0,
    maxPrice = Infinity,
    attributes = [],
    sortBy = 'name',
    sortOrder = 'asc',
    page = 1,
    limit = 10,
    inStock = false
}) => {
    try {
        // Build search criteria
        const searchCriteria = {
            active: true
        };

        // Text search
        if (query) {
            searchCriteria.$or = [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { scientificName: { $regex: query, $options: 'i' } }
            ];
        }

        // Category filter
        if (category) {
            searchCriteria.category = category;
        }

        // Price range
        searchCriteria.price = {
            $gte: minPrice,
            $lte: maxPrice || Infinity
        };

        // Stock filter
        if (inStock) {
            searchCriteria.stock = { $gt: 0 };
        }

        // Attribute filters
        if (attributes && attributes.length > 0) {
            searchCriteria.attributes = {
                $all: attributes.map(attr => ({
                    $elemMatch: {
                        name: attr.name,
                        value: attr.value
                    }
                }))
            };
        }

        // Execute search with pagination
        const skip = (page - 1) * limit;
        
        const [plants, total] = await Promise.all([
            Plant.find(searchCriteria)
                .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
                .skip(skip)
                .limit(limit)
                .populate('category'),
            Plant.countDocuments(searchCriteria)
        ]);

        // Calculate pagination info
        const totalPages = Math.ceil(total / limit);
        const hasMore = page < totalPages;

        return {
            plants,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: total,
                hasMore,
                itemsPerPage: limit
            }
        };
    } catch (error) {
        throw new Error('Error searching plants: ' + error.message);
    }
};

/**
 * Get featured plants
 */
export const getFeaturedPlants = async (limit = 6) => {
    try {
        return await Plant.find({ 
            active: true,
            featured: true,
            stock: { $gt: 0 }
        })
        .sort('-createdAt')
        .limit(limit)
        .populate('category');
    } catch (error) {
        throw new Error('Error getting featured plants: ' + error.message);
    }
};

/**
 * Get plant recommendations based on user's order history
 */
export const getPersonalizedRecommendations = async (userId, limit = 6) => {
    try {
        // Get user's order history
        const orders = await Order.find({ user: userId })
            .populate('items.plant');

        // Extract categories and attributes from purchased plants
        const purchaseHistory = orders.reduce((acc, order) => {
            order.items.forEach(item => {
                if (item.plant) {
                    // Track categories
                    if (item.plant.category) {
                        acc.categories[item.plant.category] = 
                            (acc.categories[item.plant.category] || 0) + 1;
                    }
                    
                    // Track attributes
                    item.plant.attributes.forEach(attr => {
                        const key = `${attr.name}:${attr.value}`;
                        acc.attributes[key] = (acc.attributes[key] || 0) + 1;
                    });
                }
            });
            return acc;
        }, { categories: {}, attributes: {} });

        // Get top categories and attributes
        const topCategories = Object.entries(purchaseHistory.categories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([id]) => id);

        const topAttributes = Object.entries(purchaseHistory.attributes)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([key]) => {
                const [name, value] = key.split(':');
                return { name, value };
            });

        // Find similar plants
        const recommendations = await Plant.find({
            active: true,
            stock: { $gt: 0 },
            $or: [
                { category: { $in: topCategories } },
                {
                    attributes: {
                        $elemMatch: {
                            $or: topAttributes.map(attr => ({
                                name: attr.name,
                                value: attr.value
                            }))
                        }
                    }
                }
            ]
        })
        .limit(limit)
        .populate('category');

        return recommendations;
    } catch (error) {
        throw new Error('Error getting recommendations: ' + error.message);
    }
};

/**
 * Search plants by similarity
 */
export const findSimilarPlants = async (plantId, limit = 6) => {
    try {
        const plant = await Plant.findById(plantId);
        if (!plant) {
            throw new Error('Plant not found');
        }

        // Find plants in same category with similar attributes
        const similarPlants = await Plant.find({
            _id: { $ne: plantId },
            active: true,
            stock: { $gt: 0 },
            $or: [
                { category: plant.category },
                {
                    attributes: {
                        $elemMatch: {
                            $or: plant.attributes.map(attr => ({
                                name: attr.name,
                                value: attr.value
                            }))
                        }
                    }
                }
            ]
        })
        .limit(limit)
        .populate('category');

        return similarPlants;
    } catch (error) {
        throw new Error('Error finding similar plants: ' + error.message);
    }
};

export default {
    searchPlants,
    getFeaturedPlants,
    getPersonalizedRecommendations,
    findSimilarPlants
};