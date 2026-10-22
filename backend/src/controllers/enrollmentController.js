import pool from '../config/db.js';

export const enroll = async (req, res) => {
    const { courseId } = req.body;
    const userId = req.user.id;
    try {
        const c = await pool.query('SELECT * FROM courses WHERE id=$1', [courseId]);
        if (!c.rows.length) return res.status(404).json({ error: 'Course not found' });

        const course = c.rows[0];
        const status = course.is_free ? 'free' : 'pending';

        const r = await pool.query(
            `INSERT INTO enrollments (user_id,course_id,payment_status)
       VALUES ($1,$2,$3)
       ON CONFLICT (user_id,course_id) DO UPDATE SET payment_status=EXCLUDED.payment_status
       RETURNING *`,
            [userId, courseId, status]
        );

        res.status(201).json({
            enrollment: r.rows[0],
            message: course.is_free
                ? 'Enrolled for free!'
                : 'Enrolled. Please complete payment to access content.',
        });
    } catch { res.status(500).json({ error: 'Enrollment failed' }); }
};

export const myEnrollments = async (req, res) => {
    try {
        const r = await pool.query(
            `SELECT e.*,c.title,c.slug,c.image_url,c.is_free
       FROM enrollments e JOIN courses c ON c.id=e.course_id
       WHERE e.user_id=$1 ORDER BY e.enrolled_at DESC`,
            [req.user.id]
        );
        res.json(r.rows);
    } catch { res.status(500).json({ error: 'Failed to fetch enrollments' }); }
};

export const initiatePayment = async (req, res) => {
    const { courseId } = req.body;
    const userId = req.user.id;
    try {
        const c = await pool.query('SELECT * FROM courses WHERE id=$1', [courseId]);
        if (!c.rows.length) return res.status(404).json({ error: 'Course not found' });

        const payment = await pool.query(
            `INSERT INTO payments (user_id,course_id,amount,status,payment_reference)
       VALUES ($1,$2,$3,'pending',$4) RETURNING id`,
            [userId, courseId, c.rows[0].price, `REF-${Date.now()}`]
        );

        // TODO: integrate PayFast / Stripe here.
        res.status(202).json({
            message: 'Payment integration not yet active. Payment queued.',
            paymentId: payment.rows[0].id,
        });
    } catch { res.status(500).json({ error: 'Payment initiation failed' }); }
};