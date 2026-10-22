import express from 'express';
import {
    myCertificates,
    certificateForCourse,
    issueCertificate,
    verifyCertificate,
} from '../controllers/certificateController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/verify/:code', verifyCertificate);
router.get('/my', authenticate, myCertificates);
router.get('/by-course/:courseId', authenticate, certificateForCourse);
router.post('/issue/:courseId', authenticate, issueCertificate);

export default router;