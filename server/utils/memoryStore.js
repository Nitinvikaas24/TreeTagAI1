// In-memory database for plants and sales

// Fake plants inventory
export const plants = [
  {
    id: 'plant-001',
    scientific_name: 'Mangifera indica',
    common_names: ['Mango', 'Aam'],
    price_default: 350,
    stock: 25,
    description: 'A tropical fruit tree known for its delicious sweet fruit.',
  },
  {
    id: 'plant-002',
    scientific_name: 'Azadirachta indica',
    common_names: ['Neem', 'Margosa'],
    price_default: 180,
    stock: 40,
    description: 'A medicinal tree with antibacterial and antifungal properties.',
  },
  {
    id: 'plant-003',
    scientific_name: 'Ficus religiosa',
    common_names: ['Peepal', 'Sacred Fig', 'Bodhi Tree'],
    price_default: 220,
    stock: 15,
    description: 'A large fig tree considered sacred in Hindu and Buddhist traditions.',
  },
];

// Sales records
export let sales = [];

/**
 * Find a plant by its ID
 * @param {string} id - The plant ID
 * @returns {object|undefined} The plant object or undefined if not found
 */
export function findPlantById(id) {
  return plants.find((plant) => plant.id === id);
}

/**
 * Update plant stock by decrementing quantity
 * @param {string} id - The plant ID
 * @param {number} quantityToDecrement - Amount to reduce from stock
 * @returns {boolean} true if successful, false if insufficient stock or plant not found
 */
export function updatePlantStock(id, quantityToDecrement) {
  const plantIndex = plants.findIndex(p => p.id === id);
  
  if (plantIndex === -1) {
    return false;
  }
  
  const plant = plants[plantIndex];
  
  if (plant.stock >= quantityToDecrement) {
    plants[plantIndex].stock -= quantityToDecrement;
    return true;
  }
  
  return false;
}

/**
 * Create a new sale record
 * @param {object} saleData - The sale data to store
 * @returns {object} The created sale with saleId and createdAt
 */
export function createSale(saleData) {
  const newSale = {
    ...saleData,
    saleId: `SALE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    createdAt: new Date(),
  };
  
  sales.push(newSale);
  return newSale;
}