# Amazon Orders Project

This repository contains the backend and frontend codebases for the Amazon Orders project.

## 🚀 Backend Overview

The backend is a robust RESTful API built to handle Amazon-like order management, including searching, filtering, and CRUD operations. 

### Technologies Used
* **Node.js** & **Express.js**: For the server framework and API routing.
* **MongoDB** & **Mongoose**: For the NoSQL database and schema modeling.
* **Cors**: To handle Cross-Origin requests from the frontend.
* **Morgan**: For HTTP request logging in the console.
* **Dotenv**: For environment variable management.
* **Nodemon**: For hot-reloading during development.

### Running the Backend
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Ensure you have a `.env` file with your `MONGODB_URI` and `PORT`.
4. Start the development server: `npm run dev`

---

## 📂 Folder Structure

```text
.
├── backend/                  # Node.js/Express Backend API
│   ├── config/               # Configuration files
│   ├── controllers/          # Route logic and request handlers (filter, order, search)
│   ├── middleware/           # Express middleware functions
│   ├── models/               # Mongoose database schemas (e.g., Order.js)
│   ├── routes/               # API endpoint route definitions
│   ├── .env                  # Environment variables (DB connection string, PORT)
│   ├── .gitignore            # Files ignored by git
│   ├── index.js              # Main application entry point & server setup
│   ├── package.json          # Backend dependencies and scripts
│   ├── seed.js               # Script to seed initial data into MongoDB
│   └── test_routes.js        # Script to verify and test API endpoint functionality
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.js
│   │   └── index.js
│   ├── .gitignore
│   └── package.json
└── README.md
```

## 🔌 API Endpoints
The backend provides the following core route prefixes:
- **`/api/v1/orders`** - Full CRUD operations for orders (Create, Read, Update, Delete)
- **`/api/v1/orders/search`** - Extensive search functionality (fuzzy, autocomplete, specific fields)
- **`/api/v1/orders/filter`** - Filtering functionality by price, date, status, payment method, etc.