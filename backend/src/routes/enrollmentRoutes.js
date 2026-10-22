import express from 'express';
import { enroll, myEnrollments, initiatePayment } from '../controllers/enrollmentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.post('/', authenticate, enroll);
router.get('/my', authenticate, myEnrollments);
router.post('/pay', authenticate, initiatePayment);
export default router;