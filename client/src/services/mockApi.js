// Mock API for client-side development and tests
// Exports async functions that simulate network delays and return fake data

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fake PlantNet-like response for identifyPlant
export async function identifyPlant(imageData) {
  // imageData is ignored in the mock, but kept for API compatibility
  await delay(1000); // simulate 1 second network + processing delay

  // Return a simplified PlantNet-like JSON structure
  return {
    id: 'mock_identification_123',
    meta: {
      service: 'plantnet-mock',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    },
    results: [
      {
        score: 0.92,
        species: {
          scientificNameWithoutAuthor: 'Ficus lyrata',
          scientificNameAuthorship: 'Warb.',
          commonNames: ['Fiddle-leaf fig'],
          family: 'Moraceae',
          wikiUrl: 'https://en.wikipedia.org/wiki/Fiddle-leaf_fig',
        },
        images: [
          { url: 'https://example.com/mock_images/ficus_1.jpg', license: 'CC0' },
        ],
      },
      {
        score: 0.07,
        species: {
          scientificNameWithoutAuthor: 'Ficus elastica',
          commonNames: ['Rubber fig'],
          family: 'Moraceae',
        },
      },
    ],
  };
}

// Fake plant details returned by getPlantDetails
export async function getPlantDetails(plantId) {
  await delay(500); // simulate 0.5 second delay

  // Basic fake inventory and pricing information
  const fakeCatalog = {
    'ficus-lyrata': {
      id: 'ficus-lyrata',
      name: 'Fiddle-leaf fig',
      stock: 12,
      price: 45.0,
      currency: 'USD',
      description: 'A popular indoor tree with large, violin-shaped leaves.',
    },
    'ficus-elastica': {
      id: 'ficus-elastica',
      name: 'Rubber fig',
      stock: 5,
      price: 30.0,
      currency: 'USD',
      description: 'A hardy indoor plant with glossy leaves.',
    },
  };

  const base = fakeCatalog[plantId] || {
    id: plantId,
    name: 'Unknown plant',
    stock: 0,
    price: 0,
    currency: 'USD',
    description: 'No details available for this plant in the mock catalog.',
  };

  // Add a fake LLM-generated story
  const story = `Meet ${base.name}! This plant is known for its striking foliage and is often recommended for bright, indirect light. In our mock nursery it has ${base.stock} in stock and usually ships within 3-5 business days.`;

  return {
    ...base,
    story,
    careTips: [
      'Bright, indirect light',
      'Water when top 2 inches of soil are dry',
      'Average home humidity',
    ],
    images: [
      `https://example.com/mock_images/${base.id}_1.jpg`,
      `https://example.com/mock_images/${base.id}_2.jpg`,
    ],
  };
}

// Fake createSale endpoint
export async function createSale(cartData) {
  // cartData could include items, total, customer info; ignored for mock
  await delay(1500); // simulate 1.5 seconds processing delay

  const saleId = `SALE-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  const invoiceUrl = `https://example.com/invoices/${saleId}.pdf`;

  return {
    success: true,
    saleId,
    invoiceUrl,
    message: 'Sale created successfully (mock).',
    timestamp: new Date().toISOString(),
  };
}
