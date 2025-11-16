import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaUpload, FaCamera, FaFileExcel, FaFilePdf, FaTimes, FaLeaf, FaRupeeSign } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';

const OfficerCropUpload = ({ onUploadSuccess }) => {
  const { token } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    manualPlantName: '',
    manualScientificName: '',
    manualPrice: '',
    quantity: 1,
    category: '',
    season: '',
    notes: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [identificationResult, setIdentificationResult] = useState(null);
  const [showManualOverride, setShowManualOverride] = useState(false);

  const imageInputRef = useRef(null);
  const receiptInputRef = useRef(null);

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setIdentificationResult(null);
      setShowManualOverride(false);
    }
  };

  const handleReceiptSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedReceipt(file);
      toast.success('Receipt selected. Price will be auto-extracted if possible.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedImage) {
      toast.error('Please select a crop image');
      return;
    }

    // Validate that we have either AI identification or manual name
    if (!identificationResult && !formData.manualPlantName) {
      toast.error('Please provide a plant name manually or ensure AI identification succeeds');
      return;
    }

    // Validate price (either from receipt or manual)
    if (!selectedReceipt && !formData.manualPrice) {
      toast.error('Please upload a receipt or enter price manually');
      return;
    }

    setIsUploading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', selectedImage);
      
      if (selectedReceipt) {
        uploadFormData.append('receipt', selectedReceipt);
      }

      // Add form data
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          uploadFormData.append(key, formData[key]);
        }
      });

      const response = await axios.post('/api/officer/crops/upload', uploadFormData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Crop uploaded successfully!');
        
        // Reset form
        setSelectedImage(null);
        setSelectedReceipt(null);
        setFormData({
          manualPlantName: '',
          manualScientificName: '',
          manualPrice: '',
          quantity: 1,
          category: '',
          season: '',
          notes: ''
        });
        setIdentificationResult(null);
        setShowManualOverride(false);
        
        // Clear file inputs
        if (imageInputRef.current) imageInputRef.current.value = '';
        if (receiptInputRef.current) receiptInputRef.current.value = '';
        
        if (onUploadSuccess) {
          onUploadSuccess(response.data.data);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload crop');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <FaLeaf className="text-green-600 text-2xl mr-3" />
        <h2 className="text-2xl font-bold text-gray-800">Upload Crop for Sale</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-green-500 transition-colors">
          <div className="text-center">
            <FaCamera className="mx-auto text-4xl text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">Upload Crop Image</p>
            <p className="text-sm text-gray-500 mb-4">AI will identify the plant automatically</p>
            
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaUpload className="inline mr-2" />
              Select Image
            </button>
            
            {selectedImage && (
              <div className="mt-4">
                <p className="text-sm text-green-600">Selected: {selectedImage.name}</p>
                <img 
                  src={URL.createObjectURL(selectedImage)} 
                  alt="Selected crop" 
                  className="mt-2 mx-auto max-h-32 rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Receipt Upload Section */}
        <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 hover:border-blue-500 transition-colors">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <FaFileExcel className="text-green-600 text-3xl mr-2" />
              <FaFilePdf className="text-red-600 text-3xl" />
            </div>
            <p className="text-lg font-medium text-gray-700 mb-2">Upload Receipt (Optional)</p>
            <p className="text-sm text-gray-500 mb-4">Excel or PDF file for automatic price extraction</p>
            
            <input
              ref={receiptInputRef}
              type="file"
              accept=".xlsx,.xls,.pdf"
              onChange={handleReceiptSelect}
              className="hidden"
            />
            
            <button
              type="button"
              onClick={() => receiptInputRef.current?.click()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaUpload className="inline mr-2" />
              Upload Receipt
            </button>
            
            {selectedReceipt && (
              <div className="mt-4">
                <p className="text-sm text-blue-600">Selected: {selectedReceipt.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Manual Override Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Manual Information</h3>
            <button
              type="button"
              onClick={() => setShowManualOverride(!showManualOverride)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {showManualOverride ? 'Hide' : 'Show'} Manual Override
            </button>
          </div>

          {showManualOverride && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plant Name (Override AI)
                </label>
                <input
                  type="text"
                  name="manualPlantName"
                  value={formData.manualPlantName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Rose, Tomato, Mango"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scientific Name
                </label>
                <input
                  type="text"
                  name="manualScientificName"
                  value={formData.manualScientificName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Rosa rubiginosa"
                />
              </div>
            </div>
          )}
        </div>

        {/* Price and Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaRupeeSign className="inline mr-1" />
              Manual Price (₹)
            </label>
            <input
              type="number"
              name="manualPrice"
              value={formData.manualPrice}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter if no receipt"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity Available
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select Category</option>
              <option value="vegetables">Vegetables</option>
              <option value="fruits">Fruits</option>
              <option value="flowers">Flowers</option>
              <option value="herbs">Herbs</option>
              <option value="trees">Trees</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Season
            </label>
            <select
              name="season"
              value={formData.season}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select Season</option>
              <option value="spring">Spring</option>
              <option value="summer">Summer</option>
              <option value="monsoon">Monsoon</option>
              <option value="winter">Winter</option>
              <option value="all-year">All Year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Additional information about the crop..."
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isUploading}
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <FaUpload className="mr-2" />
                Upload Crop
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OfficerCropUpload;
