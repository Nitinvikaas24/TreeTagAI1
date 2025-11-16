import React, { useState, useEffect } from 'react';
import { FaDownload, FaEye } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PurchaseHistory = () => {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState('all');
    const { token } = useAuth();

    useEffect(() => {
        fetchPurchases();
    }, [selectedPeriod]);

    const fetchPurchases = async () => {
        try {
            const response = await axios.get(`/api/user/purchases?period=${selectedPeriod}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPurchases(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching purchases:', error);
            toast.error('Failed to load purchase history');
        }
    };

    const downloadReceipt = async (purchaseId) => {
        try {
            const response = await axios.get(`/api/user/purchases/${purchaseId}/receipt`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `receipt-${purchaseId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading receipt:', error);
            toast.error('Failed to download receipt');
        }
    };

    const viewPurchaseDetails = (purchaseId) => {
        // Implementation for viewing detailed purchase information
        // This could open a modal or navigate to a details page
    };

    if (loading) {
        return <div className="loading-spinner">Loading...</div>;
    }

    // Calculate total spend
    const totalSpend = purchases.reduce((total, purchase) => total + purchase.amount, 0);

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Purchase History</h1>
                <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="form-select"
                >
                    <option value="all">All Time</option>
                    <option value="month">This Month</option>
                    <option value="6months">Last 6 Months</option>
                    <option value="year">This Year</option>
                </select>
            </div>

            {/* Summary Card */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Total Spend</h3>
                        <p className="text-2xl font-semibold">₹{totalSpend.toLocaleString()}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
                        <p className="text-2xl font-semibold">{purchases.length}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Average Order Value</h3>
                        <p className="text-2xl font-semibold">
                            ₹{(totalSpend / (purchases.length || 1)).toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Purchases Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Order ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Items
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Total Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {purchases.map((purchase) => (
                                <tr key={purchase._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {new Date(purchase.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        #{purchase.orderNumber}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">
                                            {purchase.items.map(item => (
                                                <div key={item._id}>
                                                    {item.quantity}x {item.plant.name}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        ₹{purchase.amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            purchase.status === 'completed'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {purchase.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => viewPurchaseDetails(purchase._id)}
                                            className="text-indigo-600 hover:text-indigo-900 mx-2"
                                            title="View Details"
                                        >
                                            <FaEye />
                                        </button>
                                        <button
                                            onClick={() => downloadReceipt(purchase._id)}
                                            className="text-green-600 hover:text-green-900"
                                            title="Download Receipt"
                                        >
                                            <FaDownload />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {purchases.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No purchases found for the selected period</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PurchaseHistory;