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
    password: process.env.DB_PASSWORD || 'sriram@2004',
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
        if (err) {
            console.error('REGISTER DB ERROR:', err);
            return res.status(500).json({ Error: "Error" });
        }
        return res.json({ Status: "Success" });
    });
});

// 2. LOGIN
app.post('/login', (req, res) => {
    const { email, username, password } = req.body || {};
    if (!password || (!email && !username)) {
        return res.status(400).json({ Error: 'Missing credentials' });
    }

    const sql = email
        ? "SELECT * FROM users WHERE email = ? AND password = ?"
        : "SELECT * FROM users WHERE username = ? AND password = ?";
    const params = email ? [email, password] : [username, password];

    db.query(sql, params, (err, data) => {
        if (err) {
            console.error('LOGIN DB ERROR:', err);
            return res.status(500).json({ Error: 'Database error' });
        }
        if (data && data.length > 0) {
            return res.json({ Status: "Success", id: data[0].id });
        } else {
            return res.status(404).json({ Error: "No record" });
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
        if (err) {
            console.error('PRODUCTS DB ERROR:', err);
            return res.status(500).json({ Error: 'Database error' });
        }
        return res.json(data);
    });
});

// 5. ADD PRODUCT (Admin)
app.post('/add-product', (req, res) => {
    const sql = "INSERT INTO products (name, description, price, image_url) VALUES (?)";
    const values = [req.body.name, req.body.description, req.body.price, req.body.image_url];
    db.query(sql, [values], (err, data) => {
        if(err) {
            console.error('ADD-PRODUCT DB ERROR:', err);
            return res.status(500).json({ Error: 'Database error' });
        }
        return res.json({ Status: "Success" });
    });
});

// 6. PLACE ORDER
app.post('/place-order', (req, res) => {
    const { user_id, amount, items } = req.body || {};
    if (!user_id || typeof amount === 'undefined') {
        return res.status(400).json({ Error: 'Missing order data' });
    }

    // This DB schema stores `total_price` and an `items` JSON column.
    // We store a JSON payload in `items` that includes the user_id so orders can be
    // correlated back to users even though there's no explicit foreign key column.
    const itemsPayload = JSON.stringify(items || { user_id });
    const sql = "INSERT INTO orders (total_price, items) VALUES (?, ?)";
    db.query(sql, [amount, itemsPayload], (err, result) => {
        if (err) {
            console.error('PLACE-ORDER DB ERROR:', err);
            return res.status(500).json({ Error: 'Database error' });
        }
        return res.json({ Status: "Success", orderId: result.insertId });
    });
});

// 7. GET ORDERS
app.get('/orders/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM orders"; // fetch all, filter in app since schema has no user_id column
    db.query(sql, (err, data) => {
        if (err) {
            console.error('GET-ORDERS DB ERROR:', err);
            return res.status(500).json({ Error: 'Database error' });
        }
        const list = Array.isArray(data) ? data : [];
        const filtered = list.filter(row => {
            try {
                if (!row.items) return false;
                const parsed = typeof row.items === 'object' ? row.items : JSON.parse(row.items);
                return String(parsed.user_id) === String(id);
            } catch (e) { return false; }
        });
        return res.json(filtered);
    });
});

// 8. UPDATE PROFILE (Edit)
app.put('/update-profile', (req, res) => {
    const { id, phone, address } = req.body;
    const sql = "UPDATE users SET phone = ?, address = ? WHERE id = ?";
    db.query(sql, [phone, address, id], (err, result) => {
        if(err) {
            console.error('UPDATE-PROFILE DB ERROR:', err);
            return res.status(500).json({ Error: 'Database error' });
        }
        return res.json({ Status: "Success" });
    });
});


// 9. DELETE PRODUCT
app.delete('/delete-product/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM products WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if(err) {
            console.error('DELETE-PRODUCT DB ERROR:', err);
            return res.status(500).json({ Error: 'Database error' });
        }
        return res.json({ Status: "Success" });
    });
});

app.listen(8081, () => {
    console.log("Server running on port 8081");
});