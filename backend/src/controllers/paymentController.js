import dns from 'dns';
import pool from '../config/db.js';
import {
    buildCheckoutPayload,
    verifyItnSignature,
    isTrustedPayfastHost,
} from '../lib/payfast.js';

// ============ CHECKOUT ============

export const createCheckout = async (req, res) => {
    const { courseId } = req.body;
    const userId = req.user.id;

    try {
        const courseRes = await pool.query(
            'SELECT id, title, short_description, price, is_free, slug FROM courses WHERE id = $1',
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
            `SELECT id, payment_status FROM enrollments
       WHERE user_id = $1 AND course_id = $2`,
            [userId, courseId]
        );
        if (existing.rows.length && existing.rows[0].payment_status === 'paid') {
            return res.status(400).json({ error: 'You already own this course' });
        }

        const userRes = await pool.query(
            'SELECT first_name, last_name, email FROM users WHERE id = $1',
            [userId]
        );
        const user = userRes.rows[0];

        // Create an order in pending state
        const orderRes = await pool.query(
            `INSERT INTO orders (user_id, course_id, amount, status)
       VALUES ($1, $2, $3, 'pending') RETURNING id, amount`,
            [userId, courseId, course.price]
        );
        const order = orderRes.rows[0];

        // Ensure an enrollment row exists with pending status, tied to this order
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

        const payload = buildCheckoutPayload({
            orderId: order.id,
            amount: order.amount,
            itemName: course.title,
            itemDescription: course.short_description || '',
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
        });

        res.json({
            orderId: order.id,
            action: payload.action,
            fields: payload.fields,
        });
    } catch (e) {
        console.error('checkout error:', e);
        res.status(500).json({ error: 'Checkout failed' });
    }
};

// ============ ITN WEBHOOK ============
// PayFast POSTs here after payment. This is the source of truth.

export const payfastNotify = async (req, res) => {
    const itn = req.body;

    console.log('=== PAYFAST ITN ===');
    console.log(JSON.stringify(itn, null, 2));

    try {
        // 1. Verify the signature
        if (!verifyItnSignature(itn)) {
            console.error('ITN signature verification failed');
            return res.status(400).send('Invalid signature');
        }

        // 2. Verify the source host (best effort — localhost won't have a real host)
        const rawIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
        if (rawIp && rawIp !== '::1' && rawIp !== '127.0.0.1') {
            try {
                const hostnames = await dns.promises.reverse(rawIp);
                const trusted = hostnames.some(isTrustedPayfastHost);
                if (!trusted) {
                    console.error('ITN from untrusted host:', rawIp, hostnames);
                    return res.status(400).send('Untrusted source');
                }
            } catch (e) {
                console.warn('Reverse DNS failed for', rawIp, '— allowing for localhost/sandbox testing');
            }
        }

        // 3. Extract order ID
        const orderId = parseInt(itn.m_payment_id || itn.custom_str1, 10);
        if (!orderId) {
            console.error('ITN missing order ID');
            return res.status(400).send('Missing order ID');
        }

        // 4. Look up the order
        const orderRes = await pool.query(
            'SELECT * FROM orders WHERE id = $1',
            [orderId]
        );
        if (!orderRes.rows.length) {
            console.error('ITN for unknown order', orderId);
            return res.status(404).send('Order not found');
        }
        const order = orderRes.rows[0];

        // 5. Verify amount matches
        const itnAmount = parseFloat(itn.amount_gross);
        const orderAmount = parseFloat(order.amount);
        if (Math.abs(itnAmount - orderAmount) > 0.01) {
            console.error('ITN amount mismatch', itnAmount, 'vs', orderAmount);
            return res.status(400).send('Amount mismatch');
        }

        // 6. Handle payment status
        const status = itn.payment_status;
        if (status === 'COMPLETE') {
            await pool.query(
                `UPDATE orders SET
          status = 'paid',
          provider_reference = $1,
          payment_method = $2,
          raw_itn = $3,
          paid_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
                [itn.pf_payment_id, itn.payment_method || null, JSON.stringify(itn), orderId]
            );

            await pool.query(
                `UPDATE enrollments SET
          payment_status = 'paid',
          paid_at = CURRENT_TIMESTAMP,
          amount_paid = $1
         WHERE user_id = $2 AND course_id = $3`,
                [itnAmount, order.user_id, order.course_id]
            );

            console.log(`Order ${orderId} marked PAID`);
        } else {
            await pool.query(
                `UPDATE orders SET
          status = $1,
          raw_itn = $2
         WHERE id = $3`,
                [status.toLowerCase(), JSON.stringify(itn), orderId]
            );
            console.log(`Order ${orderId} status: ${status}`);
        }

        // PayFast expects a 200 OK response
        res.status(200).send('OK');
    } catch (e) {
        console.error('ITN error:', e);
        res.status(500).send('Error');
    }
};

// ============ ORDER HISTORY ============

export const myOrders = async (req, res) => {
    try {
        const r = await pool.query(
            `SELECT o.id, o.amount, o.status, o.created_at, o.paid_at,
              o.provider_reference, o.payment_method,
              c.title AS course_title, c.slug AS course_slug, c.image_url
       FROM orders o
       LEFT JOIN courses c ON c.id = o.course_id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
            [req.user.id]
        );
        res.json(r.rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

// ============ STATUS CHECK ============
// Used by the success page to know whether to celebrate or say "still processing".

export const getOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    try {
        const r = await pool.query(
            `SELECT o.id, o.status, o.amount, o.paid_at,
              c.title AS course_title, c.slug AS course_slug
       FROM orders o
       LEFT JOIN courses c ON c.id = o.course_id
       WHERE o.id = $1 AND o.user_id = $2`,
            [orderId, req.user.id]
        );
        if (!r.rows.length) return res.status(404).json({ error: 'Order not found' });
        res.json(r.rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
};

// ============ ADMIN: LIST ALL ORDERS ============

export const adminListOrders = async (req, res) => {
    try {
        const r = await pool.query(
            `SELECT o.*, u.email AS user_email, u.first_name, u.last_name,
              c.title AS course_title
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       LEFT JOIN courses c ON c.id = o.course_id
       ORDER BY o.created_at DESC
       LIMIT 200`
        );
        res.json(r.rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

// ============ ADMIN: MANUAL REFUND (marks order, does not call PayFast API) ============
// PayFast refunds are done through their dashboard. This just updates the local record.

export const markRefunded = async (req, res) => {
    const { orderId } = req.params;
    const { reason } = req.body;

    try {
        const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
        if (!orderRes.rows.length) return res.status(404).json({ error: 'Order not found' });
        const order = orderRes.rows[0];

        await pool.query(
            `UPDATE orders SET
        status = 'refunded',
        refunded_at = CURRENT_TIMESTAMP,
        refund_reason = $1
       WHERE id = $2`,
            [reason || null, orderId]
        );

        // Revoke access
        await pool.query(
            `UPDATE enrollments SET payment_status = 'refunded'
       WHERE user_id = $1 AND course_id = $2`,
            [order.user_id, order.course_id]
        );

        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to mark refunded' });
    }
};