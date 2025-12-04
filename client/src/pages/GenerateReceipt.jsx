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
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const total = cartItems.reduce((sum, item) => sum + ((item.price_default || 0) * (item.quantity || 1)), 0);

    const handleGenerateInvoice = async () => {
        if (!user) return toast.error('Please login first');
        if (!customerName) return toast.error('Please enter customer name');

        setLoading(true);
        try {
            const saleData = {
                farmerId: user.farmerId || user.id,
                customerName: customerName,
                // Sending 'plants' array structure
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
            if(result.data && result.data.pdfUrl) {
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="bg-white p-8 rounded shadow text-center">
                <h2 className="text-xl font-bold mb-4">Cart Empty</h2>
                <button onClick={() => navigate('/user/identify')} className="bg-green-600 text-white px-4 py-2 rounded">Scan Plant</button>
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
                        <input type="text" className="w-full border p-3 rounded outline-none" placeholder="Bill To Name"
                            value={customerName} onChange={(e) => setCustomerName(e.target.value)} autoFocus />
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                        <h3 className="text-green-900 font-bold">🛡️ Blockchain Secured</h3>
                        <p className="text-sm text-green-800 mt-2">Transaction will be hashed (SHA-256) and minted as a Digital Passport.</p>
                    </div>
                </div>

                {/* RIGHT: Live Preview */}
                <div className="md:w-2/3 bg-white rounded-lg shadow-xl overflow-hidden flex flex-col min-h-[500px]">
                    <div className="bg-slate-800 text-white p-8">
                        <div className="flex justify-between items-start">
                            <div><h1 className="text-3xl font-bold">INVOICE</h1></div>
                            <div className="text-right"><h2 className="text-xl font-semibold">Hortus Billing</h2></div>
                        </div>
                        <div className="mt-8 flex justify-between border-t border-slate-700 pt-4">
                            <div><p className="text-xs text-slate-400">Bill To</p><p className="font-medium text-lg">{customerName || '...'}</p></div>
                            <div className="text-right"><p className="text-xs text-slate-400">Date</p><p className="font-medium">{today}</p></div>
                        </div>
                    </div>
                    <div className="p-8 flex-grow">
                        {cartItems.map(item => (
                            <div key={item.id} className="flex justify-between py-3 border-b">
                                <span>{item.common_names?.[0]} (x{item.quantity})</span>
                                <span>₹{(item.price_default * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="bg-gray-50 p-6 flex justify-between items-center">
                        <div className="text-xl font-bold">Total: ₹{total.toFixed(2)}</div>
                        <button onClick={handleGenerateInvoice} disabled={loading} className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700">
                            {loading ? 'Minting...' : 'Authenticate & Issue Invoice'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}