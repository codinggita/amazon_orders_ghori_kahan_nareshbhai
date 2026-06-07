// In-memory notifications store
let notifications = [
  { id: '1', title: 'New Order Received', message: 'Order #ORD-100234 has been placed by Customer John Doe', read: false, createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { id: '2', title: 'Low Stock Alert', message: 'Product "Kindle Paperwhite" is running low on stock (5 left)', read: false, createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString() },
  { id: '3', title: 'Payment Success', message: 'Payment of $149.99 for order #ORD-100230 was processed successfully', read: true, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: '4', title: 'Refund Completed', message: 'Refund of $45.00 has been completed for order #ORD-100199', read: false, createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() }
];

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/v1/notifications
// Fetch all notifications (optional filter by read status)
// ══════════════════════════════════════════════════════════════════════════════
exports.getNotifications = (req, res) => {
  try {
    const { read } = req.query;
    let filtered = [...notifications];

    if (read !== undefined) {
      const isRead = read === 'true';
      filtered = filtered.filter(n => n.read === isRead);
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      message: 'Notifications fetched successfully',
      count: filtered.length,
      unreadCount: notifications.filter(n => !n.read).length,
      data: filtered
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/v1/notifications/read/:id
// Mark a notification as read
// ══════════════════════════════════════════════════════════════════════════════
exports.markAsRead = (req, res) => {
  try {
    const { id } = req.params;
    const notification = notifications.find(n => n.id === id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: `Notification with ID "${id}" not found`
      });
    }

    notification.read = true;

    res.status(200).json({
      success: true,
      message: 'Notification marked as read successfully',
      data: notification
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/v1/notifications/:id
// Delete a notification
// ══════════════════════════════════════════════════════════════════════════════
exports.deleteNotification = (req, res) => {
  try {
    const { id } = req.params;
    const index = notifications.findIndex(n => n.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: `Notification with ID "${id}" not found`
      });
    }

    const deleted = notifications.splice(index, 1)[0];

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
      data: deleted
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
