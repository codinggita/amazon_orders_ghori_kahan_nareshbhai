# 🛒 Amazon Orders – Full Stack Project

A full-stack Amazon-style order management system built with **Node.js**, **Express.js**, and **MongoDB (Mongoose)**.

---

## 🚀 Backend Overview

The backend is a robust RESTful API that handles Amazon-like order management including full CRUD operations, advanced searching, filtering, sorting, and pagination.

### 🔧 Technologies Used

| Technology | Purpose |
|---|---|
| **Node.js** | Runtime environment |
| **Express.js** | Server framework & API routing |
| **MongoDB** | NoSQL database |
| **Mongoose** | Schema modeling & ODM |
| **CORS** | Cross-origin request handling |
| **Dotenv** | Environment variable management |
| **Nodemon** | Hot-reload during development |

---

## ⚡ Getting Started

### Prerequisites
- Node.js installed
- MongoDB running locally (or Atlas URI)

### Installation & Run

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file (see Environment Variables section)
# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file inside the `backend/` folder:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/userdata
```

---

## 📂 Folder Structure

```text
amazon-orders/
├── backend/                        # Node.js/Express Backend API
│   ├── config/                     # Configuration files (DB connection)
│   ├── controllers/                # Request handlers (MVC - Controller layer)
│   │   ├── activityController.js   # Admin & system activity log retriever
│   │   ├── adminController.js      # User banning, logs, maintenance management
│   │   ├── analyticsController.js  # Deep aggregation queries for store reports
│   │   ├── authController.js       # User auth, registration, login sessions
│   │   ├── bulkController.js       # Bulk insert, update, delete operations
│   │   ├── dashboardController.js  # Specialized dashboard metrics & trends
│   │   ├── errorController.js      # Mock error generators for frontend testing
│   │   ├── filterController.js     # Filter by status, price, date, location, etc.
│   │   ├── headOptionsController.js# Metadata headers and Allow lists (HEAD/OPTIONS)
│   │   ├── notificationController.js# Notification state manager
│   │   ├── orderController.js      # Full CRUD + specialized order operations
│   │   ├── paginationController.js # Paginated listings (standard, infinite, filtered)
│   │   ├── recommendationController.js # Product & order recommendations
│   │   ├── searchController.js     # Search (global, by field, fuzzy, autocomplete)
│   │   ├── sortingController.js    # Sorting by amount, date, quantity, discount
│   │   ├── statsController.js      # Real-time traffic performance tracking
│   │   ├── systemController.js     # Server uptime, config, and system status health
│   │   ├── trendingController.js   # Popular categories and trending products
│   │   └── validateController.js   # Field validator rules for requests
│   ├── middleware/                 # Express middleware functions
│   │   └── authMiddleware.js       # Protect JWT routes & restrict roles
│   ├── models/                     # Mongoose schemas (MVC - Model layer)
│   │   ├── Order.js                # Core order schema
│   │   ├── SearchQuery.js          # Search query tracking schema
│   │   └── User.js                 # Authentication user schema
│   ├── routes/                     # API route definitions (MVC - Router layer)
│   │   ├── activityRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── analyticsRoutes.js
│   │   ├── authRoutes.js
│   │   ├── bulkRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── errorRoutes.js
│   │   ├── filterRoutes.js
│   │   ├── headOptionsRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── paginationRoutes.js
│   │   ├── recommendationRoutes.js
│   │   ├── searchRoutes.js
│   │   ├── shippingRoutes.js
│   │   ├── sortingRoutes.js
│   │   ├── statsRoutes.js
│   │   ├── systemRoutes.js
│   │   ├── trendingRoutes.js
│   │   └── validateRoutes.js
│   ├── .env                        # Environment variables
│   ├── .gitignore
│   ├── index.js                    # Main entry point & server setup
│   ├── package.json                # Dependencies and scripts
│   ├── seed.js                     # Database seeding script
│   └── test_routes.js              # API endpoint verification script
│
├── frontend/                       # React Frontend (in progress)
└── README.md
```

---

## 🔌 API Endpoints

### Base URL: `http://localhost:5000`

---

### 📦 Orders – CRUD (`/api/v1/orders`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/orders` | Get all orders (paginated) |
| POST | `/api/v1/orders` | Create a new order |
| GET | `/api/v1/orders/:orderId` | Get order by ID |
| PUT | `/api/v1/orders/:orderId` | Replace entire order |
| PATCH | `/api/v1/orders/:orderId` | Partially update order |
| DELETE | `/api/v1/orders/:orderId` | Delete an order |
| GET | `/api/v1/orders/:orderId/exists` | Check if order exists |
| GET | `/api/v1/orders/:orderId/summary` | Get order summary |
| GET | `/api/v1/orders/:orderId/items` | Get order items |
| GET | `/api/v1/orders/:orderId/history` | Get order status history |
| GET | `/api/v1/orders/:orderId/invoice` | Generate invoice |
| PATCH | `/api/v1/orders/:orderId/archive` | Archive an order |
| PATCH | `/api/v1/orders/:orderId/restore` | Restore archived order |
| POST | `/api/v1/orders/:orderId/cancel` | Cancel an order |
| POST | `/api/v1/orders/:orderId/duplicate` | Duplicate an order |

---

### 🔍 Search (`/api/v1/orders/search`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/orders/search?q=laptop` | Global search across all fields |
| GET | `/api/v1/orders/search/customer?q=john` | Search by customer name |
| GET | `/api/v1/orders/search/product?q=iphone` | Search by product name |
| GET | `/api/v1/orders/search/category?q=electronics` | Search by category |
| GET | `/api/v1/orders/search/brand?q=samsung` | Search by brand |
| GET | `/api/v1/orders/search/status?q=delivered` | Search by order status |
| GET | `/api/v1/orders/search/payment?q=upi` | Search by payment method |
| GET | `/api/v1/orders/search/location?q=delhi` | Search by city/state/country |
| GET | `/api/v1/orders/search/date?q=2025-01` | Search by date |
| GET | `/api/v1/orders/search/tracking?q=ORD001` | Search by order ID/tracking |
| GET | `/api/v1/orders/search/fuzzy?q=headfone` | Fuzzy search |
| GET | `/api/v1/orders/search/autocomplete?q=iph` | Autocomplete suggestions |
| GET | `/api/v1/orders/search/highlight?q=mouse` | Search with highlight tags |
| GET | `/api/v1/orders/search/paged?q=phone&page=1` | Paginated search |
| GET | `/api/v1/orders/search/recent` | Get recent searches |
| GET | `/api/v1/orders/search/popular` | Get popular searches |

---

### 🔽 Filter (`/api/v1/orders/filter`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/orders/filter/status?type=Pending` | Filter by order status |
| GET | `/api/v1/orders/filter/payment?method=Card` | Filter by payment method |
| GET | `/api/v1/orders/filter/category?name=Electronics` | Filter by category |
| GET | `/api/v1/orders/filter/brand?name=Apple` | Filter by brand |
| GET | `/api/v1/orders/filter/price?min=100&max=1000` | Filter by price range |
| GET | `/api/v1/orders/filter/date?start=2025-01-01&end=2025-02-01` | Filter by date range |
| GET | `/api/v1/orders/filter/country?name=India` | Filter by country |
| GET | `/api/v1/orders/filter/state?name=Gujarat` | Filter by state |
| GET | `/api/v1/orders/filter/city?name=Surat` | Filter by city |
| GET | `/api/v1/orders/filter/high-value?amount=1000` | Filter high-value orders |
| GET | `/api/v1/orders/filter/discounted` | Filter discounted orders |
| GET | `/api/v1/orders/filter/cancelled` | Filter cancelled orders |
| GET | `/api/v1/orders/filter/refunded` | Filter refunded orders |
| GET | `/api/v1/orders/filter/shipped` | Filter shipped orders |
| GET | `/api/v1/orders/filter/delivered` | Filter delivered orders |

---

### 🔃 Sort (`/api/v1/orders/sort`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/orders/sort?sort=amount` | Sort by amount (asc) |
| GET | `/api/v1/orders/sort?sort=-amount` | Sort by amount (desc) |
| GET | `/api/v1/orders/sort?sort=date` | Sort by date (oldest first) |
| GET | `/api/v1/orders/sort?sort=-date` | Sort by date (newest first) |
| GET | `/api/v1/orders/sort?sort=status` | Sort by status |
| GET | `/api/v1/orders/sort?sort=customer` | Sort by customer name |
| GET | `/api/v1/orders/sort?sort=city` | Sort by city |
| GET | `/api/v1/orders/sort?sort=payment` | Sort by payment method |
| GET | `/api/v1/orders/sort/highest-value` | Orders by highest value |
| GET | `/api/v1/orders/sort/lowest-value` | Orders by lowest value |
| GET | `/api/v1/orders/sort/latest` | Latest orders first |
| GET | `/api/v1/orders/sort/oldest` | Oldest orders first |
| GET | `/api/v1/orders/sort/most-items` | Orders with most items |
| GET | `/api/v1/orders/sort/least-items` | Orders with least items |
| GET | `/api/v1/orders/sort/discount` | Orders sorted by discount |

---

### 📄 Pagination (`/api/v1/orders`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/orders/paged?page=1&limit=50` | Paginated order listing |
| GET | `/api/v1/orders/infinite?page=1` | Infinite scroll pagination |
| GET | `/api/v1/orders/recent?page=1&limit=5` | Recent orders (paginated) |
| GET | `/api/v1/orders/cancelled?page=1&limit=10` | Cancelled orders (paginated) |
| GET | `/api/v1/orders/refunded?page=1&limit=10` | Refunded orders (paginated) |
| GET | `/api/v1/orders/customer/:customerId` | Orders by customer (paginated) |
| GET | `/api/v1/orders/product/:productId` | Orders by product (paginated) |

---

### ⚠️ Error Simulation (`/api/v1/errors`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/errors/not-found` | Simulate 404 error |
| GET | `/api/v1/errors/server-error` | Simulate internal server error |
| GET | `/api/v1/errors/database` | Simulate database error |
| GET | `/api/v1/errors/validation` | Simulate validation failure |
| GET | `/api/v1/errors/rate-limit` | Simulate rate limit error |
| GET | `/api/v1/errors/token-expired` | Simulate expired token |
| GET | `/api/v1/errors/payment-failed` | Simulate payment failure |
| GET | `/api/v1/errors/shipping-failed` | Simulate shipping failure |
| GET | `/api/v1/errors/upload-error` | Simulate upload error |
| GET | `/api/v1/errors/cache-error` | Simulate cache failure |

---

### 🛡️ Request Validation (`/api/v1/validate`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/validate/order` | Validate order payload |
| PATCH | `/api/v1/validate/order/:id` | Validate order update |
| POST | `/api/v1/validate/payment` | Validate payment details |
| POST | `/api/v1/validate/address` | Validate shipping address |
| POST | `/api/v1/validate/auth/register` | Validate registration data |
| POST | `/api/v1/validate/auth/login` | Validate login credentials |
| POST | `/api/v1/validate/product` | Validate product payload |
| POST | `/api/v1/validate/refund` | Validate refund request |
| POST | `/api/v1/validate/coupon` | Validate coupon code |
| POST | `/api/v1/validate/upload` | Validate uploaded file |

---

### 🧠 Recommendations & Analytics (`/api/v1/recommendations`, `/api/v1/trending`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/recommendations/products/:customerId` | Recommend products to customer |
| GET | `/api/v1/recommendations/orders/:orderId` | Recommend similar products |
| GET | `/api/v1/trending/products` | Fetch trending products |
| GET | `/api/v1/trending/categories` | Fetch trending categories |

---

### 🔔 Notifications & Activity Logs (`/api/v1/notifications`, `/api/v1/activity`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/notifications` | Fetch notifications list |
| PATCH | `/api/v1/notifications/read/:id` | Mark notification as read |
| DELETE | `/api/v1/notifications/:id` | Delete notification |
| GET | `/api/v1/activity/logs` | Fetch user and admin activity logs |

---

### 📊 Dashboards & Analytics (`/api/v1/dashboard`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dashboard/overview` | Dashboard analytics overview |
| GET | `/api/v1/dashboard/revenue` | Revenue metrics, splits, and trends |
| GET | `/api/v1/dashboard/orders` | Orders status breakdown and volume trend |
| GET | `/api/v1/dashboard/customers` | Top spenders and geolocation customer splits |
| GET | `/api/v1/dashboard/products` | Top selling products and category shares |

---

### ⚙️ System Status & Health (`/api/v1/system`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/system/version` | Fetch API version details |
| GET | `/api/v1/system/config` | Fetch public system configuration |
| GET | `/api/v1/system/uptime` | Fetch server uptime duration |
| GET | `/api/v1/system/ping` | Ping API server (pong) |
| GET | `/api/v1/system/status/database` | Database connection health and latency |
| GET | `/api/v1/system/status/cache` | Cache service health |
| GET | `/api/v1/system/status/storage` | Storage service write permissions and health |

---

### 📡 HTTP Metadata & Capabilities (HEAD & OPTIONS)

| Method | Endpoint | Description |
|--------|----------|-------------|
| HEAD | `/api/v1/orders` | Fetch only headers for orders collection |
| HEAD | `/api/v1/orders/:orderId` | Fetch headers for single order resource |
| HEAD | `/api/v1/orders/:orderId/items` | Fetch headers for order items resource |
| HEAD | `/api/v1/orders/search` | Fetch metadata for search results |
| HEAD | `/api/v1/orders/filter/delivered` | Fetch headers for delivered orders |
| HEAD | `/api/v1/shipping/pending` | Fetch headers for pending shipments |
| HEAD | `/api/v1/shipping/tracking/:orderId` | Fetch shipment tracking headers |
| HEAD | `/api/v1/analytics/revenue/total` | Fetch revenue analytics metadata |
| HEAD | `/api/v1/stats/orders/total` | Fetch order statistics headers |
| HEAD | `/api/v1/admin/users` | Fetch admin users route headers |
| HEAD | `/api/v1/admin/orders` | Fetch admin orders route headers |
| HEAD | `/api/v1/dashboard/overview` | Fetch dashboard metadata |
| HEAD | `/api/v1/system/uptime` | Fetch server uptime headers |
| HEAD | `/api/v1/system/status/database` | Fetch database health headers |
| HEAD | `/api/v1/system/status/cache` | Fetch cache health headers |
| HEAD | `/api/v1/system/status/storage` | Fetch storage service headers |
| HEAD | `/api/v1/auth/profile` | Fetch authenticated profile headers |
| HEAD | `/api/v1/notifications` | Fetch notifications headers |
| HEAD | `/api/v1/activity/logs` | Fetch activity logs metadata |
| HEAD | `/api/v1/system/ping` | Check API availability headers only |
| OPTIONS | `/api/v1/orders` | List supported methods for orders route |
| OPTIONS | `/api/v1/orders/:orderId` | List allowed methods for single order route |
| OPTIONS | `/api/v1/orders/search` | Fetch supported search route methods |
| OPTIONS | `/api/v1/orders/filter/status` | Fetch supported filtering methods |
| OPTIONS | `/api/v1/shipping/tracking/:orderId` | Fetch shipment route communication options |
| OPTIONS | `/api/v1/shipping/create-label` | Fetch supported shipping label methods |
| OPTIONS | `/api/v1/auth/login` | Fetch authentication route methods |
| OPTIONS | `/api/v1/auth/register` | Fetch registration route methods |
| OPTIONS | `/api/v1/admin/users` | Fetch admin user route methods |
| OPTIONS | `/api/v1/admin/orders` | Fetch admin order route methods |
| OPTIONS | `/api/v1/admin/system/health` | Fetch admin system route methods |
| OPTIONS | `/api/v1/analytics/revenue/total` | Fetch analytics route methods |
| OPTIONS | `/api/v1/dashboard/overview` | Fetch dashboard communication options |
| OPTIONS | `/api/v1/notifications` | Fetch notification route methods |
| OPTIONS | `/api/v1/system/version` | Fetch API version route methods |
| OPTIONS | `/api/v1/system/status/database` | Fetch database health route methods |
| OPTIONS | `/api/v1/system/status/cache` | Fetch cache health route methods |
| OPTIONS | `/api/v1/system/status/storage` | Fetch storage service route methods |
| OPTIONS | `/api/v1/validate/order` | Fetch validation endpoint methods |
| OPTIONS | `/api/v1/errors/not-found` | Fetch supported error simulation methods |

---

## 🗃️ MongoDB Schema Design

### Collection: `orders` (model: `Order`)

```js
{
  OrderID:       String  (required, unique),
  OrderDate:     String,
  CustomerID:    String,
  CustomerName:  String  (required),
  ProductID:     String,
  ProductName:   String  (required),
  Category:      String,
  Brand:         String,
  Quantity:      String,
  UnitPrice:     String,
  Discount:      String,
  Tax:           String,
  ShippingCost:  String,
  TotalAmount:   String  (required),
  PaymentMethod: String,
  OrderStatus:   String  (default: 'Pending'),
  City:          String,
  State:         String,
  Country:       String,
  SellerID:      String,
  isArchived:    Boolean (default: false),
  createdAt:     Date    (auto - timestamps),
  updatedAt:     Date    (auto - timestamps)
}
```

### Collection: `searchqueries` (model: `SearchQuery`)

```js
{
  query:          String (required, unique),
  count:          Number (default: 1),
  lastSearchedAt: Date   (default: now)
}
```

---

## ✅ Backend Checklist Audit

### ✅ Implemented Features

| # | Feature | Status | Where |
|---|---------|--------|-------|
| 0 | Dataset understood & mapped to MongoDB | ✅ | `models/Order.js` |
| 1 | Node.js project initialized | ✅ | `package.json` |
| 1 | Express.js installed & configured | ✅ | `index.js` |
| 1 | MongoDB (Mongoose) connected | ✅ | `index.js` |
| 1 | Basic server setup | ✅ | `index.js` |
| 1 | Clean folder structure (routes, controllers, models, middleware, config) | ✅ | Project root |
| 1 | Environment variables configured | ✅ | `.env` + `dotenv` |
| 3 | MongoDB connected successfully | ✅ | `index.js` |
| 3 | Error handling for DB connection | ✅ | `index.js` (`.catch`) |
| 4 | Schema for all dataset entities | ✅ | `models/Order.js`, `models/SearchQuery.js` |
| 4 | Field validation (required, type, unique) | ✅ | `models/Order.js` |
| 4 | Timestamp tracking (createdAt, updatedAt) | ✅ | `models/Order.js` (`timestamps: true`) |
| 4 | Soft delete / Archive flag (`isArchived`) | ✅ | `models/Order.js` |
| 5 | Create API (POST) | ✅ | `orderController.js` |
| 5 | Read All API (GET) | ✅ | `orderController.js` |
| 5 | Read Single API (GET /:id) | ✅ | `orderController.js` |
| 5 | Update API – full replace (PUT) | ✅ | `orderController.js` |
| 5 | Update API – partial (PATCH) | ✅ | `orderController.js` |
| 5 | Delete API | ✅ | `orderController.js` |
| 6 | Filtering by multiple conditions | ✅ | `filterController.js` |
| 6 | MongoDB operators ($gte, $lte, $expr, etc.) | ✅ | `filterController.js` |
| 6 | Pagination system | ✅ | `paginationController.js` |
| 6 | Sorting functionality | ✅ | `sortingController.js` |
| 6 | Search functionality | ✅ | `searchController.js` |
| 6 | Advanced search using Regex (case-insensitive) | ✅ | `searchController.js`, `filterController.js` |
| 6 | Fuzzy search | ✅ | `searchController.js` |
| 7 | RESTful API structure | ✅ | All routes files |
| 7 | Route parameters (`/:id`) | ✅ | `orderRoutes.js` |
| 7 | Query parameters (`?page=1`) | ✅ | All controllers |
| 7 | API Versioning (`/api/v1/`) | ✅ | `index.js` |
| 8 | Async/Await used properly | ✅ | All controllers |
| 8 | Error handling in async flow | ✅ | Try/catch in all controllers |
| 9 | Express server configured | ✅ | `index.js` |
| 9 | REST API implemented | ✅ | All routes |
| 10 | Custom Request Logging Middleware | ✅ | `index.js` (inline middleware) |
| 10 | Middleware chaining | ✅ | `index.js` |
| 11 | CORS enabled | ✅ | `index.js` (`cors()`) |
| 12 | MVC architecture – Models | ✅ | `models/` |
| 12 | MVC architecture – Controllers | ✅ | `controllers/` |
| 12 | Routes (Router layer) | ✅ | `routes/` |
| 14 | Try-catch in all async functions | ✅ | All controllers |
| 14 | Consistent JSON error responses | ✅ | All controllers |
| 18 | README created | ✅ | This file |
| 18 | Folder structure explained | ✅ | Above |
| 18 | API endpoints documented | ✅ | Above |
| 19 | Request Logging Middleware | ✅ | `index.js` |
| 19 | Timestamp Tracking | ✅ | `models/Order.js` |
| 19 | Advanced Search with Regex | ✅ | `searchController.js` |
| 19 | Database Seeding Script | ✅ | `seed.js` |
| 19 | Reusable Pagination Utility | ✅ | `paginationController.js` (`paginate()`) |
| 19 | Dynamic Filtering | ✅ | `filterController.js` |
| 19 | API Versioning (`/api/v1`) | ✅ | `index.js` |
| 19 | Soft Delete Feature (`isArchived`) | ✅ | `orderController.js` |

---

## 📊 Project Completion Summary

| Category | Done | Total | % |
|----------|------|-------|---|
| Project Setup | 6 | 6 | 100% |
| MongoDB Schema | 6 | 6 | 100% |
| CRUD Operations | 6 | 6 | 100% |
| Advanced Querying | 6 | 6 | 100% |
| API Routing | 5 | 5 | 100% |
| Middleware | 5 | 5 | 100% |
| Authentication (JWT) | 5 | 5 | 100% |
| Error Handling | 4 | 4 | 100% |
| Aggregation | 6 | 6 | 100% |
| MVC Architecture | 3 | 3 | 100% |
| Good-to-Have (19) | 20 | 20 | 100% |

> **Overall Backend Completion: 100%**


## 👨‍💻 Author

Amazon Orders Full Stack Project — Backend Development Phase  
**Timeline:** 13 May 2026 – 28 May 2026