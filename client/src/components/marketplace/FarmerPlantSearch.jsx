import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaCamera, FaSearch, FaLeaf, FaRupeeSign, FaUser, FaCheckCircle, FaTimesCircle, FaDownload } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';

const FarmerPlantSearch = () => {
  const { token } = useAuth();
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [identificationResult, setIdentificationResult] = useState(null);
  const [matches, setMatches] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isConfirming, setIsConfirming] = useState(false);
  const [transactionResult, setTransactionResult] = useState(null);

  const imageInputRef = useRef(null);

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setIdentificationResult(null);
      setMatches(null);
      setSelectedCrop(null);
      setTransactionResult(null);
    }
  };

  const handleIdentifyPlant = async () => {
    if (!selectedImage) {
      toast.error('Please select a plant image first');
      return;
    }

    setIsIdentifying(true);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const response = await axios.post('/api/farmer/identify-and-find', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setIdentificationResult(response.data.data.identification);
        setMatches(response.data.data.matches);
        toast.success(`Plant identified as: ${response.data.data.identification.plantName}`);
      }
    } catch (error) {
      console.error('Identification error:', error);
      toast.error(error.response?.data?.message || 'Failed to identify plant');
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleCropSelection = (crop, matchType, similarity) => {
    setSelectedCrop({
      ...crop,
      matchType,
      similarity
    });
  };

  const handleConfirmPurchase = async () => {
    if (!selectedCrop) {
      toast.error('Please select a crop first');
      return;
    }

    setIsConfirming(true);

    try {
      const requestData = {
        cropId: selectedCrop.crop._id,
        quantity: parseInt(quantity),
        identificationData: {
          plantName: identificationResult.plantName,
          confidence: identificationResult.confidence,
          identificationService: identificationResult.service
        },
        matchType: selectedCrop.matchType,
        fuzzyScore: selectedCrop.similarity
      };

      const response = await axios.post('/api/farmer/confirm-selection', requestData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setTransactionResult(response.data.data);
        toast.success('Purchase confirmed! Receipt generated.');
        
        // Reset form
        setSelectedImage(null);
        setIdentificationResult(null);
        setMatches(null);
        setSelectedCrop(null);
        setQuantity(1);
        if (imageInputRef.current) imageInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Confirmation error:', error);
      toast.error(error.response?.data?.message || 'Failed to confirm purchase');
    } finally {
      setIsConfirming(false);
    }
  };

  const downloadReceipt = async () => {
    if (!transactionResult?.transaction?._id) return;

    try {
      const response = await axios.get(`/api/farmer/receipt/${transactionResult.transaction._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      });

      // Create blob link to download file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${transactionResult.receipt.receiptNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download receipt');
    }
  };

  const getMatchBadgeColor = (matchType) => {
    switch (matchType) {
      case 'exact': return 'bg-green-100 text-green-800 border-green-200';
      case 'strong': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'good': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'weak': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg p-6">
        <div className="flex items-center">
          <FaLeaf className="text-3xl mr-4" />
          <div>
            <h1 className="text-3xl font-bold">Find & Buy Plants</h1>
            <p className="text-green-100 mt-2">Upload a plant image to find matching crops from local officers</p>
          </div>
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <FaCamera className="mr-2 text-green-600" />
          Step 1: Upload Plant Image
        </h2>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors">
          <FaCamera className="mx-auto text-6xl text-gray-400 mb-4" />
          
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          <button
            onClick={() => imageInputRef.current?.click()}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors mb-4"
          >
            Select Image
          </button>
          
          {selectedImage && (
            <div className="mt-4">
              <img 
                src={URL.createObjectURL(selectedImage)} 
                alt="Selected plant" 
                className="mx-auto max-h-64 rounded-lg shadow-md"
              />
              <p className="text-sm text-gray-600 mt-2">{selectedImage.name}</p>
              
              <button
                onClick={handleIdentifyPlant}
                disabled={isIdentifying}
                className="mt-4 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center mx-auto"
              >
                {isIdentifying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Identifying...
                  </>
                ) : (
                  <>
                    <FaSearch className="mr-2" />
                    Identify & Find Crops
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Identification Results */}
      {identificationResult && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FaCheckCircle className="mr-2 text-green-600" />
            Plant Identified
          </h2>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-800">{identificationResult.plantName}</h3>
                {identificationResult.scientificName && (
                  <p className="text-green-600 italic">{identificationResult.scientificName}</p>
                )}
                <p className="text-sm text-green-700 mt-1">
                  Confidence: {Math.round(identificationResult.confidence)}% | 
                  Service: {identificationResult.service}
                </p>
              </div>
              <div className="text-4xl text-green-600">
                <FaLeaf />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Matching Results */}
      {matches && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FaSearch className="mr-2 text-blue-600" />
            Step 2: Available Crops ({matches.total} found)
          </h2>

          {matches.total === 0 ? (
            <div className="text-center py-8">
              <FaTimesCircle className="mx-auto text-6xl text-gray-400 mb-4" />
              <p className="text-gray-600">No matching crops found in the marketplace.</p>
              <p className="text-sm text-gray-500 mt-2">Try uploading a clearer image or check back later.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Exact Matches */}
              {matches.exact.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                    <FaCheckCircle className="mr-2" />
                    Perfect Matches ({matches.exact.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {matches.exact.map((match, index) => (
                      <CropCard key={index} match={match} onSelect={handleCropSelection} />
                    ))}
                  </div>
                </div>
              )}

              {/* Strong Matches */}
              {matches.strong.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                    <FaCheckCircle className="mr-2" />
                    Strong Matches ({matches.strong.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {matches.strong.map((match, index) => (
                      <CropCard key={index} match={match} onSelect={handleCropSelection} />
                    ))}
                  </div>
                </div>
              )}

              {/* Good Matches */}
              {matches.good.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800 mb-3">
                    Good Matches ({matches.good.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {matches.good.map((match, index) => (
                      <CropCard key={index} match={match} onSelect={handleCropSelection} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Selected Crop and Purchase */}
      {selectedCrop && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FaRupeeSign className="mr-2 text-green-600" />
            Step 3: Confirm Purchase
          </h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Selected Crop</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Plant:</strong> {selectedCrop.crop.plantName}</p>
                <p><strong>Price:</strong> ₹{selectedCrop.crop.price}</p>
                <p><strong>Available:</strong> {selectedCrop.crop.quantity} units</p>
              </div>
              <div>
                <p><strong>Officer:</strong> {selectedCrop.crop.officer.name}</p>
                <p><strong>Match:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${getMatchBadgeColor(selectedCrop.matchType)}`}>
                    {selectedCrop.matchType} ({Math.round(selectedCrop.similarity * 100)}%)
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                max={selectedCrop.crop.quantity}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <p className="text-lg font-semibold">
                Total: ₹{(selectedCrop.crop.price * quantity).toFixed(2)}
              </p>
            </div>
            <button
              onClick={handleConfirmPurchase}
              disabled={isConfirming}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center"
            >
              {isConfirming ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Confirming...
                </>
              ) : (
                <>
                  <FaCheckCircle className="mr-2" />
                  Confirm Purchase
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Transaction Success */}
      {transactionResult && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <FaCheckCircle className="mx-auto text-6xl text-green-600 mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">Purchase Successful!</h2>
            <p className="text-gray-600 mb-4">Your transaction has been completed successfully.</p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p><strong>Receipt Number:</strong> {transactionResult.receipt.receiptNumber}</p>
              <p><strong>Total Amount:</strong> ₹{transactionResult.transaction.transactionDetails.totalAmount}</p>
            </div>

            <button
              onClick={downloadReceipt}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
            >
              <FaDownload className="mr-2" />
              Download Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Crop Card Component
const CropCard = ({ match, onSelect }) => {
  const getMatchBadgeColor = (matchType) => {
    switch (matchType) {
      case 'exact': return 'bg-green-100 text-green-800 border-green-200';
      case 'strong': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'good': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'weak': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {match.crop.images && match.crop.images.length > 0 && (
        <img 
          src={match.crop.images[0].url} 
          alt={match.crop.plantName}
          className="w-full h-32 object-cover rounded-lg mb-3"
        />
      )}
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-800">{match.crop.plantName}</h4>
          <span className={`px-2 py-1 rounded text-xs border ${getMatchBadgeColor(match.matchType)}`}>
            {Math.round(match.similarity * 100)}%
          </span>
        </div>
        
        <p className="text-2xl font-bold text-green-600">₹{match.crop.price}</p>
        <p className="text-sm text-gray-600">Qty: {match.crop.quantity}</p>
        
        <div className="flex items-center text-sm text-gray-500">
          <FaUser className="mr-1" />
          {match.crop.officer.name}
        </div>
        
        <button
          onClick={() => onSelect(match, match.matchType, match.similarity)}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Select This Crop
        </button>
      </div>
    </div>
  );
};

export default FarmerPlantSearch;
