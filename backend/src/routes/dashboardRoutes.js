import express from 'express';
import { heartbeat, getDashboard, recordLessonView } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/heartbeat', authenticate, heartbeat);
router.get('/dashboard', authenticate, getDashboard);
router.post('/lesson-view', authenticate, recordLessonView);

export default router;