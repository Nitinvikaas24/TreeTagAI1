import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaHeart, FaShoppingCart } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const BrowsePlants = () => {
    const [plants, setPlants] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        category: 'all',
        priceRange: 'all',
        searchQuery: ''
    });
    const { token } = useAuth();

    useEffect(() => {
        fetchPlants();
        fetchCategories();
    }, []);

    const fetchPlants = async () => {
        try {
            const response = await axios.get('/api/plants', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPlants(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching plants:', error);
            toast.error('Failed to load plants');
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

    const addToWishlist = async (plantId) => {
        try {
            await axios.post('/api/user/wishlist', { plantId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Added to wishlist');
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            toast.error('Failed to add to wishlist');
        }
    };

    const addToCart = async (plantId) => {
        try {
            await axios.post('/api/user/cart', { plantId, quantity: 1 }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Added to cart');
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast.error('Failed to add to cart');
        }
    };

    const filteredPlants = plants.filter(plant => {
        const matchesCategory = filters.category === 'all' || plant.category === filters.category;
        const matchesSearch = plant.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
                            plant.description.toLowerCase().includes(filters.searchQuery.toLowerCase());
        const matchesPriceRange = filters.priceRange === 'all' ||
                                (filters.priceRange === 'under500' && plant.price < 500) ||
                                (filters.priceRange === '500to2000' && plant.price >= 500 && plant.price <= 2000) ||
                                (filters.priceRange === 'above2000' && plant.price > 2000);
        
        return matchesCategory && matchesSearch && matchesPriceRange;
    });

    if (loading) {
        return <div className="loading-spinner">Loading...</div>;
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Browse Plants</h1>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search plants..."
                                value={filters.searchQuery}
                                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
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

            {/* Plants Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredPlants.map((plant) => (
                    <div
                        key={plant._id}
                        className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
                    >
                        <img
                            src={plant.image}
                            alt={plant.name}
                            className="w-full h-48 object-cover"
                        />
                        <div className="p-4">
                            <h3 className="font-medium text-lg">{plant.name}</h3>
                            <p className="text-sm text-gray-500 mb-2">{plant.scientificName}</p>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                {plant.description}
                            </p>
                            <div className="flex justify-between items-center">
                                <p className="font-semibold text-lg">₹{plant.price}</p>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => addToWishlist(plant._id)}
                                        className="p-2 text-pink-600 hover:bg-pink-50 rounded-full"
                                    >
                                        <FaHeart />
                                    </button>
                                    <button
                                        onClick={() => addToCart(plant._id)}
                                        className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                                    >
                                        <FaShoppingCart />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredPlants.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-gray-500">No plants found matching your criteria</p>
                </div>
            )}
        </div>
    );
};

export default BrowsePlants;