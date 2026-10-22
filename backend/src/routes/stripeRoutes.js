import express from 'express';
import {
    createCheckoutSession,
    verifySession,
} from '../controllers/stripeController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/checkout', authenticate, createCheckoutSession);
router.get('/session/:sessionId', authenticate, verifySession);

export default router;