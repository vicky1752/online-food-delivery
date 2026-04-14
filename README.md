# 🍔 Foodie — Full Stack Food Delivery Platform

A comprehensive, full-stack food delivery application modeled after platforms like Swiggy, Zomato, and UberEats. Built with modern web technologies including **React (Vite)**, **Node.js**, **Express**, and **MySQL**.

## ✨ Key Features & Functionality

The platform is designed with three distinct user experiences, each tailored to specific functional roles: **Customers**, **Shopkeepers (Restaurant Owners)**, and **Delivery Drivers**.

### 👤 Customer Experience
- **Secure Authentication:** JWT-based login, registration, and session management.
- **Restaurant Discovery:** Browse restaurants, filter by various cuisines, and search.
- **Dynamic Menus:** View categorized menu items specific to each restaurant.
- **Real-Time Cart:** Seamlessly add items, adjust quantities, or remove items from the cart.
- **Order Placement:** Reliable and secure order placement utilizing SQL transactions to maintain data integrity.
- **Live Order Tracking:** Step-by-step visual tracker for order statuses (Placed → Confirmed → Preparing → Out for Delivery → Delivered).
- **Reviews & Ratings:** Ability for users to leave reviews and 1-5 star ratings for restaurants.
- **Responsive UI:** Beautiful UI featuring smooth transitions, toast notifications, and dark-theme oriented styling.

### 🏪 Shopkeeper (Restaurant) Dashboard
- **Profile Management:** Toggle online/offline status for the restaurant.
- **Menu Management:** Seamlessly add new items, update pricing/details, remove items, or toggle item availability (e.g. mark an item out of stock).
- **Order Processing:** View incoming real-time orders, accept them, and manage the preparation pipeline.

### 🛵 Delivery Driver Dashboard
- **Availability Toggle:** Drivers can independently toggle their status to Online or Offline.
- **Smart Auto-Assignment:** The system automatically intelligently assigns available delivery drivers to orders that are marked "Out for Delivery".
- **Delivery Management:** View pickup and drop-off locations, update delivery status ("Picked Up", "Delivered").

---

## 🛠️ Tech Stack

**Frontend**
- **React 19** (initialized with Vite)
- **React Router DOM** (Client-side routing and protected routes)
- **Context API** (Global state management for Auth and Cart)
- **Axios** (API requests)
- **Tailwind-style Custom CSS / React Icons / React Hot Toast**

**Backend**
- **Node.js & Express.js**
- **MySQL2** (Relational database management with SQL foreign keys and cascading deletes)
- **bcryptjs** (Password hashing)
- **jsonwebtoken** (Authorization)

---

## 🗂️ Project Structure

```text
online-food-delivery/
├── server/               # Node.js + Express backend
│   ├── config/           # Database connection setup
│   ├── middleware/       # JWT Auth and Role verification middleware
│   ├── routes/           # Express routes (auth, cart, orders, delivery, shopkeeper)
│   ├── schema.sql        # MySQL schemas and seeded demo data
│   ├── index.js          # Express app entry point
│   └── .env              # Environment configurations
└── client/               # React + Vite frontend
    ├── src/
    │   ├── api/          # Axios interceptors and API setup
    │   ├── components/   # Reusable UI components (Navbar, Cart items, etc.)
    │   ├── context/      # AuthContext and CartContext providers
    │   ├── pages/        # Route components (Home, Dashboards, Login, etc.)
    │   ├── App.jsx       # Main layout and protected route logic
    │   └── main.jsx      # React DOM rendering
    ├── package.json      
    └── vite.config.js    
```

---

## ⚡ Setup & Run Instructions

### 1. Database Setup
Ensure you have MySQL installed and running on your system.

```bash
# Open your MySQL CLI
mysql -u root -p

# Inside the MySQL prompt, source the schema file to create the DB, tables, and insert dummy data:
source /path/to/online-food-delivery/server/schema.sql;
```

### 2. Backend Setup
Navigate to the server directory and install dependencies.

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory and add your configurations:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=foodie_db
JWT_SECRET=super_secret_jwt_key_123
```

Start the backend server:
```bash
npm run dev
# The backend will start on http://localhost:5000
```

### 3. Frontend Setup
Open a new terminal tab, navigate to the client directory, and install dependencies.

```bash
cd client
npm install
```

Start the Vite development server:
```bash
npm run dev
# The frontend will start on http://localhost:5173
```

---

## 🧪 Testing the Complete Workflow

To fully test the features of this platform, simulate the following lifecycle:

1. **Sign Up Multiple Accounts:** Create three separate accounts using the registration page. In the database, manually ensure they have their respective roles (`customer`, `restaurant`, `delivery`). *(Note: The seeded `schema.sql` database already provides some mock accounts).*
2. **Customer Flow:** Log in as a customer. Browse restaurants, add some items to your cart, and place an order.
3. **Shopkeeper Flow:** Log out, and log in with the `restaurant` account. Go to the Shopkeeper Dashboard. You will see the new order. Change its status to `preparing`, and then `out_for_delivery`.
4. **Driver Flow:** Log out, and log in with the `delivery` account. Go to the Driver Dashboard. Toggle your availability to "Online". You should be automatically assigned to the order. Update the status from `delivering` to `delivered`.
5. **Completion:** Log back in as the customer. View your orders to see the completed order and leave a review for the restaurant.

---

## 🔒 Security Measures
- Passwords are salt & hashed using `bcrypt` before being stored in MySQL.
- API endpoints are heavily protected using `jsonwebtoken`.
- Custom `<PrivateRoute />` components in React ensure strict UI role-based access control (RBAC). Admin and customer routes are completely walled off from drivers and shopkeepers, and vice versa.
