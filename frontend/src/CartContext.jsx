import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cart, setCart] = useState([]);

    // Load cart from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('cart');
        if (saved) {
            try {
                setCart(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load cart:', e);
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product) => {
        setCart(prevCart => {
            const existing = prevCart.find(item => item.id === product.id);
            if (existing) {
                return prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                return [...prevCart, { ...product, quantity: 1 }];
            }
        });
    };

    const removeFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            setCart(prevCart =>
                prevCart.map(item =>
                    item.id === productId ? { ...item, quantity } : item
                )
            );
        }
    };

    const clearCart = () => {
        setCart([]);
    };

    const getTotalPrice = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
    };

    const getTotalItems = () => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, getTotalPrice, getTotalItems }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}
