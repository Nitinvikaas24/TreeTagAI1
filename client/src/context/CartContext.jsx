import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

// Load cart from localStorage
const loadInitialState = () => {
    try {
        const savedCart = localStorage.getItem('treetagCart');
        if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            // Add validation for loaded data - only keep valid items
            return Array.isArray(parsedCart) ? parsedCart.filter(item => item && item.id && item.common_names) : [];
        }
    } catch (e) {
        console.error("Failed to load or parse cart from localStorage", e);
    }
    return []; // Return empty array if load fails
};

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState(loadInitialState);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('treetagCart', JSON.stringify(cartItems));
        } catch (e) {
            console.error("Failed to save cart to localStorage", e);
        }
    }, [cartItems]);

    // Add a plant to cart
    const addToCart = useCallback((plant) => {
        
        // --- THIS IS THE FIX ---
        // We now check for '_id' (from MongoDB)
        if (!plant || !plant._id || !plant.common_names || typeof plant.price_default === 'undefined') {
            console.error("Invalid plant object passed to addToCart:", plant);
            return; // Don't add invalid data
        }
        
        setCartItems(prevItems => {
            // Check if item already exists using its '_id'
            const existingItemIndex = prevItems.findIndex(item => item.id === plant._id);
            
            if (existingItemIndex > -1) {
                // If exists, increment quantity
                const updatedItems = [...prevItems];
                updatedItems[existingItemIndex] = {
                    ...updatedItems[existingItemIndex],
                    quantity: (updatedItems[existingItemIndex].quantity || 0) + 1
                };
                return updatedItems;
            } else {
                // --- THIS IS THE FIX ---
                // Create the new cart item, mapping 'plant._id' to 'item.id'
                return [...prevItems, {
                    id: plant._id, // <-- Use plant._id as the item's id
                    common_names: plant.common_names, 
                    scientific_name: plant.scientific_name, 
                    price_default: plant.price_default, 
                    stock: plant.stock, // Also add the stock
                    quantity: 1,
                }];
            }
        });
    }, []);

    // Remove a plant from cart
    const removeFromCart = useCallback((plantId) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== plantId));
    }, []);

    // Update quantity of a plant in cart
    const updateItemQuantity = useCallback((plantId, newQuantity) => {
        const quantity = Math.max(1, parseInt(newQuantity) || 1); 

        setCartItems(prevItems =>
            prevItems.map(item =>
                item.id === plantId
                    ? { ...item, quantity: quantity }
                    : item
            )
        );
    }, []);

    // Clear the entire cart
    const clearCart = useCallback(() => {
        setCartItems([]);
    }, []);

    // Calculate cart totals (using correct properties and fallbacks)
    const cartTotal = cartItems.reduce(
        (total, item) => total + ((item.price_default || 0) * (item.quantity || 1)),
        0
    );

    const itemCount = cartItems.reduce(
        (count, item) => count + (item.quantity || 1),
        0
    );

    const value = {
        cartItems,
        addToCart,
        removeFromCart,
        updateItemQuantity,
        clearCart,
        cartTotal,
        itemCount
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

// Custom hook
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};