const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Database Connection (Supports both Local and Cloud)
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ecommerce_db',
    port: process.env.DB_PORT || 3306,
    ssl: { rejectUnauthorized: false } // Crucial for Aiven connection
});

db.connect(err => {
    if (err) console.log("Database connection failed: " + err);
    else console.log("Connected to MySQL Database");
});

// --- API ROUTES ---

// 1. REGISTER
app.post('/register', (req, res) => {
    const sql = "INSERT INTO users (username, email, password) VALUES (?)";
    const values = [req.body.username, req.body.email, req.body.password];
    db.query(sql, [values], (err, result) => {
        if (err) return res.json({ Error: "Error" });
        return res.json({ Status: "Success" });
    });
});

// 2. LOGIN
app.post('/login', (req, res) => {
    const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
    db.query(sql, [req.body.email, req.body.password], (err, data) => {
        if (err) return res.json("Error");
        if (data.length > 0) {
            return res.json({ Status: "Success", id: data[0].id });
        } else {
            return res.json("No record");
        }
    });
});

// 3. GET USER DETAILS (This was missing!)
app.get('/user/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM users WHERE id = ?";
    db.query(sql, [id], (err, data) => {
        if(err) return res.json("Error");
        return res.json(data[0]);
    })
});

// 4. GET PRODUCTS (Home Page)
app.get('/products', (req, res) => {
    const sql = "SELECT * FROM products";
    db.query(sql, (err, data) => {
        if (err) return res.json("Error");
        return res.json(data);
    });
});

// 5. ADD PRODUCT (Admin)
app.post('/add-product', (req, res) => {
    const sql = "INSERT INTO products (name, description, price, image_url) VALUES (?)";
    const values = [req.body.name, req.body.description, req.body.price, req.body.image_url];
    db.query(sql, [values], (err, data) => {
        if(err) return res.json("Error");
        return res.json({ Status: "Success" });
    });
});

// 6. PLACE ORDER
app.post('/place-order', (req, res) => {
    const { user_id, amount } = req.body;
    const sql = "INSERT INTO orders (user_id, total_amount) VALUES (?, ?)";
    db.query(sql, [user_id, amount], (err, result) => {
        if (err) return res.json("Error");
        return res.json({ Status: "Success" });
    });
});

// 7. GET ORDERS
app.get('/orders/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM orders WHERE user_id = ?";
    db.query(sql, [id], (err, data) => {
        if(err) return res.json("Error");
        return res.json(data);
    })
});

// 8. UPDATE PROFILE (Edit)
app.put('/update-profile', (req, res) => {
    const { id, phone, address } = req.body;
    const sql = "UPDATE users SET phone = ?, address = ? WHERE id = ?";
    db.query(sql, [phone, address, id], (err, result) => {
        if(err) return res.json("Error");
        return res.json({ Status: "Success" });
    });
});


// 9. DELETE PRODUCT
app.delete('/delete-product/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM products WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if(err) return res.json("Error");
        return res.json({ Status: "Success" });
    });
});

app.listen(8081, () => {
    console.log("Server running on port 8081");
});