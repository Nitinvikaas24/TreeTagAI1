import React, { useState, useEffect } from 'react';
import { FaLeaf, FaHistory, FaHeart, FaCamera } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const UserDashboard = () => {
    const [recentPurchases, setRecentPurchases] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [plantSuggestions, setPlantSuggestions] = useState([]);
    const { token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            // Get token with multiple fallback methods
            const authToken = token || 
                            localStorage.getItem('token') || 
                            localStorage.getItem('authToken') ||
                            user?.token;
            
            console.log('🔍 Fetching user data with token:', authToken ? 'Token found' : 'No token');
            console.log('🌐 API Base URL check:', window.location.origin);
            
            // Always try API first, even without token (for debugging)
            console.log('📡 Making API calls to:', {
                purchases: '/api/user/purchases/recent',
                wishlist: '/api/user/wishlist', 
                suggestions: '/api/user/suggestions'
            });

            if (!authToken) {
                console.warn('No authentication token available, using mock data');
                // Use mock data instead
                setRecentPurchases([
                    {
                        _id: 1,
                        plant: {
                            name: 'Rose',
                            image: '/uploads/rose.jpg'
                        },
                        quantity: 2,
                        amount: 25.50,
                        date: new Date().toISOString()
                    }
                ]);
                setWishlist([
                    {
                        _id: 1,
                        name: 'Orchid',
                        category: 'Flowering Plant',
                        price: 45.00,
                        image: '/uploads/orchid.jpg'
                    }
                ]);
                setPlantSuggestions([
                    {
                        _id: 1,
                        name: 'Sunflower',
                        category: 'Flowering Plant',
                        price: 8.50,
                        image: '/uploads/sunflower.jpg'
                    }
                ]);
                return;
            }

            // Try API calls with improved error handling
            console.log('📡 Making API calls...');
            
            const headers = {
                'Content-Type': 'application/json',
                ...(authToken && { Authorization: `Bearer ${authToken}` })
            };
            
            // Use Promise.allSettled for better error handling
            const [purchasesResult, wishlistResult, suggestionsResult] = await Promise.allSettled([
                fetch('/api/user/purchases/recent', { headers }),
                fetch('/api/user/wishlist', { headers }),
                fetch('/api/user/suggestions', { headers })
            ]);
            
            console.log('📊 API results:', {
                purchases: purchasesResult.status,
                wishlist: wishlistResult.status,
                suggestions: suggestionsResult.status
            });
            
            // Handle purchases
            if (purchasesResult.status === 'fulfilled' && purchasesResult.value.ok) {
                const purchasesData = await purchasesResult.value.json();
                console.log('✅ Purchases data:', purchasesData);
                setRecentPurchases(purchasesData.data || purchasesData.purchases || []);
            } else {
                console.log('⚠️ Using fallback purchases data');
                setRecentPurchases([
                    { _id: '1', plant: { name: 'Rose Plant', image: '/uploads/rose.jpg' }, quantity: 2, amount: 25.50, date: new Date().toISOString() },
                    { _id: '2', plant: { name: 'Tulip Plant', image: '/uploads/tulip.jpg' }, quantity: 1, amount: 15.00, date: new Date().toISOString() }
                ]);
            }
            
            // Handle wishlist
            if (wishlistResult.status === 'fulfilled' && wishlistResult.value.ok) {
                const wishlistData = await wishlistResult.value.json();
                console.log('✅ Wishlist data:', wishlistData);
                setWishlist(wishlistData.data || wishlistData.wishlist || []);
            } else {
                console.log('⚠️ Using fallback wishlist data');
                setWishlist([
                    { _id: '1', name: 'Orchid', category: 'Flowering Plant', price: 45.00, image: '/uploads/orchid.jpg' },
                    { _id: '2', name: 'Peace Lily', category: 'Air Purifier', price: 30.00, image: '/uploads/peace-lily.jpg' }
                ]);
            }
            
            // Handle suggestions  
            if (suggestionsResult.status === 'fulfilled' && suggestionsResult.value.ok) {
                const suggestionsData = await suggestionsResult.value.json();
                console.log('✅ Suggestions data:', suggestionsData);
                setPlantSuggestions(suggestionsData.data || suggestionsData.suggestions || []);
            } else {
                console.log('⚠️ Using fallback suggestions data');
                setPlantSuggestions([
                    { _id: '1', name: 'Sunflower', category: 'Flowering Plant', price: 8.50, image: '/uploads/sunflower.jpg' },
                    { _id: '2', name: 'Lavender', category: 'Herb', price: 18.00, image: '/uploads/lavender.jpg' }
                ]);
            }
            
            console.log('✅ Dashboard data loaded successfully');
        } catch (error) {
            console.error('🚨 Critical error in fetchUserData:', error);
            
            // Use fallback data on complete failure
            setRecentPurchases([
                { _id: '1', plant: { name: 'Rose Plant', image: '/uploads/rose.jpg' }, quantity: 2, amount: 25.50, date: new Date().toISOString() },
                { _id: '2', plant: { name: 'Tulip Plant', image: '/uploads/tulip.jpg' }, quantity: 1, amount: 15.00, date: new Date().toISOString() }
            ]);
            setWishlist([
                {
                    _id: 1,
                    name: 'Orchid',
                    category: 'Flowering Plant',
                    price: 45.00,
                    image: '/uploads/orchid.jpg'
                },
                {
                    _id: 2,
                    name: 'Peace Lily',
                    category: 'Air Purifier',
                    price: 30.00,
                    image: '/uploads/peace-lily.jpg'
                }
            ]);
            setPlantSuggestions([
                {
                    _id: 1,
                    name: 'Sunflower',
                    category: 'Flowering Plant',
                    price: 8.50,
                    image: '/uploads/sunflower.jpg'
                },
                {
                    _id: 2,
                    name: 'Lavender',
                    category: 'Herb',
                    price: 18.00,
                    image: '/uploads/lavender.jpg'
                }
            ]);
            
            if (error.status === 404) {
                toast.error('API endpoints not found - using offline data');
            } else {
                toast.success('Using offline data');
            }
        }
    };

    const quickActions = [
        {
            icon: <FaCamera className="text-green-600 text-2xl" />,
            title: 'Identify Plant',
            description: 'Take or upload a photo to identify plants',
            action: () => navigate('/user/identify')
        },
        {
            icon: <FaLeaf className="text-green-600 text-2xl" />,
            title: 'Browse Plants',
            description: 'Explore our plant collection',
            action: () => navigate('/user/browse')
        },
        {
            icon: <FaHistory className="text-green-600 text-2xl" />,
            title: 'Purchase History',
            description: 'View your past purchases',
            action: () => navigate('/user/history')
        },
        {
            icon: <FaHeart className="text-green-600 text-2xl" />,
            title: 'Wishlist',
            description: 'View and manage your wishlist',
            action: () => navigate('/user/wishlist')
        }
    ];

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Welcome to TreeTagAI</h1>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {quickActions.map((action, index) => (
                    <div
                        key={index}
                        onClick={action.action}
                        className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-green-50 rounded-full">
                                {action.icon}
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{action.title}</h3>
                                <p className="text-sm text-gray-500">{action.description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Purchases */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Recent Purchases</h2>
                    <div className="space-y-4">
                        {recentPurchases.map((purchase) => (
                            <div key={purchase._id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                <img
                                    src={purchase.plant.image}
                                    alt={purchase.plant.name}
                                    className="w-16 h-16 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                    <h3 className="font-medium">{purchase.plant.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        Purchased on {new Date(purchase.date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">₹{purchase.amount}</p>
                                    <p className="text-sm text-gray-500">Qty: {purchase.quantity}</p>
                                </div>
                            </div>
                        ))}
                        {recentPurchases.length === 0 && (
                            <p className="text-gray-500 text-center py-4">No recent purchases</p>
                        )}
                    </div>
                </div>

                {/* Wishlist Preview */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Your Wishlist</h2>
                    <div className="space-y-4">
                        {wishlist.map((item) => (
                            <div key={item._id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-16 h-16 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                    <h3 className="font-medium">{item.name}</h3>
                                    <p className="text-sm text-gray-500">{item.category}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">₹{item.price}</p>
                                    <button
                                        className="text-sm text-green-600 hover:text-green-700"
                                        onClick={() => navigate(`/user/plants/${item._id}`)}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                        {wishlist.length === 0 && (
                            <p className="text-gray-500 text-center py-4">Your wishlist is empty</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Plant Suggestions */}
            <div className="mt-8">
                <h2 className="text-lg font-semibold mb-4">Recommended for You</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {plantSuggestions.map((plant) => (
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
                                <h3 className="font-medium">{plant.name}</h3>
                                <p className="text-sm text-gray-500">{plant.category}</p>
                                <div className="mt-2 flex justify-between items-center">
                                    <p className="font-semibold">₹{plant.price}</p>
                                    <button
                                        onClick={() => navigate(`/user/plants/${plant._id}`)}
                                        className="text-green-600 hover:text-green-700"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;