import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// --- COMPONENTS ---

function Home() {
    const [products, setProducts] = useState([]);
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId'); 

    useEffect(() => {
        if (userId === 'undefined') { localStorage.clear(); navigate('/login'); }
        fetchProducts();
    }, [userId, navigate]);

    const fetchProducts = () => {
        axios.get('https://ecommerce-project-wi9z.onrender.com/products')
            .then(res => setProducts(res.data))
            .catch(err => console.log(err));
    }

    const handleBuy = (price) => {
        if (!userId) { alert("Please Login to Buy!"); navigate('/login'); return; }
        axios.post('https://ecommerce-project-wi9z.onrender.com/place-order', { user_id: userId, amount: price })
        .then(res => {
            if (res.data.Status === "Success") alert("Order Placed Successfully!");
            else alert("Order Failed.");
        });
    };

    const handleDelete = (id) => {
        if(window.confirm("Are you sure you want to delete this product?")) {
            axios.delete('https://ecommerce-project-wi9z.onrender.com/delete-product/'+id)
            .then(res => {
                if(res.data.Status === "Success") { fetchProducts(); } 
                else { alert("Error deleting product"); }
            });
        }
    };

    return (
        <div className="container">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
                <h1>Latest Products</h1>
                <Link to="/add-product" className="btn-success" style={{textDecoration:'none', padding:'10px 20px', borderRadius:'8px'}}>+ Add New</Link>
            </div>
            
            <div className="grid">
                {products.map(p => (
                    <div key={p.id} className="card">
                        <div>
                            <h3>{p.name}</h3>
                            <p style={{color:'#666', fontSize:'0.9rem'}}>{p.description}</p>
                            <p className="price">₹{p.price}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button className="btn-primary" onClick={() => handleBuy(p.price)}>Buy Now</button>
                            <button className="btn-danger" onClick={() => handleDelete(p.id)} style={{width: 'auto'}}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AddProduct() {
    const [values, setValues] = useState({ name: '', description: '', price: '', image_url: '' });
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post('https://ecommerce-project-wi9z.onrender.com/add-product', values)
            .then(res => {
                if(res.data.Status === "Success") { alert("Product Added!"); navigate('/'); } 
                else { alert("Error adding product"); }
            });
    }

    return (
        <div className="container">
            <div className="auth-form">
                <h2>Add New Product</h2>
                <form onSubmit={handleSubmit}>
                    <input type="text" placeholder="Product Name" onChange={e => setValues({...values, name: e.target.value})} required />
                    <textarea placeholder="Description" onChange={e => setValues({...values, description: e.target.value})} required rows="3" />
                    <input type="number" placeholder="Price" onChange={e => setValues({...values, price: e.target.value})} required />
                    <input type="text" placeholder="Image URL (optional)" onChange={e => setValues({...values, image_url: e.target.value})} />
                    <button type="submit" className="btn-success" style={{width:'100%'}}>Add Product</button>
                </form>
            </div>
        </div>
    );
}

function Register() {
    const [values, setValues] = useState({ username: '', email: '', password: '' });
    const navigate = useNavigate();

    const handleRegister = (e) => {
        e.preventDefault();
        axios.post('https://ecommerce-project-wi9z.onrender.com/register', values)
            .then(res => { alert("Registered! Please Login."); navigate('/login'); });
    };

    return (
        <div className="container">
            <div className="auth-form">
                <h2>Create Account</h2>
                <form onSubmit={handleRegister}>
                    <input type="text" placeholder="Username" onChange={e => setValues({...values, username: e.target.value})} required />
                    <input type="email" placeholder="Email" onChange={e => setValues({...values, email: e.target.value})} required />
                    <input type="password" placeholder="Password" onChange={e => setValues({...values, password: e.target.value})} required />
                    <button type="submit" className="btn-primary">Sign Up</button>
                </form>
                <p style={{marginTop:'15px', textAlign:'center'}}>Already have an account? <Link to="/login">Login</Link></p>
            </div>
        </div>
    );
}

function Login() {
    const [values, setValues] = useState({ email: '', password: '' });
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post('https://ecommerce-project-wi9z.onrender.com/login', values)
            .then(res => {
                if(res.data.Status === "Success") {
                    localStorage.setItem('userId', res.data.id || res.data.userId); 
                    navigate('/'); 
                } else { alert("Login Failed"); }
            });
    }

    return (
        <div className="container">
            <div className="auth-form">
                <h2>Welcome Back</h2>
                <form onSubmit={handleSubmit}>
                    <input type="email" placeholder="Email" onChange={e => setValues({...values, email: e.target.value})} required />
                    <input type="password" placeholder="Password" onChange={e => setValues({...values, password: e.target.value})} required />
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
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        if(!userId || userId === 'undefined') navigate('/login');
        else fetchData();
    }, []);

    const fetchData = () => {
        axios.get('https://ecommerce-project-wi9z.onrender.com/user/'+userId).then(res => {
            setUser(res.data);
            setEditValues({ phone: res.data.phone || '', address: res.data.address || '' });
        });
        axios.get('https://ecommerce-project-wi9z.onrender.com/orders/'+userId).then(res => setOrders(res.data));
    }

    const handleLogout = () => { localStorage.clear(); navigate('/login'); }

    const handleSave = () => {
        axios.put('https://ecommerce-project-wi9z.onrender.com/update-profile', { id: userId, phone: editValues.phone, address: editValues.address })
        .then(res => {
            if(res.data.Status === "Success") { alert("Profile Updated!"); setIsEditing(false); fetchData(); } 
            else alert("Update Failed");
        });
    }

    return (
        <div className="container">
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
                        <input type="text" placeholder="Phone" value={editValues.phone} onChange={e => setEditValues({...editValues, phone: e.target.value})} />
                        <textarea placeholder="Address" value={editValues.address} onChange={e => setEditValues({...editValues, address: e.target.value})} />
                        <div style={{display:'flex', gap:'10px'}}>
                            <button onClick={handleSave} className="btn-success" style={{width:'auto'}}>Save Changes</button>
                            <button onClick={() => setIsEditing(false)} className="btn-outline">Cancel</button>
                        </div>
                    </div>
                )}
                
                <hr style={{margin:'30px 0', borderTop:'1px solid #eee'}} />
                <h3>Order History</h3>
                {orders.length === 0 ? <p style={{color:'#888'}}>No orders yet.</p> : (
                    <ul style={{listStyle:'none', padding:0}}>
                        {orders.map(o => (
                            <li key={o.id} style={{background:'#f9fafb', padding:'15px', marginBottom:'10px', borderRadius:'8px', display:'flex', justifyContent:'space-between'}}>
                                <span>Order <strong>#{o.id}</strong></span>
                                <span style={{color:'green', fontWeight:'bold'}}>₹{o.total_amount}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

// --- MAIN APP ---
function App() {
    return (
        <BrowserRouter>
            <nav>
                <Link to="/" className="brand">ShopSphere</Link>
                <div style={{display:'flex'}}>
                    <Link to="/">Home</Link>
                    <Link to="/profile">Profile</Link>
                    <Link to="/login">Login</Link>
                </div>
            </nav>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/add-product" element={<AddProduct />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/profile" element={<Profile />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;