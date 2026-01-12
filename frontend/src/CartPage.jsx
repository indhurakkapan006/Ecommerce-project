import React, { useState } from 'react';
import { useCart } from './CartContext';
import api from './api';
import Modal from './Modal';

export default function Cart() {
    const { cart, removeFromCart, updateQuantity, clearCart, getTotalPrice, getTotalItems } = useCart();
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
    const userId = localStorage.getItem('userId');

    const handleCheckout = () => {
        if (!userId || userId === 'undefined') {
            setModal({ isOpen: true, title: 'Error', message: 'Please login to checkout', type: 'error' });
            return;
        }

        if (cart.length === 0) {
            setModal({ isOpen: true, title: 'Error', message: 'Your cart is empty', type: 'error' });
            return;
        }

        const totalPrice = getTotalPrice();
        api.post('/place-order', { 
            user_id: userId, 
            amount: totalPrice, 
            items: cart 
        })
        .then(res => {
            if (res.data.Status === "Success") {
                setModal({ isOpen: true, title: 'Success', message: `Order placed successfully! Order ID: ${res.data.orderId}`, type: 'success' });
                clearCart();
            } else {
                setModal({ isOpen: true, title: 'Error', message: 'Order failed. Please try again.', type: 'error' });
            }
        })
        .catch(err => {
            console.error('CHECKOUT ERROR', err);
            setModal({ isOpen: true, title: 'Error', message: 'Checkout failed', type: 'error' });
        });
    };

    return (
        <div className="container">
            <Modal isOpen={modal.isOpen} title={modal.title} message={modal.message} type={modal.type} onClose={() => setModal({ ...modal, isOpen: false })} />
            <h1>Shopping Cart</h1>

            {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    <p style={{ fontSize: '1.1rem' }}>Your cart is empty</p>
                </div>
            ) : (
                <>
                    <div style={{ maxWidth: '900px' }}>
                        {cart.map(item => (
                            <div key={item.id} style={{
                                background: 'white',
                                borderRadius: '8px',
                                padding: '20px',
                                marginBottom: '15px',
                                display: 'grid',
                                gridTemplateColumns: '1fr 100px 100px 100px',
                                gap: '20px',
                                alignItems: 'center',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                            }}>
                                <div>
                                    <h3 style={{ margin: '0 0 8px 0' }}>{item.name}</h3>
                                    <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>{item.description}</p>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ margin: 0, color: 'var(--primary)', fontWeight: 'bold' }}>₹{item.price}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
                                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{
                                        background: '#f0f0f0',
                                        border: 'none',
                                        width: '30px',
                                        height: '30px',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}>−</button>
                                    <input type="number" value={item.quantity} onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)} style={{
                                        width: '40px',
                                        textAlign: 'center',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        padding: '5px'
                                    }} min="1" />
                                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{
                                        background: '#f0f0f0',
                                        border: 'none',
                                        width: '30px',
                                        height: '30px',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}>+</button>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>₹{(item.price * item.quantity).toFixed(2)}</p>
                                    <button onClick={() => removeFromCart(item.id)} className="btn-danger" style={{ width: '100%', padding: '6px' }}>Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{
                        background: 'white',
                        borderRadius: '8px',
                        padding: '25px',
                        marginTop: '30px',
                        maxWidth: '900px',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
                            <div>
                                <p style={{ color: '#666', margin: '0 0 5px 0' }}>Total Items: <strong>{getTotalItems()}</strong></p>
                                <p style={{ color: '#666', margin: 0 }}>Subtotal</p>
                            </div>
                            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary)', margin: 0 }}>₹{getTotalPrice()}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleCheckout} className="btn-success" style={{ flex: 1, padding: '12px' }}>Proceed to Checkout</button>
                            <button onClick={clearCart} className="btn-outline" style={{ padding: '12px' }}>Clear Cart</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
