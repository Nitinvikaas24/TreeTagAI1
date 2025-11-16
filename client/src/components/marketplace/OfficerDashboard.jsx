import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaLeaf, FaRupeeSign, FaEye, FaEdit, FaTrash, FaReceipt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';
import OfficerCropUpload from './OfficerCropUpload';

const OfficerDashboard = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('inventory');
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  useEffect(() => {
    if (activeTab === 'inventory') {
      fetchInventory();
    } else if (activeTab === 'transactions') {
      fetchTransactions();
    }
  }, [activeTab, pagination.page]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/officer/inventory?page=${pagination.page}&limit=${pagination.limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setInventory(response.data.data.crops);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination.total,
          pages: response.data.data.pagination.pages
        }));
      }
    } catch (error) {
      console.error('Fetch inventory error:', error);
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/officer/transactions?page=${pagination.page}&limit=${pagination.limit}`, {
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
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (cropData) => {
    setShowUploadModal(false);
    toast.success('Crop uploaded successfully!');
    if (activeTab === 'inventory') {
      fetchInventory();
    }
  };

  const handleUpdateCrop = async (cropId, updates) => {
    try {
      const response = await axios.put(`/api/officer/crops/${cropId}`, updates, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Crop updated successfully');
        fetchInventory();
      }
    } catch (error) {
      console.error('Update crop error:', error);
      toast.error('Failed to update crop');
    }
  };

  const handleDeleteCrop = async (cropId) => {
    if (!window.confirm('Are you sure you want to delete this crop?')) return;

    try {
      const response = await axios.delete(`/api/officer/crops/${cropId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Crop deleted successfully');
        fetchInventory();
      }
    } catch (error) {
      console.error('Delete crop error:', error);
      toast.error('Failed to delete crop');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Officer Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <FaPlus className="mr-2" />
              Add New Crop
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'inventory'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaLeaf className="inline mr-2" />
              My Inventory
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`ml-8 py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'transactions'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaReceipt className="inline mr-2" />
              Transactions
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="mt-8">
          {activeTab === 'inventory' && (
            <InventoryTab 
              inventory={inventory} 
              loading={loading}
              onUpdate={handleUpdateCrop}
              onDelete={handleDeleteCrop}
            />
          )}
          {activeTab === 'transactions' && (
            <TransactionsTab 
              transactions={transactions} 
              loading={loading}
            />
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold">Upload New Crop</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTrash />
              </button>
            </div>
            <div className="p-6">
              <OfficerCropUpload onUploadSuccess={handleUploadSuccess} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Inventory Tab Component
const InventoryTab = ({ inventory, loading, onUpdate, onDelete }) => {
  const [editingCrop, setEditingCrop] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleEditStart = (crop) => {
    setEditingCrop(crop._id);
    setEditForm({
      price: crop.price,
      quantity: crop.quantity,
      status: crop.status
    });
  };

  const handleEditSave = () => {
    onUpdate(editingCrop, editForm);
    setEditingCrop(null);
    setEditForm({});
  };

  const handleEditCancel = () => {
    setEditingCrop(null);
    setEditForm({});
  };

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
        <h3 className="text-lg font-medium text-gray-900">Your Crop Inventory</h3>
      </div>
      
      {inventory.length === 0 ? (
        <div className="text-center py-12">
          <FaLeaf className="mx-auto text-6xl text-gray-400 mb-4" />
          <p className="text-gray-600">No crops in inventory yet.</p>
          <p className="text-sm text-gray-500">Start by adding your first crop!</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {inventory.map((crop) => (
            <div key={crop._id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    {crop.images && crop.images.length > 0 && (
                      <img 
                        src={crop.images[0].url} 
                        alt={crop.plantName}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{crop.plantName}</h4>
                      {crop.scientificName && (
                        <p className="text-sm text-gray-600 italic">{crop.scientificName}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        {editingCrop === crop._id ? (
                          <>
                            <div className="flex items-center">
                              <FaRupeeSign className="text-green-600 mr-1" />
                              <input
                                type="number"
                                value={editForm.price}
                                onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                                className="w-20 px-2 py-1 border rounded"
                              />
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Qty: </span>
                              <input
                                type="number"
                                value={editForm.quantity}
                                onChange={(e) => setEditForm({...editForm, quantity: e.target.value})}
                                className="w-20 px-2 py-1 border rounded"
                              />
                            </div>
                            <select
                              value={editForm.status}
                              onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                              className="px-2 py-1 border rounded"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="sold">Sold</option>
                            </select>
                          </>
                        ) : (
                          <>
                            <span className="text-lg font-bold text-green-600">₹{crop.price}</span>
                            <span className="text-sm text-gray-600">Qty: {crop.quantity}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              crop.status === 'active' ? 'bg-green-100 text-green-800' :
                              crop.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {crop.status}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {editingCrop === crop._id ? (
                    <>
                      <button
                        onClick={handleEditSave}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEditStart(crop)}
                        className="text-blue-600 hover:text-blue-800 p-2"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => onDelete(crop._id)}
                        className="text-red-600 hover:text-red-800 p-2"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Transactions Tab Component
const TransactionsTab = ({ transactions, loading }) => {
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
        <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
      </div>
      
      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <FaReceipt className="mx-auto text-6xl text-gray-400 mb-4" />
          <p className="text-gray-600">No transactions yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <div key={transaction._id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {transaction.cropListing.plantName}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Buyer: {transaction.farmer.name} ({transaction.farmer.email})
                  </p>
                  <p className="text-sm text-gray-600">
                    Date: {new Date(transaction.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    ₹{transaction.transactionDetails.totalAmount}
                  </p>
                  <p className="text-sm text-gray-600">
                    Qty: {transaction.transactionDetails.quantity}
                  </p>
                  <span className={`px-2 py-1 rounded text-xs ${
                    transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                    transaction.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OfficerDashboard;
