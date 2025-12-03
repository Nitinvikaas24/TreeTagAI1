import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    FaFileInvoiceDollar, 
    FaLeaf, 
    FaChartLine, 
    FaDownload, 
    FaSearch 
} from 'react-icons/fa';

export default function UserDashboard() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    
    const [stats, setStats] = useState({ totalSales: 0, invoiceCount: 0 });
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && token) {
            fetchDashboardData();
        }
    }, [user, token]);

    const fetchDashboardData = async () => {
        try {
            // Fetch Real Blockchain Receipts from your new endpoint
            const response = await fetch('/api/user/purchases/recent', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            // Handle successful data fetch
            if (result.status === 'success' || result.data) {
                // Determine the correct data array (handle different API responses)
                const data = result.data || result.purchases || [];
                setInvoices(data);
                
                // Calculate simple stats based on the receipts
                const total = data.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
                setStats({
                    totalSales: total,
                    invoiceCount: data.length
                });
            }
        } catch (error) {
            console.error("Dashboard Load Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewPdf = (url) => {
        if (url) {
            // Ensure the URL is absolute or relative to root
            window.open(url, '_blank');
        } else {
            alert("PDF not available for this invoice.");
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-xl font-semibold text-green-700">Loading Dashboard...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* 1. Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Hortus Dashboard</h1>
                        <p className="text-gray-500 mt-1">Welcome back, {user?.fullName || user?.name || 'Partner'}</p>
                    </div>
                    <button 
                        onClick={() => navigate('/user/cart')} // Navigates to Generate Receipt
                        className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 shadow-md flex items-center gap-2 transition-transform hover:scale-105"
                    >
                        <FaFileInvoiceDollar /> New Sale
                    </button>
                </div>

                {/* 2. Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Revenue Card */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                <FaChartLine size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Revenue</p>
                                <h3 className="text-2xl font-bold text-gray-900">₹{stats.totalSales.toFixed(2)}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Count Card */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                                <FaLeaf size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Invoices Issued</p>
                                <h3 className="text-2xl font-bold text-gray-900">{stats.invoiceCount}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Plant ID Tool Card */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/user/identify')}>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                                <FaSearch size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Plant ID Tool</p>
                                <h3 className="text-lg font-bold text-purple-700">Scan New Plant →</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Recent Invoices Table (Handles the 'undefined' error) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <h2 className="text-lg font-bold text-gray-800">Recent Blockchain Invoices</h2>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-100 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice #</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {invoices.length > 0 ? invoices.map((invoice) => (
                                    <tr key={invoice._id || invoice.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-sm text-gray-600">
                                            {invoice.receiptNumber || 'PENDING'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-800">
                                            {invoice.customerName || 'Walk-in'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                            ₹{(invoice.totalAmount || 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                                                Minted
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => handleViewPdf(invoice.pdfUrl)}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 border px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                                            >
                                                <FaDownload size={12} /> View PDF
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-16 text-center text-gray-500 bg-white">
                                            <div className="flex flex-col items-center">
                                                <FaFileInvoiceDollar size={48} className="text-gray-300 mb-4" />
                                                <p className="text-lg font-medium">No invoices generated yet</p>
                                                <p className="text-sm">Identify a plant and create a sale to see it here.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}