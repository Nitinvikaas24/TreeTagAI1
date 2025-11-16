import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import DebugUser from "../components/DebugUser";

const PlantIdentificationPage = () => {
  const { user, logout, loading, token } = useAuth();
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Redirect to login if not authenticated
  if (!loading && !user) {
    navigate("/login");
    return null;
  }

  // Show loading spinner while user data is being fetched
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }
  const webcamRef = useRef(null);

  const [capturedImages, setCapturedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedOrgans, setSelectedOrgans] = useState(["leaf"]);
  const [manualSubtype, setManualSubtype] = useState("");
  const [showWebcam, setShowWebcam] = useState(false);

  const organs = [
    { id: "leaf", label: "Leaf", description: "Photograph the leaf clearly" },
    {
      id: "flower",
      label: "Flower",
      description: "Capture the flower structure",
    },
    { id: "fruit", label: "Fruit", description: "Show the fruit or seed" },
    { id: "bark", label: "Bark", description: "Tree bark texture" },
  ];

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      const newImage = {
        id: Date.now(),
        src: imageSrc,
        organ: selectedOrgans[0] || "leaf",
        file: null,
      };
      setCapturedImages((prev) => [...prev, newImage]);
      toast.success("Image captured successfully!");
    }
  }, [selectedOrgans]);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);

    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newImage = {
            id: Date.now() + Math.random(),
            src: e.target.result,
            organ: selectedOrgans[0] || "leaf",
            file: file,
          };
          setCapturedImages((prev) => [...prev, newImage]);
        };
        reader.readAsDataURL(file);
      }
    });

    toast.success(`${files.length} image(s) uploaded successfully!`);
    event.target.value = "";
  };

  const removeImage = (imageId) => {
    setCapturedImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleIdentify = async () => {
    if (capturedImages.length === 0) {
      toast.error("Please capture or upload at least one image");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();

      // Add the first image to form data (the identification API expects a single image)
      const firstImage = capturedImages[0];
      if (firstImage.file) {
        formData.append("image", firstImage.file);
      } else {
        // Convert base64 to blob for webcam images
        const base64Response = await fetch(firstImage.src);
        const blob = await base64Response.blob();
        formData.append("image", blob, "capture.jpg");
      }

      // Add additional data
      formData.append("organs", JSON.stringify(selectedOrgans));
      formData.append("language", "en"); // Default to English, can be made configurable
      if (manualSubtype.trim()) {
        formData.append("manualSubtype", manualSubtype.trim());
      }

      const response = await fetch(`${BASE_URL}/api/identifications/identify`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Identification failed");
      }

      const result = await response.json();

      // Extract the actual data from the API response
      const identificationData =
        result.success && result.data ? result.data : result;

      // Navigate to results page with the identification data
      navigate("/user/results", {
        state: {
          identificationResult: identificationData,
          originalImages: capturedImages,
        },
      });
    } catch (error) {
      console.error("Identification error:", error);
      toast.error(
        error.message || "Failed to identify plant. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DebugUser />
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-green-800">TreeTagAI</h1>
              <span className="ml-4 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                Plant Identification
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {user?.fullName || user?.name || user?.email}
              </span>
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
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Identify Your Plant
          </h2>

          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">
              📸 How to get the best results:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Take clear, well-lit photos of different plant parts</li>
              <li>• Include leaves, flowers, fruits, or bark when available</li>
              <li>• Ensure the plant part fills most of the frame</li>
              <li>• Multiple angles provide better identification accuracy</li>
            </ul>
          </div>

          {/* Organ Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Select Plant Parts to Photograph
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {organs.map((organ) => (
                <label
                  key={organ.id}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedOrgans.includes(organ.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrgans((prev) => [...prev, organ.id]);
                      } else {
                        setSelectedOrgans((prev) =>
                          prev.filter((id) => id !== organ.id)
                        );
                      }
                    }}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {organ.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {organ.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Image Capture Options */}
          <div className="mb-6">
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setShowWebcam(!showWebcam)}
                className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
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
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>{showWebcam ? "Hide Camera" : "Use Camera"}</span>
              </button>

              <label className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer">
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
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span>Upload Images</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Webcam */}
            {showWebcam && (
              <div className="mb-4 p-4 border rounded-lg">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  className="w-full max-w-md mx-auto rounded-lg"
                />
                <button
                  onClick={capture}
                  className="mt-3 w-full max-w-md mx-auto block bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Capture Photo
                </button>
              </div>
            )}
          </div>

          {/* Manual Subtype Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manual Plant Subtype (Optional)
            </label>
            <input
              type="text"
              value={manualSubtype}
              onChange={(e) => setManualSubtype(e.target.value)}
              placeholder="e.g., Red Rose, Mango Tree, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              If you know the specific variety, you can enter it here to
              override automatic detection
            </p>
          </div>

          {/* Captured Images Preview */}
          {capturedImages.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Captured Images ({capturedImages.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {capturedImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.src}
                      alt={`Plant ${image.organ}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center">
                      <button
                        onClick={() => removeImage(image.id)}
                        className="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all"
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-1 text-xs text-center text-gray-600 capitalize">
                      {image.organ}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Identify Button */}
          <div className="text-center">
            <button
              onClick={handleIdentify}
              disabled={isUploading || capturedImages.length === 0}
              className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                isUploading || capturedImages.length === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {isUploading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Identifying Plant...</span>
                </div>
              ) : (
                `Identify Plant${
                  capturedImages.length > 0
                    ? ` (${capturedImages.length} images)`
                    : ""
                }`
              )}
            </button>

            {capturedImages.length === 0 && (
              <p className="mt-2 text-sm text-gray-500">
                Please capture or upload at least one image to continue
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PlantIdentificationPage;
