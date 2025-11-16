const nurseryResults = [
  {
    id: 'nursery-001',
    name: 'Green Valley Nursery',
    distance: '2.5 km',
    stock_status: 'In Stock',
    location: { city: 'Coimbatore', state: 'TN', country: 'India' }
  },
  {
    id: 'nursery-002',
    name: 'AgroRoot Plant Depot',
    distance: '5.1 km',
    stock_status: 'Limited',
    location: { city: 'Erode', state: 'TN', country: 'India' }
  },
  {
    id: 'nursery-003',
    name: 'EcoLeaf Garden Center',
    distance: '8.9 km',
    stock_status: 'Out of Stock',
    location: { city: 'Salem', state: 'TN', country: 'India' }
  }
];

export async function searchNurseries(plantName, locationCoords) {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return nurseryResults;
}
