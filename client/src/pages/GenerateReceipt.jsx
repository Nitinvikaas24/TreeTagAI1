import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// --- Utility Function to Trigger Download ---
const triggerPdfDownload = (base64Data, receiptId) => {
    try {
        const binaryString = atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `receipt_${receiptId}.pdf` || 'receipt.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('PDF Download Error:', error);
        toast.error('Failed to download PDF. Data may be corrupt.');
    }
};

const TAX_RATE = 0.05; 

export default function GenerateReceipt() {
    const navigate = useNavigate();
    const { user, token } = useAuth();
    
    const { cartItems: allItems, updateItemQuantity, removeFromCart, clearCart } = useCart();
    
    // Fix for the infinite loop
    const cartItems = useMemo(() => {
        return allItems.filter(item => item && item.id && item.common_names);
    }, [allItems]);
    
    const [loading, setLoading] = useState(false);
    const [editedPrices, setEditedPrices] = useState({});

    // This useEffect is now safe because 'cartItems' is stable
    useEffect(() => {
        setEditedPrices(Object.fromEntries(
            cartItems.map(item => [item.id, item.price_default]) 
        ));
    }, [cartItems]);

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => 
        sum + ((editedPrices[item.id] || item.price_default || 0) * (item.quantity || 1)), 0
    );
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    const handleQuantityChange = (itemId, newQuantity) => {
        const quantity = Math.max(1, parseInt(newQuantity) || 1);
        updateItemQuantity(itemId, quantity);
    };

    const handlePriceChange = (itemId, newPrice) => {
        const price = Math.max(0, parseFloat(newPrice) || 0);
        setEditedPrices(prev => ({ ...prev, [itemId]: price }));
    };

    const handleGenerateInvoice = async () => {
        if (!user || !token) { 
            toast.error('You must be logged in to make a sale.');
            return;
        }

        setLoading(true);
        
        const cartData = {
            farmerId: user.id || 'user-123',
            farmerName: user.fullName || 'Test User',
            farmerPhone: user.phone || '555-5555',
            items: cartItems.map(item => {
                const price = editedPrices[item.id] || item.price_default || 0;
                const quantity = item.quantity || 1;
                return {
                    id: item.id,
                    plantName: (item.common_names && item.common_names[0]) ? item.common_names[0] : 'Unknown Plant',
                    scientificName: item.scientific_name || 'N/A',
                    price: price,
                    quantity: quantity,
                    subtotal: price * quantity
                }
            }),
            total,
            tax,
            language: 'en',
        };

        try {
            const response = await fetch('/api/v1/receipts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(cartData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Sale failed');
            }

            console.log('Sale created:', result);
            
            if (result.pdfBase64) {
                triggerPdfDownload(result.pdfBase64, result._id);
            }

            clearCart();
            toast.success('Receipt generated successfully!');
            
            navigate('/user/receipt', { 
                state: { 
                    receiptId: result._id,
                    receiptData: { ...result, ...cartData, receiptNo: result._id }
                }
            });

        } catch (error) {
            console.error('Failed to generate invoice:', error);
            toast.error(`Failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="max-w-3xl mx-auto text-center bg-white rounded-lg shadow-md p-8">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-4">Your Cart is Empty</h1>
                    <p className="text-gray-600 mb-4">Please identify a plant to add it to your cart.</p>
                    <button
                        onClick={() => navigate('/user/identify')}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                        Scan a Plant
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Generate Receipt</h1>
                    <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">← Back</button>
                </div>

                <div className="mb-8 overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-gray-200">
                                <th className="text-left py-3">Plant</th>
                                <th className="text-center py-3">Quantity</th>
                                <th className="text-center py-3">Unit Price</th>
                                <th className="text-right py-3">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cartItems.map((item) => {
                                const price = editedPrices[item.id] || item.price_default || 0;
                                const quantity = item.quantity || 1;
                                
                                return (
                                    <tr key={item.id} className="border-b border-gray-100">
                                        <td className="py-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium">{item.common_names ? item.common_names[0] : 'Unknown Plant'}</div>
                                                    <div className="text-sm text-gray-500">{item.scientific_name || 'N/A'}</div>
                                                </div>
                                                <button onClick={() => removeFromCart(item.id)} className="text-sm text-red-600 hover:text-red-800">Remove</button>
                                            </div>
                                        </td>
                                        <td className="py-4 text-center">
                                            <input
                                                type="number" min="1" value={quantity}
                                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                className="w-20 text-center p-1 border rounded"
                                            />
                                        </td>
                                        <td className="py-4 text-center">
                                            <div className="flex items-center justify-center">
                                                <span>₹</span>
                                                <input
                                                    type="number" min="0" step="0.01" value={price}
                                                    onChange={(e) => handlePriceChange(item.id, e.target.value)}
                                                    className="w-24 text-center p-1 border rounded"
                                                />
                                            </div>
                                        </td>
                                        <td className="py-4 text-right">₹{(price * quantity).toFixed(2)}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-end text-right">
                        <div className="w-64">
                            <div className="flex justify-between py-2"><span className="text-gray-600">Subtotal:</span><span className="font-medium">₹{subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between py-2"><span className="text-gray-600">Tax ({(TAX_RATE * 100)}%):</span><span className="font-medium">₹{tax.toFixed(2)}</span></div>
                            <div className="flex justify-between py-2 text-lg font-semibold"><span>Total:</span><span>₹{total.toFixed(2)}</span></div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex justify-end gap-4">
                    <button onClick={() => clearCart()} className="px-4 py-2 text-red-600 hover:text-red-700">Clear Cart</button>
                    <button
                        onClick={handleGenerateInvoice} disabled={loading || cartItems.length === 0}
                        className={`px-6 py-2 rounded-md ${loading || cartItems.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white font-medium`}
                    >
                        {loading ? 'Generating...' : 'Confirm & Generate Receipt'}
                    </button>
                </div>
            </div>
        </div>
    );
}