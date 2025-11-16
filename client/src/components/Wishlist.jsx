import React, { useState, useEffect } from 'react';
import { FaTrash, FaShoppingCart } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Wishlist = () => {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        try {
            const response = await axios.get('/api/user/wishlist', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWishlist(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            toast.error('Failed to load wishlist');
        }
    };

    const removeFromWishlist = async (plantId) => {
        try {
            await axios.delete(`/api/user/wishlist/${plantId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWishlist(wishlist.filter(item => item._id !== plantId));
            toast.success('Removed from wishlist');
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            toast.error('Failed to remove from wishlist');
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

    if (loading) {
        return <div className="loading-spinner">Loading...</div>;
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Your Wishlist</h1>

            {wishlist.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map((plant) => (
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
                                            onClick={() => removeFromWishlist(plant._id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                                            title="Remove from wishlist"
                                        >
                                            <FaTrash />
                                        </button>
                                        <button
                                            onClick={() => addToCart(plant._id)}
                                            className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                                            title="Add to cart"
                                        >
                                            <FaShoppingCart />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <div className="bg-white rounded-lg shadow p-8">
                        <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
                        <p className="text-gray-500 mb-4">
                            Start adding plants you like to your wishlist while browsing
                        </p>
                        <button
                            onClick={() => navigate('/user/browse')}
                            className="btn btn-primary"
                        >
                            Browse Plants
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Wishlist;