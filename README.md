# 🛒 Amazon Orders – Full Stack Dashboard

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Redux](https://img.shields.io/badge/Redux_Toolkit-2.x-764ABC?style=for-the-badge&logo=redux&logoColor=white)](https://redux-toolkit.js.org/)

A production-ready, high-performance, full-stack Amazon-style order management dashboard. Built on a robust RESTful API backend and a premium glassmorphic frontend utilizing modern authorization flows including standard JWT credentials and Google One-Tap OAuth.

---

## ⚡ Quick Start

### Prerequisites
*   **Node.js** >= 18
*   **MongoDB** (running locally on port `27017` or using a MongoDB Atlas URI)
*   **Google Cloud Project** with configured OAuth 2.0 Web Application credentials

### 🚀 Running the Project

#### 1. Setup & Start Backend API
```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Create a `.env` file in the backend directory:
#   PORT=5000
#   MONGODB_URI=mongodb://localhost:27017/userdata
#   GOOGLE_CLIENT_ID=<your-google-client-id>
#   GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# Run the backend server
npm run dev
# → API live at http://localhost:5000
```

#### 2. Setup & Start Frontend Dashboard
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Create a `.env` file in the frontend directory:
#   VITE_GOOGLE_CLIENT_ID=<your-google-client-id>


# Run the frontend development server
npm run dev
# → Dashboard live at http://localhost:3000
```

---

## 📂 Project Architecture

```text
amazon-orders/
├── backend/                         # Node.js + Express REST API
│   ├── config/                      # MongoDB Connection Setup
│   ├── controllers/                 # MVC Controllers (Request handlers)
│   │   ├── authController.js        # Standard credential auth, verification, OTP
│   │   └── googleAuthController.js  # Google token validation & auto account link
│   ├── middleware/                  # Route guards (JWT verification, role filters)
│   ├── models/                      # Mongoose Database Schemas (User, Order)
│   ├── routes/                      # API endpoint mappings
│   └── index.js                     # Server entrypoint
│
└── frontend/                        # React Single Page App (Vite)
    ├── public/                      # Static assets (favicons, manifest)
    └── src/
        ├── components/              # UI elements & layout templates
        │   ├── GoogleAuthButton.jsx # Google One-Tap/Popup Login component
        │   └── DashboardLayout.jsx  # Glassmorphic shell with sidebar & header
        ├── features/                # Redux Toolkit Slices (auth, data, UI states)
        ├── pages/                   # Lazy-loaded route views
        └── main.jsx                 # App wrapper & GoogleOAuthProvider
```

---

## 🔌 API Endpoints (Base URL: `http://localhost:5000/api/v1`)

### 🔑 Authentication Services
| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Sign up locally (Name, Email, Password, Role) |
| `POST` | `/auth/login` | Public | Authenticate with local credentials and get JWTs |
| `POST` | `/auth/google` | Public | **Google OAuth Sign-In** with active verification |
| `POST` | `/auth/refresh-token` | Public | Exchange refresh tokens for new access tokens |
| `POST` | `/auth/logout` | 🔒 JWT | End active session and invalidate refresh tokens |
| `GET` | `/auth/profile` | 🔒 JWT | Retrieve current authenticated user profile |
| `PATCH` | `/auth/profile` | 🔒 JWT | Update current user's name |
| `POST` | `/auth/verify-email` | Public | Confirm registration email status |

### 📦 Order Management & Analytics
| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/orders` | 🔒 JWT | Retrieve all orders (supports filtering & pagination) |
| `POST` | `/orders` | 🔒 JWT | Add a new order manually |
| `PATCH` | `/orders/:id` | 🔒 JWT | Update status or details of a specific order |
| `DELETE` | `/orders/:id` | 🔒 JWT | Remove a single order records |
| `GET` | `/dashboard/overview` | 🔒 JWT | Retrieve KPI data (total orders, total revenue, average order value) |
| `GET` | `/analytics/revenue/monthly` | 🔒 JWT | Retrieve month-over-month revenue statistics |

---

## 🎨 Design System & Aesthetics

The frontend features a **premium glassmorphism** style built with Tailwind CSS v4 and MUI:
*   **Harmonious Dark Theme:** Deep slate and navy hues (`#090d1a`) contrast with vibrant amber elements (`#FF9900`).
*   **Ambient Glow Elements:** Custom blurred glass cards and backdrop-filter surfaces react cleanly to transitions.
*   **Tabular Numerics:** All numeric values, order IDs, and currencies scale with perfect mono alignment.
*   **Micro-Animations:** Fade-in, scale-in, slide-up, and spinning indicators give a live, responsive experience.

---

## 👥 Access Control Matrix

| System Route | Administrator (`admin` role) | Standard Client (`user` role) |
| :--- | :---: | :---: |
| **Dashboard KPIs & Global Metrics** | Full Access | Simplified Access |
| **Live Server Logs & Diagnostics** | Full Access | ❌ Access Denied |
| **Manage Registered Accounts** | Full Access | ❌ Access Denied |
| **Order Database CRUD Operations** | Full Access | ❌ Access Denied |
| **Profile Settings & Time Tracking** | Full Access | Full Access |

---

## 🛠️ Troubleshooting

#### 1. "Previous dashboard" displays instead of the new role views
Browser caching stores credentials in local storage to minimize database roundtrips. When a user's role is updated in the database, clear the browser cache to sync the role changes immediately:
```js
localStorage.clear(); location.reload();
```

#### 2. Duplicate React Instance warnings (React Hooks Error)
Ensure your package bundler resolves the React dependency tree down to a single instance. In `frontend/vite.config.js`:
```js
resolve: {
  dedupe: ['react', 'react-dom']
}
```

---

## 📅 Changelog

*   **May 2026:** Initial architecture release (Order CRUD, analytics, local auth).
*   **July 2026:** Google OAuth Popup & One-Tap Integration, automatic user-linking, auto-profile sync on mount, and enhanced glassmorphism layouts.

---

## 👨‍💻 Development
*   **Timeline:** 13 May 2026 – 7 July 2026
*   **Target Stack:** React 19, Vite 8, Express 5, MongoDB, Tailwind v4