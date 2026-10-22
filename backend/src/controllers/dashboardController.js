import pool from '../config/db.js';

// ============ HEARTBEAT ============
// Called once per page load. Updates the user's streak and last_login_at.
export const heartbeat = async (req, res) => {
    const userId = req.user.id;

    try {
        const r = await pool.query(
            'SELECT last_login_at, current_streak, longest_streak, last_streak_date FROM users WHERE id = $1',
            [userId]
        );
        if (!r.rows.length) return res.status(404).json({ error: 'User not found' });

        const user = r.rows[0];
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let currentStreak = user.current_streak || 0;
        let longestStreak = user.longest_streak || 0;

        if (!user.last_streak_date) {
            // First ever login
            currentStreak = 1;
        } else {
            const lastDate = new Date(user.last_streak_date);
            const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
            const diffDays = Math.round((today - lastDay) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                // Already logged in today — do nothing to streak
            } else if (diffDays === 1) {
                // Consecutive day — extend streak
                currentStreak += 1;
            } else {
                // Streak broken
                currentStreak = 1;
            }
        }

        if (currentStreak > longestStreak) longestStreak = currentStreak;

        await pool.query(
            `UPDATE users
       SET last_login_at = CURRENT_TIMESTAMP,
           current_streak = $1,
           longest_streak = $2,
           last_streak_date = CURRENT_DATE
       WHERE id = $3`,
            [currentStreak, longestStreak, userId]
        );

        res.json({ currentStreak, longestStreak });
    } catch (e) {
        console.error('heartbeat error:', e);
        res.status(500).json({ error: 'Heartbeat failed' });
    }
};

// ============ MAIN DASHBOARD ============
export const getDashboard = async (req, res) => {
    const userId = req.user.id;

    try {
        // 1. User summary
        const userRes = await pool.query(
            `SELECT id, first_name, last_name, email, avatar_url, bio,
              current_streak, longest_streak, last_login_at, created_at
       FROM users WHERE id = $1`,
            [userId]
        );
        const user = userRes.rows[0];

        // 2. Enrollments with course details
        const enrollRes = await pool.query(
            `SELECT e.id AS enrollment_id, e.payment_status, e.enrolled_at,
              c.id AS course_id, c.title, c.slug, c.image_url, c.category,
              c.level, c.duration_hours, c.is_free,
              (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id) AS module_count,
              (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) AS lesson_count
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       WHERE e.user_id = $1
       ORDER BY e.enrolled_at DESC`,
            [userId]
        );

        // 3. For each enrollment, count completed lessons and find the next lesson
        const enrollments = [];
        for (const e of enrollRes.rows) {
            const doneRes = await pool.query(
                `SELECT COUNT(*)::int AS done
         FROM lesson_completions lc
         JOIN lessons l ON l.id = lc.lesson_id
         WHERE lc.user_id = $1 AND l.course_id = $2`,
                [userId, e.course_id]
            );
            const completedLessons = doneRes.rows[0].done;

            const nextRes = await pool.query(
                `SELECT l.id, l.title, m.title AS module_title, m.order_index AS module_order, l.order_index AS lesson_order
         FROM lessons l
         JOIN modules m ON m.id = l.module_id
         WHERE l.course_id = $1
           AND l.id NOT IN (
             SELECT lc.lesson_id FROM lesson_completions lc WHERE lc.user_id = $2
           )
         ORDER BY m.order_index, l.order_index
         LIMIT 1`,
                [e.course_id, userId]
            );

            const pct = e.lesson_count > 0 ? Math.round((completedLessons / e.lesson_count) * 100) : 0;

            enrollments.push({
                ...e,
                completed_lessons: completedLessons,
                progress_percent: pct,
                next_lesson: nextRes.rows[0] || null,
            });
        }

        // 4. Stats
        const statsRes = await pool.query(
            `SELECT
         (SELECT COUNT(*)::int FROM enrollments WHERE user_id = $1) AS courses_enrolled,
         (SELECT COUNT(*)::int FROM lesson_completions WHERE user_id = $1) AS lessons_completed,
         (SELECT COUNT(*)::int FROM quiz_answers WHERE user_id = $1 AND correct = TRUE) AS quizzes_correct,
         (SELECT COUNT(*)::int FROM block_attempts WHERE user_id = $1 AND passed = TRUE) AS exercises_passed,
         (SELECT COUNT(*)::int FROM block_attempts WHERE user_id = $1) AS code_runs`,
            [userId]
        );

        // 5. Recent activity (last 10 events, mixed types)
        const activityRes = await pool.query(
            `(
         SELECT 'lesson_completed' AS type,
                lc.completed_at AS happened_at,
                l.title AS label,
                c.slug AS course_slug,
                c.title AS course_title
         FROM lesson_completions lc
         JOIN lessons l ON l.id = lc.lesson_id
         JOIN courses c ON c.id = l.course_id
         WHERE lc.user_id = $1
         ORDER BY lc.completed_at DESC
         LIMIT 5
       )
       UNION ALL
       (
         SELECT 'quiz_answered' AS type,
                qa.answered_at AS happened_at,
                CASE WHEN qa.correct THEN 'Correct quiz answer' ELSE 'Answered a quiz' END AS label,
                c.slug AS course_slug,
                c.title AS course_title
         FROM quiz_answers qa
         JOIN lesson_blocks lb ON lb.id = qa.block_id
         JOIN lessons l ON l.id = lb.lesson_id
         JOIN courses c ON c.id = l.course_id
         WHERE qa.user_id = $1
         ORDER BY qa.answered_at DESC
         LIMIT 5
       )
       UNION ALL
       (
         SELECT 'exercise_passed' AS type,
                ba.created_at AS happened_at,
                'Passed an exercise' AS label,
                c.slug AS course_slug,
                c.title AS course_title
         FROM block_attempts ba
         JOIN lesson_blocks lb ON lb.id = ba.block_id
         JOIN lessons l ON l.id = lb.lesson_id
         JOIN courses c ON c.id = l.course_id
         WHERE ba.user_id = $1 AND ba.passed = TRUE
         ORDER BY ba.created_at DESC
         LIMIT 5
       )
       ORDER BY happened_at DESC
       LIMIT 10`,
            [userId]
        );

        // 6. Recommended courses (not yet enrolled, same category as their top interest)
        const recommendedRes = await pool.query(
            `SELECT c.id, c.title, c.slug, c.image_url, c.category, c.level, c.price, c.is_free
       FROM courses c
       WHERE c.is_published = TRUE
         AND c.id NOT IN (SELECT course_id FROM enrollments WHERE user_id = $1)
       ORDER BY c.featured DESC, c.created_at DESC
       LIMIT 3`,
            [userId]
        );

        res.json({
            user,
            enrollments,
            stats: statsRes.rows[0],
            activity: activityRes.rows,
            recommended: recommendedRes.rows,
        });
    } catch (e) {
        console.error('dashboard error:', e);
        res.status(500).json({ error: 'Failed to load dashboard' });
    }
};

// ============ RECORD LESSON VIEW ============
export const recordLessonView = async (req, res) => {
    const { lessonId } = req.body;
    if (!lessonId) return res.status(400).json({ error: 'lessonId required' });

    try {
        await pool.query(
            'INSERT INTO lesson_views (user_id, lesson_id) VALUES ($1, $2)',
            [req.user.id, lessonId]
        );
        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to record view' });
    }
};