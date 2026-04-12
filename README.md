# 🍔 Foodie — Full Stack Food Delivery App

A complete Swiggy/Zomato-style food delivery platform built with **React + Node.js + MySQL**.

---

## 🗂️ Project Structure
```
dbms_project/
├── server/           # Node.js + Express backend
│   ├── config/db.js
│   ├── middleware/auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── restaurants.js
│   │   ├── cart.js
│   │   ├── orders.js
│   │   └── delivery.js
│   ├── schema.sql    ← Run this in MySQL first!
│   ├── index.js
│   └── .env
└── client/           # React + Vite frontend
    └── src/
        ├── pages/    Home, Login, Register, Restaurant, Cart, Orders, OrderDetail
        ├── context/  AuthContext, CartContext
        ├── components/ Navbar
        └── api/      axios.js
```

---

## ⚡ Setup Instructions

### 1. Database Setup
```sql
-- Open MySQL and run:
source path/to/server/schema.sql
```

### 2. Backend Setup
```bash
cd server
# Edit .env — set DB_HOST, DB_USER, DB_PASSWORD
npm install
npm run dev         # Runs on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev         # Runs on http://localhost:5173
```

---

## 🔑 Environment Variables (`server/.env`)
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=foodie_db
JWT_SECRET=your_secret_key
```

---

## 🌐 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/restaurants | All restaurants |
| GET | /api/restaurants/:id/menu | Menu for restaurant |
| POST | /api/cart/add | Add to cart |
| GET | /api/cart | Get cart |
| PUT | /api/cart/update/:id | Update quantity |
| DELETE | /api/cart/remove/:id | Remove item |
| POST | /api/orders | Place order |
| GET | /api/orders/my | User's orders |
| GET | /api/orders/:id | Order detail |
| PATCH | /api/orders/:id/status | Update status |
| GET | /api/delivery/track/:order_id | Track delivery |

---

## ✨ Features
- 🔐 JWT Authentication (register/login)
- 🏪 Restaurant listing with cuisine filters & search
- 🍽️ Menu browsing with category tabs
- 🛒 Real-time cart management
- 📦 Order placement with DB transactions
- 📍 Order tracking with status stepper
- 🛵 Auto delivery agent assignment
- ⭐ Ratings & Reviews system
- 🌑 Beautiful dark mode UI

---

## 🧪 Demo Flow
1. Register an account
2. Browse restaurants on Home
3. Click a restaurant → Add items to cart
4. Go to Cart → Place Order
5. View order in Orders page
6. Click "Simulate Next Status" to advance order status
7. Leave a review on the restaurant page
