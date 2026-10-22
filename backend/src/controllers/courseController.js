import pool from '../config/db.js';

// ============ PUBLIC ============

export const getAllCourses = async (req, res) => {
    const { search, category, level, freeOnly, featured } = req.query;
    const clauses = ['is_published = TRUE'];
    const params = [];

    if (search) {
        params.push(`%${search.toLowerCase()}%`);
        clauses.push(`(LOWER(title) LIKE $${params.length} OR LOWER(short_description) LIKE $${params.length})`);
    }
    if (category) { params.push(category); clauses.push(`category = $${params.length}`); }
    if (level)    { params.push(level);    clauses.push(`level = $${params.length}`); }
    if (freeOnly === 'true') clauses.push('is_free = TRUE');
    if (featured === 'true') clauses.push('featured = TRUE');

    const sql = `
        SELECT c.*,
               COALESCE(AVG(r.rating), 0)::numeric(10,1) AS avg_rating,
            COUNT(DISTINCT r.id) AS review_count,
               COUNT(DISTINCT e.id) AS student_count
        FROM courses c
                 LEFT JOIN reviews r ON r.course_id = c.id
                 LEFT JOIN enrollments e ON e.course_id = c.id
        WHERE ${clauses.join(' AND ')}
        GROUP BY c.id
        ORDER BY c.featured DESC, c.created_at DESC
    `;

    try {
        const r = await pool.query(sql, params);
        res.json(r.rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
};

export const getCourseBySlug = async (req, res) => {
    try {
        const r = await pool.query(
            'SELECT * FROM courses WHERE slug = $1 OR id::text = $1',
            [req.params.slug]
        );
        if (!r.rows.length) return res.status(404).json({ error: 'Course not found' });

        const course = r.rows[0];

        const agg = await pool.query(
            `SELECT COALESCE(AVG(rating),0)::numeric(10,1) AS avg_rating, COUNT(*) AS review_count
             FROM reviews WHERE course_id = $1`,
            [course.id]
        );
        course.avg_rating = agg.rows[0].avg_rating;
        course.review_count = agg.rows[0].review_count;

        const reviews = await pool.query(
            `SELECT r.*, u.first_name, u.last_name, u.avatar_url
             FROM reviews r JOIN users u ON u.id = r.user_id
             WHERE r.course_id = $1 ORDER BY r.created_at DESC`,
            [course.id]
        );
        course.reviews = reviews.rows;

        const mods = await pool.query(
            'SELECT * FROM modules WHERE course_id = $1 ORDER BY order_index',
            [course.id]
        );
        for (const m of mods.rows) {
            const lessons = await pool.query(
                'SELECT * FROM lessons WHERE module_id = $1 ORDER BY order_index',
                [m.id]
            );
            m.lessons = lessons.rows;
        }
        course.modules = mods.rows;

        let hasAccess = course.is_free;
        let completedLessonIds = [];

        if (req.user) {
            const enr = await pool.query(
                'SELECT payment_status FROM enrollments WHERE user_id = $1 AND course_id = $2',
                [req.user.id, course.id]
            );
            if (enr.rows.length && ['paid', 'free'].includes(enr.rows[0].payment_status)) {
                hasAccess = true;
            }

            const comp = await pool.query(
                `SELECT lc.lesson_id FROM lesson_completions lc
                                              JOIN lessons l ON l.id = lc.lesson_id
                 WHERE lc.user_id = $1 AND l.course_id = $2`,
                [req.user.id, course.id]
            );
            completedLessonIds = comp.rows.map((r) => r.lesson_id);
        }

        course.hasAccess = hasAccess;
        course.completedLessonIds = completedLessonIds;

        if (!hasAccess) {
            course.modules = course.modules.map((m) => ({
                ...m,
                lessons: m.lessons.map((l) => ({
                    id: l.id,
                    title: l.title,
                    duration_minutes: l.duration_minutes,
                    is_preview: l.is_preview,
                    content_md: l.is_preview ? l.content_md : null,
                    content: l.is_preview ? l.content : null,
                    video_url: l.is_preview ? l.video_url : null,
                })),
            }));
        }

        res.json(course);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch course' });
    }
};

// ============ ADMIN — COURSES ============

export const createCourse = async (req, res) => {
    const {
        title, slug, shortDescription, longDescription, category,
        price, isFree, imageUrl, promoVideoUrl, entryRequirements,
        level, language, durationHours, whatYouLearn, featured,
    } = req.body;

    const finalSlug = (slug?.trim() || title)
        .toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    try {
        const r = await pool.query(
            `INSERT INTO courses
             (title, slug, short_description, long_description, category, price, is_free,
              image_url, promo_video_url, entry_requirements, level, language,
              duration_hours, what_you_learn, featured)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
            [title, finalSlug, shortDescription, longDescription, category, price, isFree,
                imageUrl, promoVideoUrl, entryRequirements, level, language,
                durationHours, whatYouLearn, featured || false]
        );
        res.status(201).json(r.rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
};

export const updateCourse = async (req, res) => {
    const { id } = req.params;
    const map = {
        title: 'title',
        shortDescription: 'short_description',
        longDescription: 'long_description',
        category: 'category',
        price: 'price',
        isFree: 'is_free',
        imageUrl: 'image_url',
        promoVideoUrl: 'promo_video_url',
        entryRequirements: 'entry_requirements',
        level: 'level',
        language: 'language',
        durationHours: 'duration_hours',
        whatYouLearn: 'what_you_learn',
        featured: 'featured',
        isPublished: 'is_published',
    };

    const sets = [];
    const params = [];
    for (const key of Object.keys(map)) {
        if (req.body[key] !== undefined) {
            params.push(req.body[key]);
            sets.push(`${map[key]} = $${params.length}`);
        }
    }
    if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });

    params.push(id);
    try {
        const r = await pool.query(
            `UPDATE courses SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
            params
        );
        res.json(r.rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to update course' });
    }
};

export const deleteCourse = async (req, res) => {
    try {
        await pool.query('DELETE FROM courses WHERE id=$1', [req.params.id]);
        res.json({ message: 'Course deleted' });
    } catch {
        res.status(500).json({ error: 'Failed to delete course' });
    }
};

// ============ ADMIN — MODULES ============

export const addModule = async (req, res) => {
    const { courseId, title, description, orderIndex } = req.body;
    try {
        const r = await pool.query(
            `INSERT INTO modules (course_id, title, description, order_index)
             VALUES ($1,$2,$3,$4) RETURNING *`,
            [courseId, title, description, orderIndex || 0]
        );
        res.status(201).json(r.rows[0]);
    } catch {
        res.status(500).json({ error: 'Failed to add module' });
    }
};

// ============ ADMIN — LESSONS ============

export const addLesson = async (req, res) => {
    const {
        moduleId, courseId, title, content, contentMd, videoUrl,
        orderIndex, durationMinutes, isPreview,
    } = req.body;
    try {
        const r = await pool.query(
            `INSERT INTO lessons
             (course_id, module_id, title, content, content_md, video_url, order_index, duration_minutes, is_preview)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [
                courseId, moduleId, title,
                content || contentMd || '',
                contentMd || content || '',
                videoUrl, orderIndex || 0,
                durationMinutes || 0, isPreview || false,
            ]
        );
        res.status(201).json(r.rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to add lesson' });
    }
};

// ============ USER — LESSON COMPLETION ============

export const completeLesson = async (req, res) => {
    const { lessonId } = req.body;
    try {
        await pool.query(
            `INSERT INTO lesson_completions (user_id, lesson_id)
             VALUES ($1,$2) ON CONFLICT DO NOTHING`,
            [req.user.id, lessonId]
        );

        let newCertificate = null;
        try {
            const lessonRes = await pool.query(
                'SELECT course_id FROM lessons WHERE id = $1',
                [lessonId]
            );
            if (lessonRes.rows.length) {
                const { issueCertificateIfEligible } = await import('./certificateController.js');
                newCertificate = await issueCertificateIfEligible(
                    req.user.id,
                    lessonRes.rows[0].course_id
                );
            }
        } catch (certErr) {
            console.error('certificate issuance error:', certErr);
        }

        res.json({ ok: true, newCertificate });
    } catch {
        res.status(500).json({ error: 'Failed to mark complete' });
    }
};

// ============ USER — REVIEWS ============

export const addReview = async (req, res) => {
    const { courseId, rating, comment } = req.body;
    try {
        const enr = await pool.query(
            `SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2
                                          AND payment_status IN ('paid','free')`,
            [req.user.id, courseId]
        );
        if (!enr.rows.length) return res.status(403).json({ error: 'Must be enrolled to review' });

        const r = await pool.query(
            `INSERT INTO reviews (user_id, course_id, rating, comment)
             VALUES ($1,$2,$3,$4)
                 ON CONFLICT (user_id, course_id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment
                                                         RETURNING *`,
            [req.user.id, courseId, rating, comment]
        );
        res.status(201).json(r.rows[0]);
    } catch {
        res.status(500).json({ error: 'Failed to add review' });
    }
};

// ============ USER — WISHLIST ============

export const toggleWishlist = async (req, res) => {
    const { courseId } = req.body;
    try {
        const exists = await pool.query(
            'SELECT id FROM wishlists WHERE user_id=$1 AND course_id=$2',
            [req.user.id, courseId]
        );
        if (exists.rows.length) {
            await pool.query('DELETE FROM wishlists WHERE id=$1', [exists.rows[0].id]);
            return res.json({ wishlisted: false });
        }
        await pool.query(
            'INSERT INTO wishlists (user_id, course_id) VALUES ($1,$2)',
            [req.user.id, courseId]
        );
        res.json({ wishlisted: true });
    } catch {
        res.status(500).json({ error: 'Wishlist failed' });
    }
};

export const myWishlist = async (req, res) => {
    try {
        const r = await pool.query(
            `SELECT c.* FROM wishlists w JOIN courses c ON c.id = w.course_id
             WHERE w.user_id = $1 ORDER BY w.created_at DESC`,
            [req.user.id]
        );
        res.json(r.rows);
    } catch {
        res.status(500).json({ error: 'Failed to fetch wishlist' });
    }
};

// ============ LESSON BLOCKS ============

export const getLessonBlocks = async (req, res) => {
    const { lessonId } = req.params;
    try {
        const r = await pool.query(
            'SELECT * FROM lesson_blocks WHERE lesson_id = $1 ORDER BY order_index, id',
            [lessonId]
        );
        res.json(r.rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch blocks' });
    }
};

export const addLessonBlock = async (req, res) => {
    const { lessonId } = req.params;
    const { type, content, orderIndex } = req.body;

    if (!type) return res.status(400).json({ error: 'Block type required' });

    try {
        let idx = orderIndex;
        if (idx === undefined || idx === null) {
            const count = await pool.query(
                'SELECT COALESCE(MAX(order_index), -1) + 1 AS next FROM lesson_blocks WHERE lesson_id = $1',
                [lessonId]
            );
            idx = count.rows[0].next;
        }

        const r = await pool.query(
            `INSERT INTO lesson_blocks (lesson_id, type, content, order_index)
             VALUES ($1, $2, $3::jsonb, $4) RETURNING *`,
            [lessonId, type, JSON.stringify(content || {}), idx]
        );
        res.status(201).json(r.rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to add block' });
    }
};

export const updateLessonBlock = async (req, res) => {
    const { blockId } = req.params;
    const { content } = req.body;
    try {
        const r = await pool.query(
            `UPDATE lesson_blocks
             SET content = $1::jsonb, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 RETURNING *`,
            [JSON.stringify(content || {}), blockId]
        );
        if (!r.rows.length) return res.status(404).json({ error: 'Block not found' });
        res.json(r.rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to update block' });
    }
};

export const deleteLessonBlock = async (req, res) => {
    const { blockId } = req.params;
    try {
        await pool.query('DELETE FROM lesson_blocks WHERE id = $1', [blockId]);
        res.json({ message: 'Block deleted' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to delete block' });
    }
};

export const reorderLessonBlocks = async (req, res) => {
    const { lessonId } = req.params;
    const { order } = req.body;

    if (!Array.isArray(order)) {
        return res.status(400).json({ error: 'order must be an array of block IDs' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (let i = 0; i < order.length; i++) {
            await client.query(
                `UPDATE lesson_blocks SET order_index = $1
                 WHERE id = $2 AND lesson_id = $3`,
                [i, order[i], lessonId]
            );
        }
        await client.query('COMMIT');

        const r = await client.query(
            'SELECT * FROM lesson_blocks WHERE lesson_id = $1 ORDER BY order_index, id',
            [lessonId]
        );
        res.json(r.rows);
    } catch (e) {
        await client.query('ROLLBACK');
        console.error(e);
        res.status(500).json({ error: 'Failed to reorder blocks' });
    } finally {
        client.release();
    }
};

// ============ ATTEMPTS (code + exercise) ============

export const saveAttempt = async (req, res) => {
    const { blockId } = req.params;
    const { code = '', passed = null, output = '', error = '' } = req.body;

    try {
        const r = await pool.query(
            `INSERT INTO block_attempts (user_id, block_id, code, passed, output, error)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [req.user.id, blockId, code, passed, output, error]
        );
        res.status(201).json(r.rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to save attempt' });
    }
};

export const getMyAttempts = async (req, res) => {
    const { blockId } = req.params;
    try {
        const r = await pool.query(
            `SELECT * FROM block_attempts
       WHERE user_id = $1 AND block_id = $2
       ORDER BY created_at DESC`,
            [req.user.id, blockId]
        );
        res.json(r.rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch attempts' });
    }
};

export const getMyLatestAttempt = async (req, res) => {
    const { blockId } = req.params;
    try {
        const r = await pool.query(
            `SELECT * FROM block_attempts
       WHERE user_id = $1 AND block_id = $2
       ORDER BY created_at DESC LIMIT 1`,
            [req.user.id, blockId]
        );
        res.json(r.rows[0] || null);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch attempt' });
    }
};

// ============ QUIZ ANSWERS ============

export const saveQuizAnswer = async (req, res) => {
    const { blockId } = req.params;
    const { selectedIndex, correct } = req.body;

    if (typeof selectedIndex !== 'number') {
        return res.status(400).json({ error: 'selectedIndex must be a number' });
    }

    try {
        const r = await pool.query(
            `INSERT INTO quiz_answers (user_id, block_id, selected_index, correct)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, block_id)
       DO UPDATE SET selected_index = EXCLUDED.selected_index,
                     correct = EXCLUDED.correct,
                     answered_at = CURRENT_TIMESTAMP
       RETURNING *`,
            [req.user.id, blockId, selectedIndex, !!correct]
        );
        res.status(201).json(r.rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to save quiz answer' });
    }
};

export const getMyQuizAnswer = async (req, res) => {
    const { blockId } = req.params;
    try {
        const r = await pool.query(
            'SELECT * FROM quiz_answers WHERE user_id = $1 AND block_id = $2',
            [req.user.id, blockId]
        );
        res.json(r.rows[0] || null);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch quiz answer' });
    }
};

export const getMyQuizAnswersForLesson = async (req, res) => {
    const { lessonId } = req.params;
    try {
        const r = await pool.query(
            `SELECT qa.* FROM quiz_answers qa
       JOIN lesson_blocks lb ON lb.id = qa.block_id
       WHERE qa.user_id = $1 AND lb.lesson_id = $2`,
            [req.user.id, lessonId]
        );
        res.json(r.rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch quiz answers' });
    }
};