import crypto from 'crypto';
import pool from '../config/db.js';

const generateVerificationCode = () => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = crypto.randomBytes(20);
    let code = '';
    for (let i = 0; i < 20; i++) {
        code += alphabet[bytes[i] % alphabet.length];
    }
    return code;
};

async function isCourseComplete(userId, courseId) {
    const totalRes = await pool.query(
        'SELECT COUNT(*)::int AS total FROM lessons WHERE course_id = $1',
        [courseId]
    );
    const total = totalRes.rows[0].total;
    if (total === 0) return { complete: false, total, done: 0 };

    const doneRes = await pool.query(
        `SELECT COUNT(DISTINCT lc.lesson_id)::int AS done
     FROM lesson_completions lc
     JOIN lessons l ON l.id = lc.lesson_id
     WHERE lc.user_id = $1 AND l.course_id = $2`,
        [userId, courseId]
    );
    const done = doneRes.rows[0].done;
    return { complete: done >= total && total > 0, total, done };
}

export async function issueCertificateIfEligible(userId, courseId) {
    const { complete } = await isCourseComplete(userId, courseId);
    if (!complete) return null;

    const existing = await pool.query(
        'SELECT * FROM certificates WHERE user_id = $1 AND course_id = $2',
        [userId, courseId]
    );
    if (existing.rows.length) return existing.rows[0];

    const userRes = await pool.query(
        'SELECT first_name, last_name FROM users WHERE id = $1',
        [userId]
    );
    const courseRes = await pool.query(
        'SELECT title FROM courses WHERE id = $1',
        [courseId]
    );
    if (!userRes.rows.length || !courseRes.rows.length) return null;

    const user = userRes.rows[0];
    const course = courseRes.rows[0];
    const fullName = `${user.first_name} ${user.last_name}`.trim();
    const code = generateVerificationCode();

    const insert = await pool.query(
        `INSERT INTO certificates (user_id, course_id, verification_code, student_name, course_title)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, course_id) DO NOTHING
     RETURNING *`,
        [userId, courseId, code, fullName, course.title]
    );

    if (!insert.rows.length) {
        const again = await pool.query(
            'SELECT * FROM certificates WHERE user_id = $1 AND course_id = $2',
            [userId, courseId]
        );
        return again.rows[0] || null;
    }

    return insert.rows[0];
}

export const myCertificates = async (req, res) => {
    try {
        const r = await pool.query(
            `SELECT c.id, c.verification_code, c.issued_at, c.student_name, c.course_title,
              co.slug AS course_slug, co.image_url AS course_image
       FROM certificates c
       LEFT JOIN courses co ON co.id = c.course_id
       WHERE c.user_id = $1
       ORDER BY c.issued_at DESC`,
            [req.user.id]
        );
        res.json(r.rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch certificates' });
    }
};

export const certificateForCourse = async (req, res) => {
    const { courseId } = req.params;
    try {
        const existing = await pool.query(
            `SELECT c.*, co.slug AS course_slug
       FROM certificates c
       LEFT JOIN courses co ON co.id = c.course_id
       WHERE c.user_id = $1 AND c.course_id = $2`,
            [req.user.id, courseId]
        );
        if (existing.rows.length) {
            return res.json({ certificate: existing.rows[0], eligible: true });
        }
        const status = await isCourseComplete(req.user.id, courseId);
        res.json({
            certificate: null,
            eligible: status.complete,
            complete: status.complete,
            done: status.done,
            total: status.total,
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to check certificate' });
    }
};

export const issueCertificate = async (req, res) => {
    const { courseId } = req.params;
    try {
        const cert = await issueCertificateIfEligible(req.user.id, courseId);
        if (!cert) return res.status(400).json({ error: 'Course not yet complete' });
        res.json(cert);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to issue certificate' });
    }
};

export const verifyCertificate = async (req, res) => {
    const { code } = req.params;
    try {
        const r = await pool.query(
            `SELECT c.id, c.verification_code, c.issued_at, c.student_name, c.course_title,
              co.slug AS course_slug
       FROM certificates c
       LEFT JOIN courses co ON co.id = c.course_id
       WHERE c.verification_code = $1`,
            [code.toUpperCase()]
        );
        if (!r.rows.length) return res.status(404).json({ valid: false });
        res.json({ valid: true, certificate: r.rows[0] });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to verify certificate' });
    }
};