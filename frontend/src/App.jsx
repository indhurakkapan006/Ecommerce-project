import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import api from './api';
import Modal from './Modal';
import { CartProvider, useCart } from './CartContext';
import CartPage from './CartPage';

// --- COMPONENTS ---

function Home() {
    const [products, setProducts] = useState([]);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
    const [quantityModal, setQuantityModal] = useState({ isOpen: false, product: null, quantity: 1 });
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');
    const isAdmin = localStorage.getItem('isAdmin') === 'true'; 

    // fetchProducts defined as a function declaration so it can be called inside
    // the effect without ordering/hoisting lint issues.
    function fetchProducts() {
        api.get('/products')
            .then(res => {
                if (Array.isArray(res.data)) {
                    setProducts(res.data);
                } else {
                    console.error("Backend Error (Products):", res.data);
                }
            })
            .catch(err => console.log(err));
    }

    useEffect(() => {
        if (userId === 'undefined') { localStorage.clear(); navigate('/login'); }
        fetchProducts();
    }, [userId, navigate]);

    const handleBuy = (productId) => {
        if (!userId) { 
            setModal({ isOpen: true, title: 'Login Required', message: 'Please Login to Buy!', type: 'info' });
            setTimeout(() => navigate('/login'), 2000);
            return;
        }
        const product = products.find(p => p.id === productId);
        if (product) {
            setQuantityModal({ isOpen: true, product, quantity: 1 });
        }
    };

    const handleConfirmAdd = () => {
        if (quantityModal.product && quantityModal.quantity > 0) {
            const updatedProduct = { ...quantityModal.product };
            let totalQty = 0;
            for (let i = 0; i < quantityModal.quantity; i++) {
                totalQty = addToCart(updatedProduct);
            }
            setModal({ isOpen: true, title: 'Added to Cart', message: `${quantityModal.product.name} added! Quantity in cart: ${totalQty}`, type: 'success' });
            setQuantityModal({ isOpen: false, product: null, quantity: 1 });
        }
    };

    const handleDelete = (id) => {
        if(window.confirm("Are you sure you want to delete this product?")) {
            
            {/* Quantity Confirmation Modal */}
            {quantityModal.isOpen && quantityModal.product && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '30px',
                        maxWidth: '400px',
                        width: '90%',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
                    }}>
                        <h2 style={{ marginTop: 0, marginBottom: '15px' }}>Confirm Quantity</h2>
                        <p style={{ color: '#555', marginBottom: '20px' }}>
                            <strong>{quantityModal.product.name}</strong><br/>
                            Price: ₹{quantityModal.product.price}
                        </p>
                        <div style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Quantity:</label>
                            <input 
                                type="number" 
                                min="1" 
                                value={quantityModal.quantity}
                                onChange={(e) => setQuantityModal({ ...quantityModal, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                                style={{ width: '100%', padding: '8px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                onClick={handleConfirmAdd}
                                className="btn-success"
                                style={{ flex: 1 }}
                            >
                                Add to Cart
                            </button>
                            <button 
                                onClick={() => setQuantityModal({ isOpen: false, product: null, quantity: 1 })}
                                className="btn-danger"
                                style={{ flex: 1 }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            api.delete('/delete-product/'+id)
            .then(res => {
                if(res.data.Status === "Success") { fetchProducts(); } 
                else { setModal({ isOpen: true, title: 'Error', message: 'Error deleting product', type: 'error' }); }
            }).catch(err => { console.error('DELETE PROD ERROR', err); setModal({ isOpen: true, title: 'Error', message: 'Error deleting product', type: 'error' }); });
        }
    };

    return (
        <div className="container">
            <Modal isOpen={modal.isOpen} title={modal.title} message={modal.message} type={modal.type} onClose={() => setModal({ ...modal, isOpen: false })} />
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
                <h1>Latest Products</h1>
                {isAdmin && <Link to="/add-product" className="btn-success" style={{textDecoration:'none', padding:'10px 20px', borderRadius:'8px'}}>+ Add New</Link>}
            </div>
            
            <div className="grid">
                {products.length > 0 ? products.map(p => (
                    <div key={p.id} className="card">
                        <div>
                            <h3>{p.name}</h3>
                            <p style={{color:'#666', fontSize:'0.9rem'}}>{p.description}</p>
                            <p className="price">₹{p.price}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button className="btn-primary" onClick={() => handleBuy(p.id, p.price)}>Buy Now</button>
                            {isAdmin && <button className="btn-danger" onClick={() => handleDelete(p.id)} style={{width: 'auto'}}>Delete</button>}
                        </div>
                    </div>
                )) : <p>No products found. (Try adding one!)</p>}
            </div>
        </div>
    );
}

function AddProduct() {
    const [values, setValues] = useState({ name: '', description: '', price: '', image_url: '' });
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        api.post('/add-product', values)
            .then(res => {
                if(res.data.Status === "Success") { 
                    setModal({ isOpen: true, title: 'Success', message: 'Product Added!', type: 'success' });
                    setTimeout(() => navigate('/'), 2000);
                } 
                else { setModal({ isOpen: true, title: 'Error', message: 'Error adding product', type: 'error' }); }
            }).catch(err => { console.error('ADD PROD ERROR', err); setModal({ isOpen: true, title: 'Error', message: 'Error adding product', type: 'error' }); });
    }

    return (
        <div className="container">
            <Modal isOpen={modal.isOpen} title={modal.title} message={modal.message} type={modal.type} onClose={() => setModal({ ...modal, isOpen: false })} />
            <div className="auth-form">
                <h2>Add New Product</h2>
                <form onSubmit={handleSubmit}>
                    <input type="text" name="product-name" id="product-name" placeholder="Product Name" onChange={e => setValues({...values, name: e.target.value})} required />
                    <textarea name="description" id="description" placeholder="Description" onChange={e => setValues({...values, description: e.target.value})} required rows="3" />
                    <input type="number" name="price" id="price" placeholder="Price" onChange={e => setValues({...values, price: e.target.value})} required />
                    <input type="text" name="image" id="image" placeholder="Image URL (optional)" onChange={e => setValues({...values, image_url: e.target.value})} />
                    <button type="submit" className="btn-success" style={{width:'100%'}}>Add Product</button>
                </form>
            </div>
        </div>
    );
}

function Register() {
    const [values, setValues] = useState({ username: '', email: '', password: '' });
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
    const navigate = useNavigate();

    const handleRegister = (e) => {
        e.preventDefault();
        api.post('/register', values)
            .then(res => { 
                setModal({ isOpen: true, title: 'Success', message: 'Registered! Please Login.', type: 'success' });
                setTimeout(() => navigate('/login'), 2000);
            }).catch(err => { 
                console.error('REGISTER ERROR', err);
                const errorMessage = err.response?.data?.Error || 'Registration failed';
                setModal({ isOpen: true, title: 'Error', message: errorMessage, type: 'error' }); 
            });
    };

    return (
        <div className="container">
            <Modal isOpen={modal.isOpen} title={modal.title} message={modal.message} type={modal.type} onClose={() => setModal({ ...modal, isOpen: false })} />
            <div className="auth-form">
                <h2>Create Account</h2>
                <form onSubmit={handleRegister}>
                    <input type="text" name="username" id="username" autoComplete="username" placeholder="Username" onChange={e => setValues({...values, username: e.target.value})} required />
                    <input type="email" name="email" id="email" autoComplete="email" placeholder="Email" onChange={e => setValues({...values, email: e.target.value})} required />
                    <input type="password" name="password" id="password" autoComplete="new-password" placeholder="Password" onChange={e => setValues({...values, password: e.target.value})} required />
                    <button type="submit" className="btn-primary">Sign Up</button>
                </form>
                <p style={{marginTop:'15px', textAlign:'center'}}>Already have an account? <Link to="/login">Login</Link></p>
            </div>
        </div>
    );
}

function Login() {
    const [values, setValues] = useState({ email: '', password: '' });
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        api.post('/login', values)
            .then(res => {
                if(res.data.Status === "Success") {
                    const userId = res.data.id || res.data.userId;
                    localStorage.setItem('userId', userId);
                    // Set admin status (user ID 1 is admin, or check if response has isAdmin flag)
                    localStorage.setItem('isAdmin', (userId === '1' || userId === 1 || res.data.isAdmin) ? 'true' : 'false');
                    navigate('/'); 
                } else { setModal({ isOpen: true, title: 'Error', message: 'Login Failed', type: 'error' }); }
            }).catch(err => { console.error('LOGIN ERROR', err); setModal({ isOpen: true, title: 'Error', message: 'Login failed', type: 'error' }); });
    }

    return (
        <div className="container">
            <Modal isOpen={modal.isOpen} title={modal.title} message={modal.message} type={modal.type} onClose={() => setModal({ ...modal, isOpen: false })} />
            <div className="auth-form">
                <h2>Welcome Back</h2>
                <form onSubmit={handleSubmit}>
                    <input type="email" name="email" id="login-email" autoComplete="email" placeholder="Email" onChange={e => setValues({...values, email: e.target.value})} required />
                    <input type="password" name="password" id="login-password" autoComplete="current-password" placeholder="Password" onChange={e => setValues({...values, password: e.target.value})} required />
                    <button type="submit" className="btn-primary">Login</button>
                </form>
                <p style={{marginTop:'15px', textAlign:'center'}}>New here? <Link to="/register">Register</Link></p>
            </div>
        </div>
    );
}

function Profile() {
    const [user, setUser] = useState({});
    const [orders, setOrders] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editValues, setEditValues] = useState({ phone: '', address: '' });
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');

    const fetchData = useCallback(() => {
        api.get('/user/'+userId).then(res => {
            setUser(res.data);
            setEditValues({ phone: res.data.phone || '', address: res.data.address || '' });
        }).catch(err => { console.error('GET USER ERROR', err); });
        
        api.get('/orders/'+userId).then(res => {
            if (Array.isArray(res.data)) {
                setOrders(res.data);
            } else {
                setOrders([]); 
            }
        }).catch(err => { console.error('GET ORDERS ERROR', err); setOrders([]); });
    }, [userId]);

    useEffect(() => {
        if(!userId || userId === 'undefined') navigate('/login');
        else fetchData();
    }, [fetchData, navigate, userId]);

    const handleLogout = () => { 
        localStorage.clear(); 
        navigate('/login'); 
    }

    const handleSave = () => {
        api.put('/update-profile', { id: userId, phone: editValues.phone, address: editValues.address })
        .then(res => {
            if(res.data.Status === "Success") { 
                setModal({ isOpen: true, title: 'Success', message: 'Profile Updated!', type: 'success' });
                setIsEditing(false); 
                fetchData(); 
            } 
            else setModal({ isOpen: true, title: 'Error', message: 'Update Failed', type: 'error' });
        }).catch(err => { console.error('UPDATE PROFILE ERROR', err); setModal({ isOpen: true, title: 'Error', message: 'Update Failed', type: 'error' }); });
    }

    return (
        <div className="container">
            <Modal isOpen={modal.isOpen} title={modal.title} message={modal.message} type={modal.type} onClose={() => setModal({ ...modal, isOpen: false })} />
            <div className="card" style={{maxWidth: '800px', margin: '0 auto'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #eee', paddingBottom:'15px', marginBottom:'20px'}}>
                    <h2>My Profile</h2>
                    {!isEditing && <button onClick={handleLogout} className="btn-danger" style={{width:'auto'}}>Logout</button>}
                </div>
                
                {!isEditing ? (
                    <div>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'20px'}}>
                            <div><label style={{color:'#888', fontSize:'0.9rem'}}>Name</label><p style={{fontSize:'1.1rem', fontWeight:'500'}}>{user.username}</p></div>
                            <div><label style={{color:'#888', fontSize:'0.9rem'}}>Email</label><p style={{fontSize:'1.1rem', fontWeight:'500'}}>{user.email}</p></div>
                            <div><label style={{color:'#888', fontSize:'0.9rem'}}>Phone</label><p style={{fontSize:'1.1rem', fontWeight:'500'}}>{user.phone || "Not set"}</p></div>
                            <div><label style={{color:'#888', fontSize:'0.9rem'}}>Address</label><p style={{fontSize:'1.1rem', fontWeight:'500'}}>{user.address || "Not set"}</p></div>
                        </div>
                        <button onClick={() => setIsEditing(true)} className="btn-primary" style={{width:'auto'}}>Edit Details</button>
                    </div>
                ) : (
                    <div>
                        {/* FIXED: Added name, id, and autocomplete for Profile fields */}
                        <input type="tel" name="phone" id="phone" autoComplete="tel" placeholder="Phone" value={editValues.phone} onChange={e => setEditValues({...editValues, phone: e.target.value.replace(/[^0-9]/g, '')})} />
                        <textarea name="address" id="address" autoComplete="street-address" placeholder="Address" value={editValues.address} onChange={e => setEditValues({...editValues, address: e.target.value})} />
                        <div style={{display:'flex', gap:'10px'}}>
                            <button onClick={handleSave} className="btn-success" style={{width:'auto'}}>Save Changes</button>
                            <button onClick={() => setIsEditing(false)} className="btn-outline">Cancel</button>
                        </div>
                    </div>
                )}
                
                <hr style={{margin:'30px 0', borderTop:'1px solid #eee'}} />
                <h3>Order History</h3>
                {orders.length === 0 ? <p style={{color:'#888'}}>No orders yet.</p> : (
                    <div>
                        {orders.map(o => {
                            let items = [];
                            try {
                                items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
                                // If items is an object with user_id only, convert to empty array
                                if (!Array.isArray(items)) {
                                    items = Object.values(items).filter(item => item && typeof item === 'object' && item.id);
                                }
                            } catch (e) {
                                items = [];
                            }
                            
                            return (
                                <div key={o.id} style={{background:'#f9fafb', padding:'15px', marginBottom:'15px', borderRadius:'8px', border:'1px solid #e0e0e0'}}>
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px'}}>
                                        <span style={{fontWeight:'bold', fontSize:'1.1rem'}}>Order #{o.id}</span>
                                        <span style={{color:'green', fontWeight:'bold', fontSize:'1.05rem'}}>₹{o.total_price || o.total_amount || o.totalPrice}</span>
                                    </div>
                                    <div style={{fontSize:'0.9rem', color:'#666', marginBottom:'10px'}}>
                                        {new Date(o.created_at).toLocaleDateString('en-IN') || 'Date unavailable'}
                                    </div>
                                    <div style={{background:'white', padding:'10px', borderRadius:'6px', marginTop:'10px'}}>
                                        {items.length > 0 ? (
                                            <div>
                                                <p style={{marginTop:'0', marginBottom:'8px', fontSize:'0.9rem', fontWeight:'500', color:'#333'}}>Items:</p>
                                                {items.map((item, idx) => (
                                                    <div key={idx} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom: idx < items.length - 1 ? '1px solid #eee' : 'none', fontSize:'0.9rem'}}>
                                                        <div>
                                                            <span style={{fontWeight:'500'}}>{item.name}</span>
                                                            <span style={{color:'#888', marginLeft:'10px'}}>x{item.quantity}</span>
                                                        </div>
                                                        <span style={{color:'#666'}}>₹{(item.price * item.quantity).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p style={{margin:'0', color:'#888', fontSize:'0.9rem'}}>No product details available</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// --- MAIN APP ---
function AppContent() {
    const { getTotalItems } = useCart();
    const userId = localStorage.getItem('userId');
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <>
            <nav>
                <Link to="/" className="brand">ShopSphere</Link>
                <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
                    <Link to="/">Home</Link>
                    {userId && userId !== 'undefined' && <Link to="/profile">Profile</Link>}
                    <Link to="/cart" style={{position:'relative', display:'flex', alignItems:'center'}}>
                        🛒 Cart
                        {getTotalItems() > 0 && <span style={{position:'absolute', top:'-8px', right:'-8px', background:'var(--danger)', color:'white', borderRadius:'50%', width:'20px', height:'20px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:'bold'}}>{getTotalItems()}</span>}
                    </Link>
                    {userId && userId !== 'undefined' ? (
                        <button onClick={handleLogout} style={{background:'none', border:'none', color:'#9ca3af', cursor:'pointer', fontSize:'inherit', fontWeight:'500', padding:'0'}} onMouseEnter={(e) => e.target.style.color='white'} onMouseLeave={(e) => e.target.style.color='#9ca3af'}>Logout</button>
                    ) : (
                        <Link to="/login">Login</Link>
                    )}
                </div>
            </nav>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/add-product" element={<AddProduct />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/cart" element={<CartPage />} />
            </Routes>
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <CartProvider>
                <AppContent />
            </CartProvider>
        </BrowserRouter>
    );
}

export default App;