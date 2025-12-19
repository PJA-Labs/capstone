import express from 'express';
import { getRoomAnalytics, getZoomAnalytics, getDashboardAnalytics } from '../controllers/analyticsController.js';
// import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Untuk sementara tanpa authentication, bisa ditambahkan nanti
// const requireAnalyticsAccess = requireRole(['admin', 'logistik', 'it_admin']);

// Room analytics - untuk logistik
router.get('/rooms', getRoomAnalytics);

// Zoom analytics - untuk IT admin  
router.get('/zoom', getZoomAnalytics);

// Dashboard analytics - untuk admin
router.get('/dashboard', getDashboardAnalytics);

export default router;