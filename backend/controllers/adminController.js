const os      = require('os');
const User    = require('../models/User');
const Order   = require('../models/Order');

// ─── In-memory state (resets on server restart) ────────────────────────────
// Maintenance mode flag shared with the app
let maintenanceMode = false;
let maintenanceMessage = 'System is under maintenance. Please check back later.';
let maintenanceSince   = null;

// In-memory cache store (simple key-value)
const appCache = {};

// In-memory server log buffer (reused from stats performance log concept)
const serverLogs = [];
const MAX_LOGS   = 500;

// Expose so index.js can append logs via middleware
exports.appendLog = (entry) => {
  serverLogs.push({ ...entry, ts: new Date().toISOString() });
  if (serverLogs.length > MAX_LOGS) serverLogs.shift();
};

exports.getMaintenanceMode = () => maintenanceMode;
exports.getMaintenanceMessage = () => maintenanceMessage;

// ─── Helper: safe User shape (no sensitive fields) ────────────────────────
const safeUser = (u) => ({
  id:              u._id,
  name:            u.name,
  email:           u.email,
  role:            u.role,
  isActive:        u.isActive,
  isEmailVerified: u.isEmailVerified,
  sessionCount:    u.sessions?.length || 0,
  createdAt:       u.createdAt,
  updatedAt:       u.updatedAt
});

// ─── Helper: TotalAmount to number ────────────────────────────────────────
const toDoubleExpr = { $toDouble: { $ifNull: ['$TotalAmount', '0'] } };

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/admin/users
// Fetch all registered users with pagination + optional search
// ══════════════════════════════════════════════════════════════════════════════
exports.getAllUsers = async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 20;
    const skip   = (page - 1) * limit;
    const search = req.query.search || '';
    const role   = req.query.role   || '';

    const query = {};
    if (search) {
      query.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;

    const [users, total] = await Promise.all([
      User.find(query).select('-password -otp -otpExpiry -resetToken -resetTokenExpiry -refreshToken -emailVerifyToken')
        .skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      count:   users.length,
      total,
      page,
      pages:   Math.ceil(total / limit),
      data:    users.map(safeUser)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/admin/users/:id
// Fetch a specific user by MongoDB _id
// ══════════════════════════════════════════════════════════════════════════════
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -otp -otpExpiry -resetToken -resetTokenExpiry -refreshToken -emailVerifyToken');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'User fetched successfully',
      data:    safeUser(user)
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/v1/admin/users/:id/ban
// Ban a user — sets isActive: false and clears all sessions
// ══════════════════════════════════════════════════════════════════════════════
exports.banUser = async (req, res) => {
  try {
    // Prevent admin from banning themselves
    if (req.params.id === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot ban your own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.isActive) {
      return res.status(400).json({ success: false, message: 'User is already banned' });
    }

    user.isActive     = false;
    user.sessions     = [];
    user.refreshToken = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: `User "${user.name}" has been banned successfully`,
      data:    safeUser(user)
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/v1/admin/users/:id/unban
// Unban a user — restores isActive: true
// ══════════════════════════════════════════════════════════════════════════════
exports.unbanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.isActive) {
      return res.status(400).json({ success: false, message: 'User is not banned' });
    }

    user.isActive = true;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: `User "${user.name}" has been unbanned successfully`,
      data:    safeUser(user)
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/v1/admin/users/:id/role
// Change a user's role
// Body: { role: "user" | "admin" }
// ══════════════════════════════════════════════════════════════════════════════
exports.changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['user', 'admin'];

    if (!role) {
      return res.status(400).json({ success: false, message: 'role is required', validRoles });
    }

    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `Invalid role "${role}"`, validRoles });
    }

    if (req.params.id === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const previousRole = user.role;
    user.role = role;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: `User role changed from "${previousRole}" to "${role}" successfully`,
      data:    safeUser(user)
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/admin/orders
// Fetch all orders — with pagination, status filter, date range
// ══════════════════════════════════════════════════════════════════════════════
exports.getAllOrders = async (req, res) => {
  try {
    const page   = parseInt(req.query.page)   || 1;
    const limit  = parseInt(req.query.limit)  || 20;
    const skip   = (page - 1) * limit;
    const status = req.query.status || '';
    const search = req.query.search || '';

    const query = {};
    if (status) query.OrderStatus = { $regex: status, $options: 'i' };
    if (search) {
      query.$or = [
        { OrderID:      { $regex: search, $options: 'i' } },
        { CustomerName: { $regex: search, $options: 'i' } },
        { ProductName:  { $regex: search, $options: 'i' } }
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Order.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      message: 'Orders fetched successfully',
      count:   orders.length,
      total,
      page,
      pages:   Math.ceil(total / limit),
      data:    orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/admin/reports/sales
// Sales report — orders count and value grouped by status + date trends
// ══════════════════════════════════════════════════════════════════════════════
exports.getSalesReport = async (req, res) => {
  try {
    const [byStatus, byMonth, topProducts, summary] = await Promise.all([
      // Orders broken down by status
      Order.aggregate([
        { $group: { _id: '$OrderStatus', count: { $sum: 1 }, totalValue: { $sum: toDoubleExpr } } },
        { $project: { _id: 0, status: '$_id', count: 1, totalValue: { $round: ['$totalValue', 2] } } },
        { $sort: { count: -1 } }
      ]),

      // Monthly sales trend
      Order.aggregate([
        { $addFields: { parsedDate: { $dateFromString: { dateString: '$OrderDate', onError: null, onNull: null } } } },
        { $match: { parsedDate: { $ne: null } } },
        { $group: { _id: { year: { $year: '$parsedDate' }, month: { $month: '$parsedDate' } }, count: { $sum: 1 }, revenue: { $sum: toDoubleExpr } } },
        { $project: { _id: 0, year: '$_id.year', month: '$_id.month', monthLabel: { $arrayElemAt: [['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], '$_id.month'] }, count: 1, revenue: { $round: ['$revenue', 2] } } },
        { $sort: { year: 1, month: 1 } }
      ]),

      // Top 5 selling products by order count
      Order.aggregate([
        { $group: { _id: '$ProductName', orderCount: { $sum: 1 }, totalRevenue: { $sum: toDoubleExpr } } },
        { $project: { _id: 0, product: '$_id', orderCount: 1, totalRevenue: { $round: ['$totalRevenue', 2] } } },
        { $sort: { orderCount: -1 } },
        { $limit: 5 }
      ]),

      // Overall summary
      Order.aggregate([
        { $group: { _id: null, totalOrders: { $sum: 1 }, totalRevenue: { $sum: toDoubleExpr }, avgOrderValue: { $avg: toDoubleExpr } } },
        { $project: { _id: 0, totalOrders: 1, totalRevenue: { $round: ['$totalRevenue', 2] }, avgOrderValue: { $round: ['$avgOrderValue', 2] } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      message: 'Sales report generated successfully',
      data: {
        summary:     summary[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 },
        byStatus,
        monthlyTrend: byMonth,
        topProducts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/admin/reports/revenue
// Revenue report — total, daily, monthly, yearly + category breakdown
// ══════════════════════════════════════════════════════════════════════════════
exports.getRevenueReport = async (req, res) => {
  try {
    const [overall, byCategory, byPayment, yearlyTrend] = await Promise.all([
      Order.aggregate([
        { $group: { _id: null, totalRevenue: { $sum: toDoubleExpr }, totalOrders: { $sum: 1 }, avgOrder: { $avg: toDoubleExpr }, minOrder: { $min: toDoubleExpr }, maxOrder: { $max: toDoubleExpr } } },
        { $project: { _id: 0, totalRevenue: { $round: ['$totalRevenue', 2] }, totalOrders: 1, avgOrder: { $round: ['$avgOrder', 2] }, minOrder: { $round: ['$minOrder', 2] }, maxOrder: { $round: ['$maxOrder', 2] } } }
      ]),

      Order.aggregate([
        { $match: { Category: { $exists: true, $ne: null, $ne: '' } } },
        { $group: { _id: '$Category', revenue: { $sum: toDoubleExpr }, orderCount: { $sum: 1 } } },
        { $project: { _id: 0, category: '$_id', revenue: { $round: ['$revenue', 2] }, orderCount: 1 } },
        { $sort: { revenue: -1 } },
        { $limit: 10 }
      ]),

      Order.aggregate([
        { $match: { PaymentMethod: { $exists: true, $ne: null, $ne: '' } } },
        { $group: { _id: '$PaymentMethod', revenue: { $sum: toDoubleExpr }, count: { $sum: 1 } } },
        { $project: { _id: 0, method: '$_id', revenue: { $round: ['$revenue', 2] }, count: 1 } },
        { $sort: { revenue: -1 } }
      ]),

      Order.aggregate([
        { $addFields: { parsedDate: { $dateFromString: { dateString: '$OrderDate', onError: null, onNull: null } } } },
        { $match: { parsedDate: { $ne: null } } },
        { $group: { _id: { $year: '$parsedDate' }, revenue: { $sum: toDoubleExpr }, orderCount: { $sum: 1 } } },
        { $project: { _id: 0, year: '$_id', revenue: { $round: ['$revenue', 2] }, orderCount: 1 } },
        { $sort: { year: 1 } }
      ])
    ]);

    res.status(200).json({
      success: true,
      message: 'Revenue report generated successfully',
      data: {
        overall:         overall[0] || { totalRevenue: 0, totalOrders: 0, avgOrder: 0 },
        byCategory,
        byPaymentMethod: byPayment,
        yearlyTrend
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/v1/admin/cache/clear
// Clear the in-memory application cache
// ══════════════════════════════════════════════════════════════════════════════
exports.clearCache = (req, res) => {
  try {
    const keysBefore = Object.keys(appCache).length;
    Object.keys(appCache).forEach(k => delete appCache[k]);

    res.status(200).json({
      success: true,
      message: 'Application cache cleared successfully',
      data: {
        keysCleared: keysBefore,
        clearedAt:   new Date().toISOString(),
        clearedBy:   req.user.email
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/admin/system/health
// System health check — DB status, memory, uptime, process info
// ══════════════════════════════════════════════════════════════════════════════
exports.getSystemHealth = async (req, res) => {
  try {
    const mongoose = require('mongoose');

    // DB connection state: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    const dbStateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    const dbState    = dbStateMap[mongoose.connection.readyState] || 'unknown';

    // Ping DB
    let dbPingMs = null;
    try {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      dbPingMs = Date.now() - start;
    } catch { dbPingMs = -1; }

    const memUsage  = process.memoryUsage();
    const totalMem  = os.totalmem();
    const freeMem   = os.freemem();
    const usedMem   = totalMem - freeMem;
    const uptimeSec = process.uptime();

    const toMB = (bytes) => parseFloat((bytes / 1024 / 1024).toFixed(2));

    const status = dbState === 'connected' ? 'healthy' : 'degraded';

    res.status(200).json({
      success: true,
      message: 'System health check completed',
      data: {
        status,
        timestamp: new Date().toISOString(),
        database: {
          state:   dbState,
          pingMs:  dbPingMs,
          healthy: dbState === 'connected'
        },
        server: {
          uptime:    `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m ${Math.floor(uptimeSec % 60)}s`,
          uptimeSec: Math.floor(uptimeSec),
          nodeVersion: process.version,
          platform:  process.platform,
          pid:       process.pid
        },
        memory: {
          processHeapUsedMB:  toMB(memUsage.heapUsed),
          processHeapTotalMB: toMB(memUsage.heapTotal),
          processRssMB:       toMB(memUsage.rss),
          systemTotalMB:      toMB(totalMem),
          systemUsedMB:       toMB(usedMem),
          systemFreeMB:       toMB(freeMem),
          usagePercent:       parseFloat(((usedMem / totalMem) * 100).toFixed(2))
        },
        cpu: {
          model:   os.cpus()[0]?.model || 'Unknown',
          cores:   os.cpus().length,
          loadAvg: os.loadavg()
        },
        maintenance: {
          enabled: maintenanceMode,
          message: maintenanceMode ? maintenanceMessage : null,
          since:   maintenanceSince
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/admin/system/logs
// Fetch recent server request logs
// Query: ?limit=100&level=error
// ══════════════════════════════════════════════════════════════════════════════
exports.getServerLogs = (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit) || 100, MAX_LOGS);
    const level  = req.query.level || ''; // 'error' | 'success' | ''

    let logs = serverLogs.slice().reverse(); // newest first

    if (level === 'error') {
      logs = logs.filter(l => l.statusCode >= 400);
    } else if (level === 'success') {
      logs = logs.filter(l => l.statusCode < 400);
    }

    const result = logs.slice(0, limit);

    res.status(200).json({
      success: true,
      message: 'Server logs fetched successfully',
      total:   serverLogs.length,
      count:   result.length,
      data:    result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/v1/admin/system/maintenance
// Toggle maintenance mode on/off
// Body: { enable: true/false, message?: "..." }
// ══════════════════════════════════════════════════════════════════════════════
exports.toggleMaintenance = (req, res) => {
  try {
    const { enable, message } = req.body;

    if (typeof enable !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'enable (boolean) is required in request body'
      });
    }

    maintenanceMode    = enable;
    maintenanceSince   = enable ? new Date().toISOString() : null;
    if (message) maintenanceMessage = message;

    res.status(200).json({
      success: true,
      message: enable
        ? `Maintenance mode ENABLED by ${req.user.email}`
        : `Maintenance mode DISABLED by ${req.user.email}`,
      data: {
        maintenanceMode,
        message: maintenanceMode ? maintenanceMessage : null,
        since:   maintenanceSince,
        updatedBy: req.user.email,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/admin/backups
// Fetch list of database backups (simulated — no actual backup engine)
// In production: integrate with mongodump / Atlas snapshots / S3
// ══════════════════════════════════════════════════════════════════════════════
exports.getBackups = async (req, res) => {
  try {
    // Simulate backup metadata — in production replace with real backup service calls
    const now = new Date();
    const backups = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      return {
        backupId:    `BKP-${date.toISOString().split('T')[0]}-${(i + 1).toString().padStart(3, '0')}`,
        type:        i === 0 ? 'daily' : i % 7 === 0 ? 'weekly' : 'daily',
        status:      'completed',
        sizeKB:      Math.floor(Math.random() * 50000 + 10000),
        createdAt:   date.toISOString(),
        retentionDays: i < 7 ? 7 : 30,
        storage:     'local',
        note:        'Simulated backup record. Integrate mongodump or Atlas for real backups.'
      };
    });

    // Get current DB stats for context
    const mongoose = require('mongoose');
    let dbStats = {};
    try {
      dbStats = await mongoose.connection.db.stats();
    } catch { /* ignore if stats fail */ }

    res.status(200).json({
      success: true,
      message: 'Backup list fetched successfully',
      note:    'Showing simulated backup records. Connect a real backup service for production use.',
      count:   backups.length,
      database: {
        name:        mongoose.connection.name || 'unknown',
        collections: dbStats.collections || 'N/A',
        dataSizeMB:  dbStats.dataSize ? parseFloat((dbStats.dataSize / 1024 / 1024).toFixed(2)) : 'N/A'
      },
      data: backups
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
