import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaSearch, FaLeaf, FaHistory, FaDownload, FaReceipt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';
import FarmerPlantSearch from './FarmerPlantSearch';

const FarmerDashboard = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('search');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  useEffect(() => {
    if (activeTab === 'history') {
      fetchTransactions();
    }
  }, [activeTab, pagination.page]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/farmer/transactions?page=${pagination.page}&limit=${pagination.limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setTransactions(response.data.data.transactions);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination.total,
          pages: response.data.data.pagination.pages
        }));
      }
    } catch (error) {
      console.error('Fetch transactions error:', error);
      toast.error('Failed to fetch transaction history');
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = async (transactionId, receiptNumber) => {
    try {
      const response = await axios.get(`/api/farmer/receipt/${transactionId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: 'blob'
      });

      // Create blob link to download file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${receiptNumber}.pdf`);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Farmer Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Marketplace</p>
                <p className="font-semibold text-green-600">TreeTagAI</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('search')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'search'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaSearch className="inline mr-2" />
              Find Plants
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`ml-8 py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaHistory className="inline mr-2" />
              Purchase History
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="mt-8">
          {activeTab === 'search' && <FarmerPlantSearch />}
          {activeTab === 'history' && (
            <PurchaseHistoryTab 
              transactions={transactions} 
              loading={loading}
              onDownloadReceipt={downloadReceipt}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Purchase History Tab Component
const PurchaseHistoryTab = ({ transactions, loading, onDownloadReceipt }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Your Purchase History</h3>
      </div>
      
      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <FaHistory className="mx-auto text-6xl text-gray-400 mb-4" />
          <p className="text-gray-600">No purchases yet.</p>
          <p className="text-sm text-gray-500">Start by finding and buying plants!</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <div key={transaction._id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    {transaction.cropListing.images && transaction.cropListing.images.length > 0 && (
                      <img 
                        src={transaction.cropListing.images[0].url} 
                        alt={transaction.cropListing.plantName}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {transaction.cropListing.plantName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Seller: {transaction.officer.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Date: {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                      
                      {/* Identification Details */}
                      {transaction.farmerIdentification && (
                        <div className="mt-2">
                          <p className="text-xs text-blue-600">
                            Your Upload: {transaction.farmerIdentification.plantName}
                          </p>
                          <p className="text-xs text-gray-500">
                            AI Confidence: {Math.round((transaction.farmerIdentification.confidence || 0) * 100)}%
                          </p>
                        </div>
                      )}
                      
                      {/* Match Information */}
                      {transaction.matchingProcess && (
                        <div className="mt-1">
                          <span className={`px-2 py-1 rounded text-xs ${
                            transaction.matchingProcess.exactMatch 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {transaction.matchingProcess.exactMatch ? 'Exact Match' : 'Fuzzy Match'} 
                            {transaction.matchingProcess.fuzzyScore && 
                              ` (${Math.round(transaction.matchingProcess.fuzzyScore * 100)}%)`
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    ₹{transaction.transactionDetails.totalAmount}
                  </p>
                  <p className="text-sm text-gray-600">
                    Qty: {transaction.transactionDetails.quantity} × ₹{transaction.transactionDetails.unitPrice}
                  </p>
                  <span className={`px-2 py-1 rounded text-xs ${
                    transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                    transaction.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {transaction.status}
                  </span>
                  
                  {/* Download Receipt Button */}
                  {transaction.receipt && transaction.receipt.receiptNumber && (
                    <div className="mt-2">
                      <button
                        onClick={() => onDownloadReceipt(transaction._id, transaction.receipt.receiptNumber)}
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                        title="Download Receipt"
                      >
                        <FaDownload className="mr-1" />
                        Receipt
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Transaction Summary */}
              <div className="mt-4 bg-gray-50 rounded-lg p-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Payment Status:</span>
                    <div className={`font-medium ${
                      transaction.transactionDetails.paymentStatus === 'completed' 
                        ? 'text-green-600' 
                        : transaction.transactionDetails.paymentStatus === 'pending'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {transaction.transactionDetails.paymentStatus}
                    </div>
                  </div>
                  
                  {transaction.receipt && (
                    <div>
                      <span className="text-gray-600">Receipt #:</span>
                      <div className="font-medium text-gray-900">
                        {transaction.receipt.receiptNumber}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-gray-600">Order ID:</span>
                    <div className="font-medium text-gray-900 text-xs">
                      {transaction._id.slice(-8)}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600">Service Used:</span>
                    <div className="font-medium text-gray-900">
                      {transaction.farmerIdentification?.identificationService || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FarmerDashboard;
