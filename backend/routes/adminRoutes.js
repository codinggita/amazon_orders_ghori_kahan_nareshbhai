const express = require('express');
const router  = express.Router();

const {
  getAllUsers,
  getUserById,
  banUser,
  unbanUser,
  changeUserRole,
  getAllOrders,
  getSalesReport,
  getRevenueReport,
  clearCache,
  getSystemHealth,
  getServerLogs,
  toggleMaintenance,
  getBackups
} = require('../controllers/adminController');

const { protect, adminOnly } = require('../middleware/authMiddleware');

// All admin routes require a valid JWT AND admin role
router.use(protect, adminOnly);

// ─── User Management ──────────────────────────────────────────────────────────

// GET  /api/v1/admin/users               ?page=1&limit=20&search=&role=
router.get('/users', getAllUsers);

// GET  /api/v1/admin/users/:id
router.get('/users/:id', getUserById);

// PATCH /api/v1/admin/users/:id/ban
router.patch('/users/:id/ban', banUser);

// PATCH /api/v1/admin/users/:id/unban
router.patch('/users/:id/unban', unbanUser);

// PATCH /api/v1/admin/users/:id/role      body: { role }
router.patch('/users/:id/role', changeUserRole);

// ─── Orders (Admin View) ──────────────────────────────────────────────────────

// GET  /api/v1/admin/orders              ?page=1&limit=20&status=&search=
router.get('/orders', getAllOrders);

// ─── Reports ─────────────────────────────────────────────────────────────────

// GET  /api/v1/admin/reports/sales
router.get('/reports/sales', getSalesReport);

// GET  /api/v1/admin/reports/revenue
router.get('/reports/revenue', getRevenueReport);

// ─── Cache ────────────────────────────────────────────────────────────────────

// DELETE /api/v1/admin/cache/clear
router.delete('/cache/clear', clearCache);

// ─── System ───────────────────────────────────────────────────────────────────

// GET  /api/v1/admin/system/health
router.get('/system/health', getSystemHealth);

// GET  /api/v1/admin/system/logs         ?limit=100&level=error|success
router.get('/system/logs', getServerLogs);

// POST /api/v1/admin/system/maintenance  body: { enable: true/false, message? }
router.post('/system/maintenance', toggleMaintenance);

// ─── Backups ──────────────────────────────────────────────────────────────────

// GET  /api/v1/admin/backups
router.get('/backups', getBackups);

module.exports = router;
