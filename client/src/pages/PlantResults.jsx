import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";

const PlantResultsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const Maps = navigate;
  const location = useLocation();

  const [results, setResults] = useState(null);
  const [selectedPlant, setSelectedPlant] = useState(null);
  // cart integration
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const identificationResult = location.state?.identificationResult;
    const originalImages = location.state?.originalImages;

    if (!identificationResult) {
      toast.error("No identification results found");
      navigate("/user/dashboard");
      return;
    }

    setResults({ ...identificationResult, originalImages });

    // Auto-select the first result if available
    if (identificationResult.suggestions?.length > 0) {
      setSelectedPlant(identificationResult.suggestions[0]);
    }
  }, [location.state, navigate]);

  // handleAddToCart replaces receipt generation in this UI
  const handleAddToCart = () => {
    if (!selectedPlant) {
      toast.error("Please select a plant");
      return;
    }

    // Add selected plant to cart with the chosen quantity
    addToCart({ ...selectedPlant, quantity });
    toast.success("Plant added to cart!");
    Maps('/user/cart');
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-green-800">TreeTagAI</h1>
              <span className="ml-4 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                Identification Results
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.fullName}</span>
              <button
                onClick={() => navigate("/user")}
                className="text-green-600 hover:text-green-800 px-3 py-1 rounded"
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Original Images */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Your Images
              </h2>
              <div className="space-y-4">
                {results.originalImages?.map((image, index) => (
                  <div key={index} className="text-center">
                    <img
                      src={image.src}
                      alt={`Plant ${image.organ}`}
                      className="w-full h-40 object-cover rounded-lg border"
                    />
                    <p className="mt-1 text-sm text-gray-600 capitalize">
                      {image.organ}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Identification Results */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Plant Identification Results
              </h2>

              {results.suggestions && results.suggestions.length > 0 ? (
                <div className="space-y-4">
                  {results.suggestions.map((plant, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedPlant === plant
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedPlant(plant)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {plant.commonName || plant.scientificName}
                          </h3>
                          <p className="text-sm text-gray-600 italic">
                            {plant.scientificName}
                          </p>
                          {plant.commonName && (
                            <p className="text-sm text-gray-500 mt-1">
                              Scientific name: {plant.scientificName}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">
                              Confidence:
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                plant.score > 0.8
                                  ? "bg-green-100 text-green-800"
                                  : plant.score > 0.6
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {(plant.score * 100).toFixed(1)}%
                            </span>
                          </div>
                          {plant.pricing && (
                            <div className="mt-2 text-right">
                              <span className="text-lg font-bold text-green-600">
                                ₹{plant.pricing.price}
                              </span>
                              <span className="text-sm text-gray-500 ml-1">
                                per unit
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {plant.wikipediaSummary && (
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                          <h4 className="font-medium text-gray-900 mb-1">
                            About this plant:
                          </h4>
                          <p className="text-sm text-gray-700">
                            {plant.wikipediaSummary}
                          </p>
                        </div>
                      )}

                      {selectedPlant === plant && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <label className="text-sm font-medium text-gray-700">
                                Quantity:
                              </label>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setQuantity(Math.max(1, quantity - 1));
                                  }}
                                  className="p-1 rounded bg-gray-200 hover:bg-gray-300"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M20 12H4"
                                    />
                                  </svg>
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={quantity}
                                  onChange={(e) =>
                                    setQuantity(
                                      Math.max(1, parseInt(e.target.value) || 1)
                                    )
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-16 text-center border border-gray-300 rounded px-2 py-1"
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setQuantity(quantity + 1);
                                  }}
                                  className="p-1 rounded bg-gray-200 hover:bg-gray-300"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {plant.pricing && (
                              <div className="text-right">
                                <p className="text-sm text-gray-600">Total:</p>
                                <p className="text-xl font-bold text-green-600">
                                  ₹{(plant.pricing.price * quantity).toFixed(2)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.306A7.962 7.962 0 0112 5c-2.34 0-4.29 1.009-5.824 2.438M12 3v.01M12 21v-.01"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No plants identified
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    We couldn't identify any plants from your images. Try taking
                    clearer photos.
                  </p>
                  <button
                    onClick={() => navigate(-1)}
                    className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Purchase Button */}
              {selectedPlant && selectedPlant.pricing && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        Ready to purchase{" "}
                        {selectedPlant.localizedName ||
                          selectedPlant.species.scientificName}
                        ?
                      </p>
                      <p className="text-sm text-gray-500">
                        Add this plant to the billing cart to create an invoice.
                      </p>
                    </div>
                    <button
                      onClick={handleAddToCart}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700`}
                    >
                      {`Add to Cart & View Billing (₹${(
                        selectedPlant.pricing.price * quantity
                      ).toFixed(2)})`}
                    </button>
                  </div>
                </div>
              )}

              {/* No pricing available */}
              {selectedPlant && !selectedPlant.pricing && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                      <svg
                        className="flex-shrink-0 h-5 w-5 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Pricing Not Available
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>
                            Pricing information for this plant is not available
                            in our database. Please contact an officer to add
                            pricing for{" "}
                            {selectedPlant.commonName ||
                              selectedPlant.scientificName}
                            .
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PlantResultsPage;
