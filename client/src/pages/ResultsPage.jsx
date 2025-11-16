import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  // This is the full response from PlantNet: { results: [...] }
  const identification = location.state && location.state.identification;
  
  // 'selected' is the SUGGESTION from PlantNet (e.g., Sunflower)
  const [selected, setSelected] = useState(null); 
  // 'details' is the REAL PLANT from our DB { _id: "...", stock: 25, ... }
  const [details, setDetails] = useState(null); 
  const [nearbyNurseries, setNearbyNurseries] = useState(null);
  
  const [loadingDetails, setLoadingDetails] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    // Check for the REAL 'results' array from PlantNet
    if (!identification || !identification.results || identification.results.length === 0) {
      toast.error('No identification results found.');
      navigate('/user/identify', { replace: true });
    } else {
      // Auto-select the first (best) result
      setSelected(identification.results[0]);
    }
  }, [identification, navigate]);

  // --- FINAL CORRECTED fetchDetails FUNCTION ---
  // This function now uses the plant's scientific name to call the smart backend route
  async function fetchDetails() {
    if (!selected) {
      toast.error('No plant selected');
      return;
    }

    setLoadingDetails(true);
    setDetails(null);
    
    // 1. Get the scientific name from the selected PlantNet result
    const scientificName = selected.species.scientificNameWithoutAuthor;
    
    try {
      // 2. Call your smart backend route using the scientific name
      const response = await fetch(`/api/v1/plants/details/${scientificName}`);
      
      const plantData = await response.json();

      if (!response.ok) {
        throw new Error(plantData.message || 'Plant not found');
      }
      
      // 3. Set the REAL plant data (this object has the _id and LLM data)
      setDetails(plantData); 
      toast.success(`${plantData.common_names[0]} details loaded!`);

    } catch (err) {
      console.error('Failed to load plant details:', err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setLoadingDetails(false);
    }
  }

  async function searchNearbyNurseries(scientificName) {
    if (!scientificName) {
      toast.error('Missing plant name for search');
      return;
    }

    try {
      const response = await fetch(
        `/api/v1/search/nurseries?plantName=${encodeURIComponent(scientificName)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to search nearby stock');
      }

      setNearbyNurseries(data);
    } catch (error) {
      console.error('Nearby nursery search failed:', error);
      toast.error(error.message);
      setNearbyNurseries([]);
    }
  }

  // This adds the REAL plant object to the cart
  const handleAddToCart = () => {
    if (!details) {
      toast.error('Please click "Get Plant Details" first!');
      return;
    }
    // 'details' is the object with the '_id' from MongoDB
    addToCart(details); 
    toast.success(`${details.common_names[0]} added to cart!`);
    navigate('/user/cart');
  };

  if (!identification || !identification.results) return null; 

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-start justify-center">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold mb-4">Identification Results</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="md:col-span-2">
            <h2 className="text-lg font-medium mb-4">Top matches</h2>
            
            {/* Map over the real 'results' array from PlantNet */}
            {identification.results.map((result, idx) => (
              <div
                key={idx}
                onClick={() => setSelected(result)}
                className={`p-3 mb-3 rounded border ${selected === result ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white'} cursor-pointer`}
              >
                <div className="font-semibold">{result.species?.commonNames?.[0] || 'Unknown'}</div>
                <div className="text-sm text-gray-600 italic">{result.species?.scientificNameWithoutAuthor}</div>
                <div className="text-sm text-gray-500 mt-1">Score: {(result.score * 100).toFixed(0)}%</div>
              </div>
            ))}
          </div>

          {/* Column 2: Details (from our Backend/LLM) */}
          <div>
            <h3 className="text-lg font-medium mb-4">Details</h3>
            
            {selected && !details && (
              <button
                onClick={fetchDetails}
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                disabled={loadingDetails}
              >
                {loadingDetails ? 'Learning...' : 'Get Plant Details'}
              </button>
            )}

            {details && (
              <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-100">
                <div className="font-semibold text-lg">{details.common_names[0]}</div>
                <div className="text-sm text-gray-600">Price: ₹{details.price_default}</div>
                <div className="text-sm text-gray-600">Stock: {details.stock}</div>
                
                {/* Display the new LLM content! */}
                {details.description && (
                  <p className="text-sm text-gray-700 mt-2">{details.description}</p>
                )}

                <div className="mt-3">
                  <div className="mt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleAddToCart}
                      className="sm:flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
                    >
                      Add to Cart & View Billing
                    </button>
                    <button
                      onClick={() => searchNearbyNurseries(details.scientific_name)}
                      className="sm:flex-1 py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-md"
                    >
                      Check Nearby Stock
                    </button>
                  </div>
                  {Array.isArray(nearbyNurseries) && nearbyNurseries.length > 0 && (
                    <div className="mt-4 border border-green-100 rounded-md bg-green-50 p-3">
                      <h4 className="font-semibold text-sm text-green-900 mb-2">Nearby Nurseries</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-green-900">
                        {nearbyNurseries.map((nursery) => (
                          <li key={nursery.id}>
                            <span className="font-medium">{nursery.name}</span> — {nursery.distance}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}