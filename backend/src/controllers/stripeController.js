import pool from '../config/db.js';
import stripe from '../lib/stripe.js';

// ============ CREATE CHECKOUT SESSION ============

export const createCheckoutSession = async (req, res) => {
    const { courseId } = req.body;
    const userId = req.user.id;

    try {
        // Fetch the course
        const courseRes = await pool.query(
            'SELECT id, title, short_description, price, is_free, slug, image_url FROM courses WHERE id = $1',
            [courseId]
        );
        if (!courseRes.rows.length) {
            return res.status(404).json({ error: 'Course not found' });
        }
        const course = courseRes.rows[0];

        if (course.is_free) {
            return res.status(400).json({ error: 'This course is free — no payment needed' });
        }

        // Check if already paid
        const existing = await pool.query(
            'SELECT id, payment_status FROM enrollments WHERE user_id = $1 AND course_id = $2',
            [userId, courseId]
        );
        if (existing.rows.length && existing.rows[0].payment_status === 'paid') {
            return res.status(400).json({ error: 'You already own this course' });
        }

        // Create order in pending state
        const orderRes = await pool.query(
            `INSERT INTO orders (user_id, course_id, amount, status, payment_provider)
       VALUES ($1, $2, $3, 'pending', 'stripe') RETURNING id, amount`,
            [userId, courseId, course.price]
        );
        const order = orderRes.rows[0];

        // Ensure enrollment row exists
        await pool.query(
            `INSERT INTO enrollments (user_id, course_id, payment_status, order_id)
       VALUES ($1, $2, 'pending', $3)
       ON CONFLICT (user_id, course_id)
       DO UPDATE SET order_id = EXCLUDED.order_id,
                     payment_status = CASE
                       WHEN enrollments.payment_status = 'paid' THEN 'paid'
                       ELSE 'pending'
                     END`,
            [userId, courseId, order.id]
        );

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        // Create a Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'zar',
                        product_data: {
                            name: course.title,
                            description: course.short_description?.slice(0, 200) || '',
                            images: course.image_url ? [course.image_url] : [],
                        },
                        unit_amount: Math.round(Number(course.price) * 100), // cents
                    },
                    quantity: 1,
                },
            ],
            // Store our order ID so we can match it later
            metadata: {
                orderId: String(order.id),
                userId: String(userId),
                courseId: String(courseId),
            },
            success_url: `${frontendUrl}/payment/success?order=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${frontendUrl}/payment/cancel`,
        });

        // Save the session ID on the order for reference
        await pool.query(
            'UPDATE orders SET provider_reference = $1 WHERE id = $2',
            [session.id, order.id]
        );

        res.json({
            orderId: order.id,
            checkoutUrl: session.url,
            sessionId: session.id,
        });
    } catch (e) {
        console.error('stripe checkout error:', e);
        res.status(500).json({ error: e.message || 'Checkout failed' });
    }
};

// ============ VERIFY A SESSION AFTER REDIRECT ============
// When the user comes back from Stripe, the frontend calls this to check
// whether the payment actually went through. If Stripe says "paid",
// we mark the order paid here — no webhook needed for local testing.

export const verifySession = async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.id;

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['payment_intent'],
        });

        const orderId = session.metadata?.orderId;
        if (!orderId) return res.status(400).json({ error: 'Missing order ID' });

        const orderRes = await pool.query(
            'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
            [orderId, userId]
        );
        if (!orderRes.rows.length) return res.status(404).json({ error: 'Order not found' });
        const order = orderRes.rows[0];

        if (session.payment_status === 'paid') {
            // Mark as paid if not already
            if (order.status !== 'paid') {
                await pool.query(
                    `UPDATE orders SET
            status = 'paid',
            provider_reference = $1,
            payment_method = $2,
            paid_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
                    [session.payment_intent?.id || session.id, 'stripe', order.id]
                );

                await pool.query(
                    `UPDATE enrollments SET
            payment_status = 'paid',
            paid_at = CURRENT_TIMESTAMP,
            amount_paid = $1
           WHERE user_id = $2 AND course_id = $3`,
                    [order.amount, userId, order.course_id]
                );
            }

            return res.json({ status: 'paid', orderId: order.id });
        }

        res.json({ status: session.payment_status || order.status, orderId: order.id });
    } catch (e) {
        console.error('verify session error:', e);
        res.status(500).json({ error: e.message });
    }
};