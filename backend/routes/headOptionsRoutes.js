const express = require('express');
const router = express.Router();
const headOptionsController = require('../controllers/headOptionsController');

// ─── HEAD Routes ─────────────────────────────────────────────────────────────

router.head('/orders', headOptionsController.headOrders);
router.head('/orders/search', headOptionsController.headOrdersSearch);
router.head('/orders/filter/delivered', headOptionsController.headFilterDelivered);
router.head('/orders/:orderId', headOptionsController.headSingleOrder);
router.head('/orders/:orderId/items', headOptionsController.headOrderItems);

router.head('/shipping/pending', headOptionsController.headShippingPending);
router.head('/shipping/tracking/:orderId', headOptionsController.headShippingTracking);

router.head('/analytics/revenue/total', headOptionsController.headAnalyticsRevenueTotal);
router.head('/stats/orders/total', headOptionsController.headStatsOrdersTotal);

router.head('/admin/users', headOptionsController.headAdminUsers);
router.head('/admin/orders', headOptionsController.headAdminOrders);

router.head('/dashboard/overview', headOptionsController.headDashboardOverview);

router.head('/system/uptime', headOptionsController.headSystemUptime);
router.head('/system/ping', headOptionsController.headSystemPing);
router.head('/system/status/database', headOptionsController.headSystemStatusDatabase);
router.head('/system/status/cache', headOptionsController.headSystemStatusCache);
router.head('/system/status/storage', headOptionsController.headSystemStatusStorage);

router.head('/auth/profile', headOptionsController.headAuthProfile);
router.head('/notifications', headOptionsController.headNotifications);
router.head('/activity/logs', headOptionsController.headActivityLogs);


// ─── OPTIONS Routes ──────────────────────────────────────────────────────────

router.options('/orders', headOptionsController.optionsOrders);
router.options('/orders/search', headOptionsController.optionsOrdersSearch);
router.options('/orders/filter/status', headOptionsController.optionsOrdersFilterStatus);
router.options('/orders/:orderId', headOptionsController.optionsSingleOrder);

router.options('/shipping/tracking/:orderId', headOptionsController.optionsShippingTracking);
router.options('/shipping/create-label', headOptionsController.optionsShippingCreateLabel);

router.options('/auth/login', headOptionsController.optionsAuthLogin);
router.options('/auth/register', headOptionsController.optionsAuthRegister);

router.options('/admin/users', headOptionsController.optionsAdminUsers);
router.options('/admin/orders', headOptionsController.optionsAdminOrders);
router.options('/admin/system/health', headOptionsController.optionsAdminSystemHealth);

router.options('/analytics/revenue/total', headOptionsController.optionsAnalyticsRevenueTotal);
router.options('/dashboard/overview', headOptionsController.optionsDashboardOverview);
router.options('/notifications', headOptionsController.optionsNotifications);

router.options('/system/version', headOptionsController.optionsSystemVersion);
router.options('/system/status/database', headOptionsController.optionsSystemStatusDatabase);
router.options('/system/status/cache', headOptionsController.optionsSystemStatusCache);
router.options('/system/status/storage', headOptionsController.optionsSystemStatusStorage);

router.options('/validate/order', headOptionsController.optionsValidateOrder);
router.options('/errors/not-found', headOptionsController.optionsErrorsNotFound);

module.exports = router;
