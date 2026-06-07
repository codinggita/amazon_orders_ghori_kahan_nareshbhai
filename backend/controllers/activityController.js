// Mock activity logs store
const activityLogs = [
  { id: 'act-1', user: 'admin@example.com', role: 'admin', action: 'Banned User', details: 'Banned user John Doe (john@example.com)', ip: '192.168.1.50', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
  { id: 'act-2', user: 'seller@example.com', role: 'seller', action: 'Created Order Label', details: 'Generated shipping label for ORD-100234', ip: '192.168.1.102', timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
  { id: 'act-3', user: 'admin@example.com', role: 'admin', action: 'Cleared Cache', details: 'Cleared application memory cache (15 keys cleared)', ip: '192.168.1.50', timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
  { id: 'act-4', user: 'user@example.com', role: 'user', action: 'Login Success', details: 'Successfully logged in from Chrome/Windows', ip: '203.0.113.12', timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString() },
  { id: 'act-5', user: 'user@example.com', role: 'user', action: 'Update Profile', details: 'Changed delivery address state from CA to NY', ip: '203.0.113.12', timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString() }
];

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/activity/logs
// Fetch dashboard activity logs (supports filtering by user, role, and action)
// ══════════════════════════════════════════════════════════════════════════════
exports.getActivityLogs = (req, res) => {
  try {
    const { user, role, action, limit = 50 } = req.query;
    let filtered = [...activityLogs];

    if (user) {
      filtered = filtered.filter(log => log.user.toLowerCase().includes(user.toLowerCase()));
    }
    if (role) {
      filtered = filtered.filter(log => log.role.toLowerCase() === role.toLowerCase());
    }
    if (action) {
      filtered = filtered.filter(log => log.action.toLowerCase().includes(action.toLowerCase()));
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Slice limit
    const paginated = filtered.slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Activity logs fetched successfully',
      count: paginated.length,
      totalCount: filtered.length,
      data: paginated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
