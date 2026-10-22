import express from 'express';
import {
    getAllCourses, getCourseBySlug, createCourse, updateCourse, deleteCourse,
    addModule, addLesson, completeLesson, addReview, toggleWishlist, myWishlist,
    getLessonBlocks, addLessonBlock, updateLessonBlock, deleteLessonBlock, reorderLessonBlocks,
} from '../controllers/courseController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// ----- Public -----
router.get('/', getAllCourses);
router.get('/wishlist/my', authenticate, myWishlist);

// ----- Lesson blocks -----
// IMPORTANT: /lessons/... routes must be registered BEFORE /:slug
// otherwise Express treats "lessons" as a slug.
router.get('/lessons/:lessonId/blocks', (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) return authenticate(req, res, next);
    next();
}, getLessonBlocks);

router.post('/lessons/:lessonId/blocks', authenticate, requireAdmin, addLessonBlock);
router.put('/lessons/blocks/:blockId', authenticate, requireAdmin, updateLessonBlock);
router.delete('/lessons/blocks/:blockId', authenticate, requireAdmin, deleteLessonBlock);
router.put('/lessons/:lessonId/blocks/reorder', authenticate, requireAdmin, reorderLessonBlocks);

router.post('/lessons/complete', authenticate, completeLesson);

// ----- Admin: courses -----
router.post('/', authenticate, requireAdmin, createCourse);
router.put('/:id', authenticate, requireAdmin, updateCourse);
router.delete('/:id', authenticate, requireAdmin, deleteCourse);

// ----- Admin: modules + lessons -----
router.post('/modules', authenticate, requireAdmin, addModule);
router.post('/lessons', authenticate, requireAdmin, addLesson);

// ----- User actions -----
router.post('/reviews', authenticate, addReview);
router.post('/wishlist', authenticate, toggleWishlist);

// ----- Fallback: get single course by slug -----
// Must be last because /:slug matches any single segment.
router.get('/:slug', (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) return authenticate(req, res, next);
    next();
}, getCourseBySlug);

export default router;