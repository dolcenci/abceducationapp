import express from 'express';
import {
    createCheckout,
    payfastNotify,
    myOrders,
    getOrderStatus,
    adminListOrders,
    markRefunded,
} from '../controllers/paymentController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// PayFast ITN — NO auth, comes from PayFast's servers
router.post('/notify', express.urlencoded({ extended: false }), payfastNotify);

// Authenticated user actions
router.post('/checkout', authenticate, createCheckout);
router.get('/orders', authenticate, myOrders);
router.get('/orders/:orderId', authenticate, getOrderStatus);

// Admin
router.get('/admin/orders', authenticate, requireAdmin, adminListOrders);
router.post('/admin/orders/:orderId/refund', authenticate, requireAdmin, markRefunded);

export default router;