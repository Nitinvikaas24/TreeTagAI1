import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { identifyPlant, checkHealth } from "../../services/api";
import toast from "react-hot-toast";

// Mock receipt service for now (replace with actual service)
const receiptService = {
  create: async (data) => {
    // Mock receipt generation
    return {
      data: {
        receiptNumber: `RCP-${Date.now()}`,
        totalAmount: data.plants.reduce(
          (sum, plant) => sum + 25.0 * plant.quantity,
          0
        ),
        pdfUrl: "/api/receipts/mock.pdf",
      },
    };
  },
};

const PlantIdentification = () => {
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [identifiedPlant, setIdentifiedPlant] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("checking");

  // Check API connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log("🔍 Checking API connection...");
        const response = await checkHealth();
        setConnectionStatus("connected");
        console.log("✅ API connection successful:", response.data);

        if (response.data.data?.services?.plantId?.status === "configured") {
          toast.success("Plant.id service ready with high accuracy!");
        }
      } catch (error) {
        console.error("❌ API connection failed:", error);
        setConnectionStatus("disconnected");
        toast.error("Unable to connect to plant identification service");
      }
    };

    checkConnection();
  }, []);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIdentifiedPlant(null);
      setShowReceipt(false);
    }
  };

  const handleIdentify = async () => {
    if (!selectedImage) {
      toast.error("Please select an image first");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("images", selectedImage); // Changed to 'images' to match server expectation

      console.log("🌱 Starting plant identification...");
      console.log(
        "📤 Sending FormData with image:",
        selectedImage?.name,
        selectedImage?.size
      );

      const response = await identifyPlant(formData);

      console.log("✅ Full API Response:", response);
      console.log("📊 Response Data:", response.data);
      console.log(
        "🎯 Response Structure:",
        JSON.stringify(response.data, null, 2)
      );
      console.log("🔍 Response Analysis:", {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        dataType: typeof response.data,
        hasSuccess: "success" in (response.data || {}),
        hasData: "data" in (response.data || {}),
        hasError: "error" in (response.data || {}),
        keys: Object.keys(response.data || {}),
      });

      // Handle different server response formats
      console.log("🎯 Response validation:", {
        hasSuccess: !!response.data.success,
        hasData: !!response.data.data,
        hasResults: !!response.data.results,
        responseKeys: Object.keys(response.data || {}),
      });

      let identificationData = null;
      let bestMatch = null;

      // Handle multiple response formats from different servers
      if (response.data.success && response.data.data) {
        // Format from server-clean.js (updated server)
        identificationData = response.data.data;
        bestMatch =
          identificationData.bestMatch || identificationData.suggestions?.[0];
      } else if (response.data.success && response.data.results) {
        // Format from server.js (legacy server)
        identificationData = {
          suggestions: response.data.results || [],
          overallConfidence: response.data.results?.[0]?.score
            ? Math.round(response.data.results[0].score * 100)
            : 0,
          primaryService: "Plant.id API",
          identificationId:
            response.data.identificationId || `legacy_${Date.now()}`,
        };
        bestMatch = response.data.results?.[0];
      } else if (response.data.data?.suggestions) {
        // Direct format
        identificationData = response.data.data;
        bestMatch = identificationData.suggestions?.[0];
      } else {
        // Try to extract from any available structure
        const suggestions =
          response.data.suggestions || response.data.results || [];
        if (suggestions.length > 0) {
          identificationData = {
            suggestions: suggestions,
            overallConfidence:
              suggestions[0]?.confidence ||
              (suggestions[0]?.score
                ? Math.round(suggestions[0].score * 100)
                : 75),
            primaryService: "Plant Identification Service",
            identificationId: `extracted_${Date.now()}`,
          };
          bestMatch = suggestions[0];
        } else {
          console.error("❌ Unexpected response format:", response.data);
          console.error(
            "📋 Available data keys:",
            Object.keys(response.data || {})
          );

          // Last resort: try to find any plant data in the response
          const fallbackData = response.data || {};
          if (
            fallbackData.results ||
            fallbackData.suggestions ||
            fallbackData.data
          ) {
            console.log("🔄 Attempting fallback parsing...");
            const suggestions = fallbackData.results ||
              fallbackData.suggestions || [fallbackData.data];
            identificationData = {
              suggestions: Array.isArray(suggestions)
                ? suggestions
                : [suggestions],
              overallConfidence: 50,
              primaryService: "Fallback Parser",
              identificationId: `fallback_${Date.now()}`,
            };
            bestMatch = identificationData.suggestions[0];
          } else {
            throw new Error(
              response.data.message ||
                response.data.error ||
                "No identification results found in response"
            );
          }
        }
      }

      if (!identificationData || !bestMatch) {
        console.error("❌ Final parsing failed:", {
          identificationData,
          bestMatch,
        });
        throw new Error(
          "Unable to parse identification results - no valid plant data found"
        );
      }

      // Extract data from the actual server response structure with fallbacks
      const scientificName =
        bestMatch?.species?.scientificName ||
        bestMatch?.plant_name ||
        bestMatch?.scientificName ||
        "Unknown";
      const commonName =
        bestMatch?.localizedName ||
        bestMatch?.species?.commonNames?.[0] ||
        bestMatch?.commonName ||
        bestMatch?.name ||
        "Unknown Plant";
      const confidence =
        identificationData.overallConfidence ||
        bestMatch?.confidence ||
        (bestMatch?.score ? Math.round(bestMatch.score * 100) : 75);

      // Create a standardized format for the component
      const processedResult = {
        identificationId:
          identificationData.identificationId || `id_${Date.now()}`,
        primaryService:
          identificationData.primaryService || "Plant Identification",
        confidence: confidence,
        scientificName: scientificName,
        commonName: commonName,
        translatedName: bestMatch?.translatedName,
        details: bestMatch?.details || {
          careInfo: {
            watering: bestMatch?.watering || "Regular watering",
            lightCondition: bestMatch?.lightCondition || "Partial sun",
            soilType: bestMatch?.soilType || "Well-draining soil",
          },
          edibleParts: bestMatch?.edibleParts || [],
          commonUses: bestMatch?.commonUses || ["Ornamental"],
          toxicity: bestMatch?.toxicity || null,
        },
        suggestions: identificationData.suggestions || [bestMatch],
        qualityIndicators: identificationData.qualityIndicators || {
          highConfidence: confidence >= 80,
          mediumConfidence: confidence >= 50 && confidence < 80,
          lowConfidence: confidence < 50,
        },
        // Extract plant data from server response
        plant: {
          _id: bestMatch?._id || "mock_plant_id",
          name: commonName,
          cost: bestMatch?.pricing?.price || bestMatch?.price || 25.0,
        },
      };

      console.log("✅ Processed identification result:", processedResult);

      setIdentifiedPlant(processedResult);
      toast.success(
        `Plant identified with ${processedResult.confidence}% confidence using ${processedResult.primaryService}!`
      );
    } catch (error) {
      console.error("❌ Plant identification error:", error);
      console.error("📋 Error details:", {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        request: !!error.request,
        config: error.config?.url,
      });

      let errorMessage = "Failed to identify plant";

      if (error.response) {
        // Server responded with an error
        console.error("🚨 Server error response:", error.response.data);
        errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          `Server error (${error.response.status})`;
      } else if (error.request) {
        // Network error
        console.error("🌐 Network error:", error.request);
        errorMessage =
          "Network error - please check your connection and server status";
      } else {
        // Other error (including parsing errors)
        console.error("🔧 Client error:", error.message);
        errorMessage = error.message || "Unknown error occurred";
      }

      toast.error(`${errorMessage} - Check console for details`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReceipt = async () => {
    if (!identifiedPlant) return;

    setIsLoading(true);
    try {
      const receiptData = {
        plants: [
          {
            plantId: identifiedPlant.plant._id,
            quantity: 1,
          },
        ],
        farmerId: user.farmerId,
      };

      const result = await receiptService.create(receiptData);
      setReceipt(result.data);
      setShowReceipt(true);
      toast.success("Receipt generated successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to generate receipt");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!receipt) return;

    try {
      const pdfUrl = receipt.pdfUrl;
      window.open(`http://localhost:5000${pdfUrl}`, "_blank");
    } catch (error) {
      toast.error("Failed to download receipt");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              Plant Identification
            </h2>

            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-green-400"
                    : connectionStatus === "disconnected"
                    ? "bg-red-400"
                    : "bg-yellow-400 animate-pulse"
                }`}
              ></div>
              <span className="text-sm text-gray-500">
                {connectionStatus === "connected"
                  ? "Plant.id Ready"
                  : connectionStatus === "disconnected"
                  ? "Service Offline"
                  : "Connecting..."}
              </span>
            </div>
          </div>

          {/* Image Upload */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Plant Image
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Selected plant"
                    className="mx-auto h-64 w-64 object-cover rounded-md"
                  />
                ) : (
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500">
                    <span>Upload a file</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
              </div>
            </div>
          </div>

          {/* Identify Button */}
          <div className="mt-4">
            <button
              onClick={handleIdentify}
              disabled={!selectedImage || isLoading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                isLoading || !selectedImage
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {isLoading ? "Identifying..." : "Identify Plant"}
            </button>
          </div>

          {/* Identification Results */}
          {identifiedPlant && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900">
                Plant Identification Results
              </h3>

              {/* Confidence Badge */}
              <div className="mb-4">
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      identifiedPlant.confidence >= 80
                        ? "bg-green-100 text-green-800"
                        : identifiedPlant.confidence >= 50
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {identifiedPlant.confidence}% Confidence
                  </span>
                  <span className="text-sm text-gray-500">
                    via {identifiedPlant.primaryService}
                  </span>
                </div>
              </div>

              <div className="mt-2 border rounded-md p-4">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Common Name
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {identifiedPlant.commonName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Scientific Name
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 italic">
                      {identifiedPlant.scientificName}
                    </dd>
                  </div>
                  {identifiedPlant.translatedName && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Translated Name
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {identifiedPlant.translatedName}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Estimated Cost
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      ₹{identifiedPlant.plant.cost.toFixed(2)}
                    </dd>
                  </div>

                  {/* Care Information */}
                  {identifiedPlant.details.careInfo && (
                    <>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Watering
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {identifiedPlant.details.careInfo.watering ||
                            "Not specified"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Light Requirements
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {identifiedPlant.details.careInfo.lightCondition ||
                            "Not specified"}
                        </dd>
                      </div>
                    </>
                  )}

                  {/* Safety Information */}
                  {identifiedPlant.details.toxicity && (
                    <div className="col-span-2">
                      <dt className="text-sm font-medium text-gray-500">
                        Safety Information
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {identifiedPlant.details.toxicity}
                      </dd>
                    </div>
                  )}
                </dl>

                {/* Additional Details */}
                {identifiedPlant.details.edibleParts &&
                  identifiedPlant.details.edibleParts.length > 0 && (
                    <div className="mt-4 col-span-2">
                      <dt className="text-sm font-medium text-gray-500">
                        Edible Parts
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {identifiedPlant.details.edibleParts.join(", ")}
                      </dd>
                    </div>
                  )}

                {identifiedPlant.details.commonUses &&
                  identifiedPlant.details.commonUses.length > 0 && (
                    <div className="mt-2 col-span-2">
                      <dt className="text-sm font-medium text-gray-500">
                        Common Uses
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {identifiedPlant.details.commonUses.join(", ")}
                      </dd>
                    </div>
                  )}

                <button
                  onClick={handleGenerateReceipt}
                  disabled={isLoading}
                  className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Generate Receipt
                </button>
              </div>
            </div>
          )}

          {/* Receipt Preview */}
          {showReceipt && receipt && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900">Receipt</h3>
              <div className="mt-2 border rounded-md p-4">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Receipt Number
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {receipt.receiptNumber}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Total Amount
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      ₹{receipt.totalAmount.toFixed(2)}
                    </dd>
                  </div>
                </dl>

                <button
                  onClick={handleDownloadReceipt}
                  className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Download Receipt
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlantIdentification;
