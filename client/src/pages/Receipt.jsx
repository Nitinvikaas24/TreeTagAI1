import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ReceiptPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [receipt, setReceipt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    const receiptId = location.state?.receiptId;
    const receiptData = location.state?.receiptData;
    
    if (!receiptId) {
      toast.error('No receipt found');
      navigate('/user');
      return;
    }

    if (receiptData) {
      setReceipt(receiptData);
      setPdfUrl(`/api/receipts/${receiptId}/pdf`);
      setIsLoading(false);
    } else {
      fetchReceipt(receiptId);
    }
  }, [location.state, navigate]);

  const fetchReceipt = async (receiptId) => {
    try {
      const response = await fetch(`/api/receipts/${receiptId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch receipt');
      }

      const receiptData = await response.json();
      setReceipt(receiptData);
      setPdfUrl(`/api/receipts/${receiptId}/pdf`);
    } catch (error) {
      console.error('Error fetching receipt:', error);
      toast.error(error.message || 'Failed to load receipt');
      navigate('/user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `receipt-${receipt.receiptNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('PDF downloaded successfully!');
    }
  };

  const handlePrintReceipt = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.306A7.962 7.962 0 0112 5c-2.34 0-4.29 1.009-5.824 2.438M12 3v.01M12 21v-.01" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Receipt not found</h3>
          <p className="mt-1 text-sm text-gray-500">The requested receipt could not be loaded.</p>
          <button
            onClick={() => navigate('/user')}
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            Back to Dashboard
          </button>
        </div>
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
                onClick={() => navigate('/user')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-green-800">TreeTagAI</h1>
              <span className="ml-4 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                Receipt #{receipt.receiptNo}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.fullName}</span>
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
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          
          {/* Receipt Header */}
          <div className="bg-green-600 text-white px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Purchase Receipt</h2>
                <p className="text-green-100">Receipt #{receipt.receiptNo}</p>
              </div>
              <div className="text-right">
                <p className="text-green-100">Generated on</p>
                <p className="font-medium">
                  {new Date(receipt.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Receipt Details */}
          <div className="p-6">
            
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Name: </span>
                    <span className="text-gray-900">{receipt.farmerName}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Farmer ID: </span>
                    <span className="text-gray-900">{receipt.farmerId}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Phone: </span>
                    <span className="text-gray-900">{receipt.farmerPhone}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Transaction Details</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Receipt ID: </span>
                    <span className="text-gray-900">{receipt.id}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Language: </span>
                    <span className="text-gray-900 uppercase">{receipt.language}</span>
                  </div>
                  {receipt.identificationData?.confidence && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">AI Confidence: </span>
                      <span className="text-gray-900">
                        {(receipt.identificationData.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Items Purchased</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plant Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Scientific Name
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {receipt.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.plantName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 italic">{item.scientificName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          ₹{item.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          ₹{item.subtotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                    <span>Total Amount:</span>
                    <span className="text-green-600">₹{receipt.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Identification Details */}
            {receipt.identificationData?.images && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Plant Identification Details</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Images Used: </span>
                      <span className="text-gray-900">{receipt.identificationData.images.length}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Plant Parts: </span>
                      <span className="text-gray-900 capitalize">
                        {receipt.identificationData.images.map(img => img.organ).join(', ')}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">AI Confidence: </span>
                      <span className={`font-medium ${
                        receipt.identificationData.confidence > 0.8 ? 'text-green-600' :
                        receipt.identificationData.confidence > 0.6 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {(receipt.identificationData.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m-4-4V4" />
                </svg>
                <span>Download PDF</span>
              </button>
              
              <button
                onClick={handlePrintReceipt}
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print Receipt</span>
              </button>

              <button
                onClick={() => navigate('/user/identify')}
                className="flex items-center justify-center space-x-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Identify Another Plant</span>
              </button>
            </div>

            {/* QR Code for Receipt Sharing */}
            {receipt.qrCode && (
              <div className="mt-6 text-center">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Share this receipt:</h4>
                <img
                  src={`data:image/png;base64,${receipt.qrCode}`}
                  alt="Receipt QR Code"
                  className="w-24 h-24 mx-auto border border-gray-200 rounded"
                />
                <p className="text-xs text-gray-500 mt-1">Scan to view receipt online</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReceiptPage;