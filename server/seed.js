// ============================================================
//  FOODIE — Full Database Seeder
//  Run: node seed.js  (from /server directory)
// ============================================================
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

async function seed() {
  const conn = await pool.getConnection();
  try {
    console.log('🌱 Starting seed...\n');
    await conn.beginTransaction();

    // ── Wipe existing data (safe order) ──────────────────────
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const t of ['reviews','deliveries','order_items','orders','cart',
                     'menu_items','delivery_agents','restaurants','addresses','users']) {
      await conn.query(`TRUNCATE TABLE ${t}`);
    }
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Tables cleared');

    // ── Hash helper ──────────────────────────────────────────
    const h = (pw) => bcrypt.hash(pw, 10);

    // ── 1. USERS ─────────────────────────────────────────────
    const users = [
      // customers
      { name: 'Alice Johnson',   email: 'alice@foodie.com',        pw: 'password123', phone: '9876540001', role: 'customer' },
      { name: 'Bob Mehta',       email: 'bob@foodie.com',          pw: 'password123', phone: '9876540002', role: 'customer' },
      { name: 'Chitra Rao',      email: 'chitra@foodie.com',       pw: 'password123', phone: '9876540003', role: 'customer' },
      // restaurant owners
      { name: 'Arjun Sharma',    email: 'spicegarden@foodie.com',  pw: 'password123', phone: '9876540010', role: 'restaurant' },
      { name: 'Marco Ferrini',   email: 'pizzaplanet@foodie.com',  pw: 'password123', phone: '9876540011', role: 'restaurant' },
      { name: 'Jake Miller',     email: 'burgerbarn@foodie.com',   pw: 'password123', phone: '9876540012', role: 'restaurant' },
      { name: 'Wei Chen',        email: 'dragonwok@foodie.com',    pw: 'password123', phone: '9876540013', role: 'restaurant' },
      { name: 'Yuki Tanaka',     email: 'sushisakura@foodie.com',  pw: 'password123', phone: '9876540014', role: 'restaurant' },
      { name: 'Carlos Reyes',    email: 'tacostop@foodie.com',     pw: 'password123', phone: '9876540015', role: 'restaurant' },
      // delivery drivers
      { name: 'Rahul Sharma',    email: 'rahul@foodie.com',        pw: 'password123', phone: '9876543210', role: 'delivery' },
      { name: 'Amit Kumar',      email: 'amit@foodie.com',         pw: 'password123', phone: '9876543211', role: 'delivery' },
      { name: 'Priya Singh',     email: 'priya@foodie.com',        pw: 'password123', phone: '9876543212', role: 'delivery' },
      { name: 'Vikram Patel',    email: 'vikram@foodie.com',       pw: 'password123', phone: '9876543213', role: 'delivery' },
    ];

    const userIds = {};
    for (const u of users) {
      const hashed = await h(u.pw);
      const [r] = await conn.query(
        'INSERT INTO users (name, email, password, phone, role) VALUES (?,?,?,?,?)',
        [u.name, u.email, hashed, u.phone, u.role]
      );
      userIds[u.email] = r.insertId;
    }
    console.log(`✅ ${users.length} users created`);

    // ── 2. RESTAURANTS (linked to owner users) ───────────────
    const restaurants = [
      { name: 'Spice Garden',  cuisine: 'Indian',    rating: 4.5, time: '30-40 min', min: 149, img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600', owner: 'spicegarden@foodie.com' },
      { name: 'Pizza Planet',  cuisine: 'Italian',   rating: 4.3, time: '25-35 min', min: 199, img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600', owner: 'pizzaplanet@foodie.com' },
      { name: 'Burger Barn',   cuisine: 'American',  rating: 4.1, time: '20-30 min', min:  99, img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600', owner: 'burgerbarn@foodie.com' },
      { name: 'Dragon Wok',    cuisine: 'Chinese',   rating: 4.4, time: '35-45 min', min: 129, img: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600', owner: 'dragonwok@foodie.com' },
      { name: 'Sushi Sakura',  cuisine: 'Japanese',  rating: 4.7, time: '40-50 min', min: 299, img: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600', owner: 'sushisakura@foodie.com' },
      { name: 'The Taco Stop', cuisine: 'Mexican',   rating: 4.2, time: '20-30 min', min:  89, img: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600', owner: 'tacostop@foodie.com' },
    ];

    const restIds = {};
    for (const r of restaurants) {
      const [res] = await conn.query(
        'INSERT INTO restaurants (user_id, name, cuisine, rating, delivery_time, min_order, image_url) VALUES (?,?,?,?,?,?,?)',
        [userIds[r.owner], r.name, r.cuisine, r.rating, r.time, r.min, r.img]
      );
      restIds[r.name] = res.insertId;
    }
    console.log(`✅ ${restaurants.length} restaurants created`);

    // ── 3. MENU ITEMS ────────────────────────────────────────
    const menuItems = {
      'Spice Garden': [
        { name: 'Butter Chicken',       desc: 'Creamy tomato-based chicken curry',         price: 280, cat: 'Main Course' },
        { name: 'Paneer Tikka Masala',  desc: 'Grilled cottage cheese in spiced gravy',    price: 240, cat: 'Main Course' },
        { name: 'Dal Makhani',          desc: 'Slow-cooked black lentils with cream',      price: 180, cat: 'Main Course' },
        { name: 'Garlic Naan',          desc: 'Freshly baked garlic flatbread',            price:  50, cat: 'Bread' },
        { name: 'Biryani',              desc: 'Fragrant basmati rice with spiced meat',    price: 320, cat: 'Main Course' },
        { name: 'Gulab Jamun',          desc: 'Soft milk-solid balls in rose syrup',       price:  80, cat: 'Dessert' },
      ],
      'Pizza Planet': [
        { name: 'Margherita Pizza',     desc: 'Classic tomato, mozzarella, fresh basil',  price: 349, cat: 'Pizza' },
        { name: 'Pepperoni Feast',      desc: 'Loaded with spicy pepperoni slices',        price: 449, cat: 'Pizza' },
        { name: 'BBQ Chicken Pizza',    desc: 'Smoky BBQ sauce with grilled chicken',      price: 499, cat: 'Pizza' },
        { name: 'Veggie Supreme',       desc: 'Garden fresh veggies on cheese base',       price: 399, cat: 'Pizza' },
        { name: 'Garlic Bread',         desc: 'Toasted bread with herb garlic butter',     price: 149, cat: 'Sides' },
        { name: 'Tiramisu',             desc: 'Classic Italian coffee cream dessert',      price: 199, cat: 'Dessert' },
      ],
      'Burger Barn': [
        { name: 'Classic Smash Burger', desc: 'Double smash patty with special sauce',    price: 249, cat: 'Burgers' },
        { name: 'Crispy Chicken Burger',desc: 'Buttermilk fried chicken with coleslaw',   price: 229, cat: 'Burgers' },
        { name: 'Veg Loaded Burger',    desc: 'Hearty veggie patty with cheese & lettuce',price: 199, cat: 'Burgers' },
        { name: 'BBQ Bacon Burger',     desc: 'Smoky beef patty, bacon & BBQ sauce',      price: 299, cat: 'Burgers' },
        { name: 'Loaded Fries',         desc: 'Crispy fries with cheese sauce & jalapeños',price:149, cat: 'Sides' },
        { name: 'Chocolate Shake',      desc: 'Thick creamy chocolate milkshake',         price: 129, cat: 'Drinks' },
      ],
      'Dragon Wok': [
        { name: 'Kung Pao Chicken',     desc: 'Spicy stir-fried chicken with peanuts',    price: 280, cat: 'Main Course' },
        { name: 'Veg Fried Rice',       desc: 'Wok-tossed vegetables with fragrant rice', price: 200, cat: 'Rice' },
        { name: 'Dim Sum Basket',       desc: 'Assorted steamed dumplings (8 pcs)',        price: 240, cat: 'Starters' },
        { name: 'Hakka Noodles',        desc: 'Stir-fried egg noodles with vegetables',   price: 220, cat: 'Noodles' },
        { name: 'Veg Manchurian',       desc: 'Crispy veggie balls in tangy sauce',       price: 200, cat: 'Starters' },
        { name: 'Spring Rolls (4 pcs)', desc: 'Crispy rolls stuffed with vegetables',     price: 180, cat: 'Starters' },
      ],
      'Sushi Sakura': [
        { name: 'Salmon Nigiri (4 pcs)',desc: 'Fresh Atlantic salmon slices on rice',     price: 420, cat: 'Nigiri' },
        { name: 'Dragon Roll (8 pcs)',  desc: 'Prawn tempura, avocado & eel sauce',       price: 580, cat: 'Rolls' },
        { name: 'Spicy Tuna Roll',      desc: 'Fresh tuna with sriracha mayo',            price: 480, cat: 'Rolls' },
        { name: 'Miso Soup',            desc: 'Traditional tofu & seaweed soup',          price: 150, cat: 'Soups' },
        { name: 'Edamame',              desc: 'Steamed salted Japanese soybeans',         price: 180, cat: 'Starters' },
        { name: 'Matcha Ice Cream',     desc: 'Premium Japanese green tea ice cream',     price: 220, cat: 'Dessert' },
      ],
      'The Taco Stop': [
        { name: 'Beef Street Tacos (3)',desc: 'Seasoned beef, pico de gallo & cilantro', price: 249, cat: 'Tacos' },
        { name: 'Fish Tacos (2)',       desc: 'Battered fish with slaw & lime crema',    price: 279, cat: 'Tacos' },
        { name: 'Chicken Quesadilla',   desc: 'Grilled chicken & cheese in flour tortilla',price:219,cat:'Quesadillas'},
        { name: 'Veggie Burrito',       desc: 'Rice, black beans & salsa in tortilla',   price: 199, cat: 'Burritos' },
        { name: 'Nachos Supreme',       desc: 'Chips with cheese, jalapeños & guacamole',price: 179, cat: 'Starters' },
        { name: 'Churros',              desc: 'Crispy fried dough with chocolate dip',   price: 129, cat: 'Dessert' },
      ],
    };

    const itemIds = {}; // store first item id per restaurant for demo orders
    for (const [restName, items] of Object.entries(menuItems)) {
      let first = true;
      for (const item of items) {
        const [r] = await conn.query(
          'INSERT INTO menu_items (restaurant_id, name, description, price, category) VALUES (?,?,?,?,?)',
          [restIds[restName], item.name, item.desc, item.price, item.cat]
        );
        if (first) { itemIds[restName] = r.insertId; first = false; }
      }
    }
    console.log('✅ Menu items created');

    // ── 4. DELIVERY AGENTS (linked to driver users) ──────────
    const agents = [
      { email: 'rahul@foodie.com', phone: '9876543210' },
      { email: 'amit@foodie.com',  phone: '9876543211' },
      { email: 'priya@foodie.com', phone: '9876543212' },
      { email: 'vikram@foodie.com',phone: '9876543213' },
    ];

    const agentIds = {};
    for (const a of agents) {
      const uid = userIds[a.email];
      const userName = users.find(u => u.email === a.email).name;
      const [r] = await conn.query(
        'INSERT INTO delivery_agents (user_id, name, phone, available) VALUES (?,?,?,TRUE)',
        [uid, userName, a.phone]
      );
      agentIds[a.email] = r.insertId;
    }
    console.log('✅ Delivery agents created');

    // ── 5. DEMO ORDERS (various statuses) ────────────────────
    const demoOrders = [
      // Alice — delivered order at Spice Garden
      {
        userEmail: 'alice@foodie.com', restName: 'Spice Garden',
        status: 'delivered', agentEmail: 'rahul@foodie.com', agentStatus: 'delivered',
        items: [{ name: 'Butter Chicken', qty: 2, price: 280 }, { name: 'Garlic Naan', qty: 3, price: 50 }],
        total: 710,
      },
      // Alice — out for delivery at Pizza Planet
      {
        userEmail: 'alice@foodie.com', restName: 'Pizza Planet',
        status: 'out_for_delivery', agentEmail: 'amit@foodie.com', agentStatus: 'delivering',
        items: [{ name: 'Margherita Pizza', qty: 1, price: 349 }, { name: 'Garlic Bread', qty: 1, price: 149 }],
        total: 498,
      },
      // Bob — preparing at Burger Barn
      {
        userEmail: 'bob@foodie.com', restName: 'Burger Barn',
        status: 'preparing', agentEmail: 'priya@foodie.com', agentStatus: 'assigned',
        items: [{ name: 'Classic Smash Burger', qty: 2, price: 249 }, { name: 'Loaded Fries', qty: 1, price: 149 }],
        total: 647,
      },
      // Bob — placed order at Dragon Wok
      {
        userEmail: 'bob@foodie.com', restName: 'Dragon Wok',
        status: 'placed', agentEmail: null, agentStatus: null,
        items: [{ name: 'Hakka Noodles', qty: 1, price: 220 }, { name: 'Dim Sum Basket', qty: 1, price: 240 }],
        total: 460,
      },
      // Chitra — confirmed at Sushi Sakura
      {
        userEmail: 'chitra@foodie.com', restName: 'Sushi Sakura',
        status: 'confirmed', agentEmail: 'vikram@foodie.com', agentStatus: 'assigned',
        items: [{ name: 'Dragon Roll (8 pcs)', qty: 1, price: 580 }, { name: 'Miso Soup', qty: 2, price: 150 }],
        total: 880,
      },
      // Chitra — delivered at The Taco Stop
      {
        userEmail: 'chitra@foodie.com', restName: 'The Taco Stop',
        status: 'delivered', agentEmail: 'rahul@foodie.com', agentStatus: 'delivered',
        items: [{ name: 'Beef Street Tacos (3)', qty: 2, price: 249 }, { name: 'Nachos Supreme', qty: 1, price: 179 }],
        total: 677,
      },
    ];

    for (const demo of demoOrders) {
      // Get menu item IDs by name from menu_items table
      const restId = restIds[demo.restName];
      const userId = userIds[demo.userEmail];

      const [orderRes] = await conn.query(
        'INSERT INTO orders (user_id, restaurant_id, total_amount, status) VALUES (?,?,?,?)',
        [userId, restId, demo.total, demo.status]
      );
      const orderId = orderRes.insertId;

      for (const item of demo.items) {
        // Lookup item_id
        const [rows] = await conn.query(
          'SELECT item_id FROM menu_items WHERE restaurant_id=? AND name=? LIMIT 1',
          [restId, item.name]
        );
        if (rows.length > 0) {
          await conn.query(
            'INSERT INTO order_items (order_id, item_id, quantity, price) VALUES (?,?,?,?)',
            [orderId, rows[0].item_id, item.qty, item.price]
          );
        }
      }

      // Assign delivery agent
      if (demo.agentEmail) {
        const agentId = agentIds[demo.agentEmail];
        await conn.query(
          'INSERT INTO deliveries (order_id, agent_id, status) VALUES (?,?,?)',
          [orderId, agentId, demo.agentStatus]
        );
        // Mark agent busy if not delivered
        if (demo.status !== 'delivered') {
          await conn.query('UPDATE delivery_agents SET available=FALSE WHERE agent_id=?', [agentId]);
        }
      }
    }
    console.log(`✅ ${demoOrders.length} demo orders created`);

    // ── 6. DEMO REVIEWS ──────────────────────────────────────
    const reviews = [
      { userEmail: 'alice@foodie.com',  restName: 'Spice Garden',  rating: 5, comment: 'Amazing butter chicken! Best I have had in the city 🔥' },
      { userEmail: 'bob@foodie.com',    restName: 'Burger Barn',   rating: 4, comment: 'Smash burger was juicy and perfectly cooked. Fries were crispy!' },
      { userEmail: 'chitra@foodie.com', restName: 'Sushi Sakura',  rating: 5, comment: 'Freshest sushi in town. The dragon roll is absolutely divine.' },
      { userEmail: 'alice@foodie.com',  restName: 'Pizza Planet',  rating: 4, comment: 'Pepperoni feast was excellent. Quick delivery too!' },
      { userEmail: 'bob@foodie.com',    restName: 'Dragon Wok',    rating: 4, comment: 'Dim sums are soft and delicious. Manchurian sauce is spot on.' },
      { userEmail: 'chitra@foodie.com', restName: 'The Taco Stop', rating: 5, comment: 'Best tacos outside of Mexico! The fish tacos are incredible.' },
    ];

    for (const rev of reviews) {
      await conn.query(
        'INSERT INTO reviews (user_id, restaurant_id, rating, comment) VALUES (?,?,?,?)',
        [userIds[rev.userEmail], restIds[rev.restName], rev.rating, rev.comment]
      );
    }
    console.log(`✅ ${reviews.length} reviews created`);

    await conn.commit();

    console.log('\n🎉 Seed complete!\n');
    console.log('━'.repeat(55));
    console.log('  DEMO LOGIN CREDENTIALS (password: password123)');
    console.log('━'.repeat(55));
    console.log('  👤 CUSTOMER    alice@foodie.com');
    console.log('  👤 CUSTOMER    bob@foodie.com');
    console.log('  👤 CUSTOMER    chitra@foodie.com');
    console.log('  🏪 SHOPKEEPER  spicegarden@foodie.com');
    console.log('  🏪 SHOPKEEPER  pizzaplanet@foodie.com');
    console.log('  🏪 SHOPKEEPER  burgerbarn@foodie.com');
    console.log('  🛵 DRIVER      rahul@foodie.com');
    console.log('  🛵 DRIVER      amit@foodie.com');
    console.log('  🛵 DRIVER      priya@foodie.com');
    console.log('━'.repeat(55));

  } catch (err) {
    await conn.rollback();
    console.error('❌ Seed failed:', err.message);
    throw err;
  } finally {
    conn.release();
    process.exit(0);
  }
}

seed();
