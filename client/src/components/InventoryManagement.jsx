import React, { useState, useEffect } from 'react';
import { FaPlus, FaFileExcel, FaSearch, FaFilter, FaEdit, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const InventoryManagement = () => {
    const [plants, setPlants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        category: 'all',
        stockStatus: 'all',
        priceRange: 'all'
    });
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedPlant, setSelectedPlant] = useState(null);
    const [categories, setCategories] = useState([]);
    const { token } = useAuth();

    useEffect(() => {
        fetchPlants();
        fetchCategories();
    }, []);

    const fetchPlants = async () => {
        try {
            const response = await axios.get('/api/inventory', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPlants(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching plants:', error);
            toast.error('Failed to fetch inventory data');
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get('/api/categories', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleExcelUpload = async (event) => {
        const file = event.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            await axios.post('/api/inventory/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            toast.success('Inventory updated successfully');
            fetchPlants();
        } catch (error) {
            console.error('Error uploading inventory:', error);
            toast.error('Failed to upload inventory data');
        }
    };

    const exportToExcel = async () => {
        try {
            const response = await axios.get('/api/inventory/export', {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `inventory_${new Date().toISOString()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting inventory:', error);
            toast.error('Failed to export inventory data');
        }
    };

    const handleSavePlant = async (plantData) => {
        try {
            if (selectedPlant) {
                await axios.put(`/api/inventory/${selectedPlant._id}`, plantData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Plant updated successfully');
            } else {
                await axios.post('/api/inventory', plantData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Plant added successfully');
            }
            setShowAddModal(false);
            setSelectedPlant(null);
            fetchPlants();
        } catch (error) {
            console.error('Error saving plant:', error);
            toast.error('Failed to save plant data');
        }
    };

    const handleDelete = async (plantId) => {
        if (window.confirm('Are you sure you want to delete this plant?')) {
            try {
                await axios.delete(`/api/inventory/${plantId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Plant deleted successfully');
                fetchPlants();
            } catch (error) {
                console.error('Error deleting plant:', error);
                toast.error('Failed to delete plant');
            }
        }
    };

    const filteredPlants = plants.filter(plant => {
        const matchesSearch = plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            plant.scientificName.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = filters.category === 'all' || plant.category === filters.category;
        
        const matchesStock = filters.stockStatus === 'all' ||
                            (filters.stockStatus === 'low' && plant.quantity <= plant.minimumStock) ||
                            (filters.stockStatus === 'out' && plant.quantity === 0) ||
                            (filters.stockStatus === 'available' && plant.quantity > 0);

        const matchesPriceRange = filters.priceRange === 'all' ||
                                (filters.priceRange === 'under500' && plant.price < 500) ||
                                (filters.priceRange === '500to2000' && plant.price >= 500 && plant.price <= 2000) ||
                                (filters.priceRange === 'above2000' && plant.price > 2000);

        return matchesSearch && matchesCategory && matchesStock && matchesPriceRange;
    });

    if (loading) {
        return <div className="loading-spinner">Loading...</div>;
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Inventory Management</h1>
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <FaPlus /> Add Plant
                    </button>
                    <div className="relative">
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleExcelUpload}
                            className="hidden"
                            id="excel-upload"
                        />
                        <label
                            htmlFor="excel-upload"
                            className="btn btn-secondary flex items-center gap-2 cursor-pointer"
                        >
                            <FaFileExcel /> Import
                        </label>
                    </div>
                    <button
                        onClick={exportToExcel}
                        className="btn btn-secondary flex items-center gap-2"
                    >
                        <FaFileExcel /> Export
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search plants..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="form-input pl-10 w-full"
                            />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            className="form-select"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(category => (
                                <option key={category._id} value={category._id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filters.stockStatus}
                            onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
                            className="form-select"
                        >
                            <option value="all">All Stock Status</option>
                            <option value="available">In Stock</option>
                            <option value="low">Low Stock</option>
                            <option value="out">Out of Stock</option>
                        </select>
                        <select
                            value={filters.priceRange}
                            onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
                            className="form-select"
                        >
                            <option value="all">All Prices</option>
                            <option value="under500">Under ₹500</option>
                            <option value="500to2000">₹500 - ₹2000</option>
                            <option value="above2000">Above ₹2000</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Plants Table */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Plant Details
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stock
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Price
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredPlants.map((plant) => (
                            <tr key={plant._id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        {plant.image ? (
                                            <img
                                                src={plant.image}
                                                alt={plant.name}
                                                className="h-10 w-10 rounded-full mr-3 object-cover"
                                            />
                                        ) : (
                                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                                                <FaLeaf className="text-green-600" />
                                            </div>
                                        )}
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {plant.name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {plant.scientificName}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className={`text-sm ${
                                        plant.quantity <= plant.minimumStock
                                            ? 'text-red-600'
                                            : 'text-gray-900'
                                    }`}>
                                        {plant.quantity} in stock
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Min: {plant.minimumStock}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">₹{plant.price}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        {plant.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => {
                                            setSelectedPlant(plant);
                                            setShowAddModal(true);
                                        }}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(plant._id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Plant Modal */}
            {showAddModal && (
                <PlantModal
                    plant={selectedPlant}
                    categories={categories}
                    onSave={handleSavePlant}
                    onClose={() => {
                        setShowAddModal(false);
                        setSelectedPlant(null);
                    }}
                />
            )}
        </div>
    );
};

const PlantModal = ({ plant, categories, onSave, onClose }) => {
    const [formData, setFormData] = useState(
        plant || {
            name: '',
            scientificName: '',
            category: '',
            price: '',
            quantity: '',
            minimumStock: '',
            description: '',
            image: null
        }
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
                <h2 className="text-xl font-bold mb-4">
                    {plant ? 'Edit Plant' : 'Add New Plant'}
                </h2>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="form-input mt-1 block w-full"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Scientific Name
                            </label>
                            <input
                                type="text"
                                value={formData.scientificName}
                                onChange={(e) => setFormData({ ...formData, scientificName: e.target.value })}
                                className="form-input mt-1 block w-full"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="form-select mt-1 block w-full"
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map(category => (
                                    <option key={category._id} value={category._id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Price</label>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="form-input mt-1 block w-full"
                                required
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Quantity</label>
                            <input
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                className="form-input mt-1 block w-full"
                                required
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Minimum Stock
                            </label>
                            <input
                                type="number"
                                value={formData.minimumStock}
                                onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
                                className="form-input mt-1 block w-full"
                                required
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="form-textarea mt-1 block w-full"
                                rows="3"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Image</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                                className="form-input mt-1 block w-full"
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                        >
                            {plant ? 'Update' : 'Add'} Plant
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InventoryManagement;