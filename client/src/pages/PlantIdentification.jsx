import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import axios from 'axios';

const PlantIdentification = () => {
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [identifiedPlant, setIdentifiedPlant] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIdentifiedPlant(null);
    }
  };

  const handleIdentify = async () => {
    if (!selectedImage) {
      toast.error("Please select an image first");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    
    // 1. FIXED: Changed "images" to "image" (Singular)
    formData.append("image", selectedImage); 

    try {
      const token = localStorage.getItem('token');
      
      // 2. Call the identification endpoint
      const response = await axios.post(
        'http://localhost:3001/api/v1/identify', 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const result = response.data.data;
      
      setIdentifiedPlant({
        commonName: result.bestMatch.commonName,
        scientificName: result.bestMatch.scientificName,
        confidence: result.bestMatch.probability,
        image: previewUrl
      });

      toast.success(`Plant identified: ${result.bestMatch.commonName}`);

    } catch (error) {
      console.error("Identification error:", error);
      toast.error(error.response?.data?.message || "Failed to identify plant");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Identify a Plant
          </h2>

          <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Selected plant"
                    className="mx-auto h-64 object-cover rounded-md"
                  />
                  <button 
                    onClick={() => { setSelectedImage(null); setPreviewUrl(null); setIdentifiedPlant(null); }}
                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <label className="cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none">
                    <span>Upload a file</span>
                    <input type="file" className="sr-only" accept="image/*" onChange={handleImageSelect} />
                  </label>
                  <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={handleIdentify}
              disabled={!selectedImage || isLoading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 ${
                isLoading || !selectedImage ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Analyzing..." : "Identify Plant"}
            </button>
          </div>

          {identifiedPlant && (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900">Result</h3>
              <div className="mt-4 bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Common Name</p>
                    <p className="text-xl font-bold text-green-900">{identifiedPlant.commonName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Confidence</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {identifiedPlant.confidence}%
                    </span>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Scientific Name</p>
                  <p className="text-md font-style: italic text-gray-700">{identifiedPlant.scientificName}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlantIdentification;