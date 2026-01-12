const axios = require('axios');
const mysql = require('mysql2/promise');

const client = axios.create({
  baseURL: 'http://localhost:8081',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

(async () => {
  let created = { userId: null, productId: null, orderId: null };
  let db;
  try {
    const timestamp = Date.now();
    const testUser = {
      username: `testuser_${timestamp}`,
      email: `test_${timestamp}@example.com`,
      password: 'TestPass123!'
    };

    console.log('1) Registering user...');
    const reg = await client.post('/register', testUser).catch(e => e.response || e);
    console.log(' register ->', reg.status || 'no-status', reg.data);

    console.log('2) Logging in (username)...');
    const login = await client.post('/login', {
      username: testUser.username,
      password: testUser.password
    }).catch(e => e.response || e);
    console.log(' login ->', login.status || 'no-status', login.data);

    if (!login || !login.data || !login.data.id) {
      console.error('Login failed or no id returned — stopping E2E.');
      return;
    }
    const userId = login.data.id;
    created.userId = userId;

    console.log('3) Fetching products...');
    const products = await client.get('/products').catch(e => e.response || e);
    console.log(' products ->', products.status || 'no-status', Array.isArray(products.data) ? `count=${products.data.length}` : products.data);

    console.log('4) Adding a test product...');
    const product = {
      name: `E2E Product ${timestamp}`,
      description: 'Created by E2E test',
      price: 9.99,
      image_url: ''
    };
    const addProd = await client.post('/add-product', product).catch(e => e.response || e);
    console.log(' add-product ->', addProd.status || 'no-status', addProd.data);

    // identify created product id by fetching products and matching by name
    const allAfter = await client.get('/products').catch(e => e.response || e);
    const found = Array.isArray(allAfter.data) ? allAfter.data.find(p => p.name === product.name) : null;
    if (found && found.id) created.productId = found.id;

    console.log('5) Placing an order...');
    const place = await client.post('/place-order', { user_id: userId, amount: 9.99, items: { user_id: userId } }).catch(e => e.response || e);
    console.log(' place-order ->', place.status || 'no-status', place.data);
    if (place && place.data && place.data.orderId) created.orderId = place.data.orderId;

    console.log('6) Fetching orders for user...');
    const orders = await client.get(`/orders/${userId}`).catch(e => e.response || e);
    console.log(' orders ->', orders.status || 'no-status', orders.data);

    console.log('E2E script finished.');
  } catch (err) {
    console.error('E2E script error:', err && err.stack ? err.stack : err);
  }
  finally {
    // attempt cleanup using direct DB connection
    try {
      db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ecommerce_db',
        ssl: { rejectUnauthorized: false }
      });

      if (created.orderId) {
        await db.execute('DELETE FROM orders WHERE id = ?', [created.orderId]);
        console.log('Cleanup: deleted order', created.orderId);
      }
      if (created.productId) {
        await db.execute('DELETE FROM products WHERE id = ?', [created.productId]);
        console.log('Cleanup: deleted product', created.productId);
      }
      if (created.userId) {
        await db.execute('DELETE FROM users WHERE id = ?', [created.userId]);
        console.log('Cleanup: deleted user', created.userId);
      }
    } catch (cleanupErr) {
      console.error('Cleanup error (DB):', cleanupErr && cleanupErr.message ? cleanupErr.message : cleanupErr);
    } finally {
      if (db && db.end) await db.end();
    }
  }
})();