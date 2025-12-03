import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function GenerateReceipt() {
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const { cartItems, clearCart } = useCart();
    
    const [loading, setLoading] = useState(false);
    const [customerName, setCustomerName] = useState('');
    
    // Get today's date for preview
    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    
    // Calculate Total
    const total = cartItems.reduce((sum, item) => sum + ((item.price_default || 0) * (item.quantity || 1)), 0);

    const handleGenerateInvoice = async () => {
        if (!user) return toast.error('Please login first');
        if (!customerName) return toast.error('Please enter customer name');

        setLoading(true);
        try {
            // DATA STRUCTURE MATCHING BACKEND
            const saleData = {
                farmerId: user.farmerId || user.id,
                customerName: customerName,
                // We send 'plants' array with 'plantId'
                plants: cartItems.map(item => ({
                    plantId: item.id,
                    quantity: item.quantity || 1
                }))
            };

            const response = await fetch('/api/v1/receipts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(saleData)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Transaction Failed');

            toast.success('Invoice Minted on Blockchain!');
            
            // Open PDF
            if(result.data && result.data.pdfUrl) {
                // Remove /api if needed depending on your proxy setup, usually relative path works
                window.open(result.data.pdfUrl, '_blank');
            }
            
            clearCart();
            navigate('/user/receipt');

        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Error creating invoice');
        } finally {
            setLoading(false);
        }
    };

    if (cartItems.length === 0) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded shadow text-center">
                <h2 className="text-xl font-bold mb-4">Cart Empty</h2>
                <button onClick={() => navigate('/user/identify')} className="text-green-600 hover:underline">Identify Plants</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4 font-sans">
            <div className="max-w-6xl mx-auto md:flex md:gap-8">
                
                {/* LEFT: Controls */}
                <div className="md:w-1/3 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h2 className="text-lg font-bold mb-4">Customer Details</h2>
                        <input 
                            type="text" 
                            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                            placeholder="Bill To Name"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                        <h3 className="text-green-900 font-bold flex items-center gap-2">
                            <span>🛡️</span> Blockchain Secured
                        </h3>
                        <p className="text-sm text-green-800 mt-2">
                            Transaction will be hashed (SHA-256) and minted as a Digital Passport on the Hortus Chain.
                        </p>
                    </div>
                </div>

                {/* RIGHT: Live Preview */}
                <div className="md:w-2/3 bg-white rounded-lg shadow-xl overflow-hidden flex flex-col min-h-[500px]">
                    <div className="bg-slate-800 text-white p-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold">INVOICE</h1>
                                <p className="text-xs text-slate-400 mt-1"># PREVIEW-DRAFT</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-xl font-semibold">Hortus Billing</h2>
                                <p className="text-sm text-slate-400">Authentic Nursery Partner</p>
                            </div>
                        </div>
                        <div className="mt-8 flex justify-between border-t border-slate-700 pt-4">
                            <div>
                                <p className="text-xs text-slate-400 uppercase">Bill To</p>
                                <p className="font-medium text-lg">{customerName || '...'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400 uppercase">Date</p>
                                <p className="font-medium">{today}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 flex-grow">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-200 text-gray-500 text-sm">
                                    <th className="py-2">Item</th>
                                    <th className="py-2 text-center">Qty</th>
                                    <th className="py-2 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cartItems.map(item => (
                                    <tr key={item.id} className="border-b border-gray-100">
                                        <td className="py-4">
                                            <div className="font-medium">{item.common_names?.[0] || 'Plant'}</div>
                                            <div className="text-xs text-gray-500">{item.scientific_name}</div>
                                        </td>
                                        <td className="py-4 text-center">{item.quantity}</td>
                                        <td className="py-4 text-right">₹{(item.price_default * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-gray-50 p-6 flex justify-between items-center">
                        <div className="text-xl font-bold text-gray-800">
                            Total: ₹{total.toFixed(2)}
                        </div>
                        <button 
                            onClick={handleGenerateInvoice}
                            disabled={loading}
                            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                        >
                            {loading ? 'Minting...' : 'Authenticate & Issue Invoice'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}