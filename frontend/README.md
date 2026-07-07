# Amazon Orders — Full Stack Dashboard

A production-ready **Admin + User Dashboard** built with React 19 (Vite), Redux Toolkit, Tailwind CSS v4, and MUI. Fully integrated with a MongoDB + Express backend using JWT authentication.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 + custom design system |
| UI Components | MUI v9 (icons + components) |
| State Management | Redux Toolkit (4 slices) |
| Routing | React Router v7 (lazy-loaded) |
| API Layer | Axios (JWT interceptors + token refresh + retry) |
| Forms | Formik + Yup |
| Notifications | react-hot-toast |
| SEO | react-helmet-async + JSON-LD schema |
| Auth | JWT (access + refresh token) |

---

## 📁 Folder Structure

```
frontend/src/
├── assets/            # Static assets
├── components/        # Reusable components
│   ├── AppThemeProvider.jsx   # Light/dark theme switcher
│   ├── DashboardLayout.jsx    # Sidebar + navbar shell
│   ├── ErrorBoundary.jsx      # Global React error boundary
│   └── ProtectedRoute.jsx     # JWT + role-based route guard
├── features/          # Redux Toolkit slices
│   ├── authSlice.js           # Login, register, logout, profile
│   ├── dataSlice.js           # Orders CRUD + bulk operations
│   ├── uiSlice.js             # Theme, sidebar open state
│   └── userSlice.js           # Admin user management
├── hooks/             # Custom React hooks
│   ├── useDebounce.js         # Debounced value hook
│   └── useLocalStorage.js     # Typed localStorage hook
├── pages/             # Route-level page components (lazy loaded)
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── DashboardOverview.jsx  # Admin: server monitoring, KPIs
│   ├── Orders.jsx             # Full CRUD + bulk actions
│   ├── Analytics.jsx          # SVG charts from aggregation APIs
│   ├── Users.jsx              # Admin: ban/unban, role toggle
│   ├── Profile.jsx            # Session management
│   ├── Settings.jsx           # Theme toggle + cache reset
│   └── NotFound.jsx           # 404 page
├── services/
│   └── api.js                 # Axios instance + interceptors + retry
├── store/
│   └── store.js               # Redux store configuration
├── App.jsx                    # Routes definition
├── main.jsx                   # App entry (Provider + ErrorBoundary)
└── index.css                  # Global design system (tokens, animations)
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js >= 18
- Backend server running on `http://localhost:5000`

### Steps

```bash
# 1. Navigate to frontend
cd "amazon orders/frontend"

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
# → App available at http://localhost:3000

# 4. Build for production
npm run build

# 5. Preview production build
npm run preview
```

---

## 🔐 Authentication Flow

1. User registers → JWT access + refresh tokens stored in `localStorage`
2. Every API request automatically attaches `Authorization: Bearer <token>`
3. On 401 → Axios interceptor auto-refreshes the token silently
4. On refresh failure → User redirected to `/login?expired=true`
5. Logout clears all tokens + Redux state

---

## 👥 Role-Based Access

| Route | Admin | User |
|-------|-------|------|
| `/` (Overview) | ✅ Full panel | ✅ Simplified view |
| `/orders` | ✅ Full CRUD | ❌ Redirected to `/` |
| `/users` | ✅ Ban/Role control | ❌ Redirected to `/` |
| `/analytics` | ✅ All charts | ❌ Redirected to `/` |
| `/profile` | ✅ | ✅ |
| `/settings` | ✅ | ✅ |

---

## 📊 Dashboard Features

### Orders Page
- Paginated table (configurable page size)
- Search by OrderID / Customer / Product / Brand
- Filter by Status, Payment Method, Category
- Sort by any column (asc/desc)
- Bulk operations: status update, archive, restore, delete
- Full CRUD: Create / Edit / Delete / View modals

### Analytics Page
- Monthly Revenue trend (smooth Bezier SVG area chart)
- Payment Distribution (interactive doughnut chart)
- Top Categories by Revenue (animated bar chart)
- Top Cities by Revenue (column chart with hover tooltips)
- KPI ring charts: Return Rate, Cancellation Rate, Discount Usage
- Top Spenders table with CLV data

### Users Page (Admin)
- Paginated user list with gradient avatars
- Ban / Unban accounts
- Promote / Demote admin role
- Search by name or email, filter by role

---

## 🎨 Design System

Custom design tokens in `index.css`:
- Color palette: deep navy `#090d1a`, amber `#f59e0b`, emerald `#10b981`
- 15+ CSS animations: slide-up, pulse-glow, shimmer, float
- Utility classes: `premium-card`, `glass-card`, `btn-amber`, `input-dark`, `badge-*`
- Inter font (Google Fonts)

---

## 🛡️ Error Handling

- **Global ErrorBoundary** — catches React render errors
- **API interceptors** — handles 401, 500, network errors
- **Toast notifications** — success / error / warning / loading
- **Skeleton loaders** — all data-fetching states
- **Empty state UI** — no-data screens
- **Error state UI** — API failure screens with retry buttons

---

## 📦 Storage Strategy

| Storage | Used For |
|---------|---------|
| `localStorage` | `accessToken`, `refreshToken`, `user`, `themeMode` |
| `sessionStorage` | `orderFormProgress` (save draft order form) |

---

## 🔍 SEO Implementation

- Dynamic page `<title>` and `<meta description>` via `react-helmet-async`
- Open Graph tags on all major pages
- JSON-LD structured data (`schema.org/WebPage`) on every route
- `sitemap.xml` in `/public`
- `robots.txt` in `/public`

---

## ✅ Checklist Compliance

- [x] Vite + React setup
- [x] Tailwind CSS v4 configured
- [x] MUI integrated
- [x] Axios + JWT interceptors
- [x] Redux Toolkit (4 slices)
- [x] React Router v7 (lazy loading + guards)
- [x] Full CRUD operations
- [x] Pagination + search + sort + filter
- [x] Formik + Yup forms
- [x] Light/Dark theme
- [x] Global error boundary
- [x] Toast notifications
- [x] Skeleton loaders + empty/error states
- [x] SEO (Helmet + OG + JSON-LD + sitemap)
- [x] ESLint configured
- [x] Prettier configured
- [x] Custom hooks (useDebounce, useLocalStorage)
- [x] 404 Not Found page
