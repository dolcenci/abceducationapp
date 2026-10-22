import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

export const signup = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    try {
        const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
        if (exists.rows.length) return res.status(400).json({ error: 'Email already registered' });

        const hash = await bcrypt.hash(password, 10);
        const r = await pool.query(
            `INSERT INTO users (first_name,last_name,email,password_hash)
       VALUES ($1,$2,$3,$4) RETURNING id,first_name,last_name,email,is_admin`,
            [firstName, lastName, email, hash]
        );
        const user = r.rows[0];
        const token = jwt.sign(
            { id: user.id, email: user.email, isAdmin: user.is_admin },
            process.env.JWT_SECRET, { expiresIn: '7d' }
        );
        res.status(201).json({ user, token });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Signup failed' }); }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const r = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
        if (!r.rows.length) return res.status(400).json({ error: 'Invalid credentials' });

        const user = r.rows[0];
        if (!(await bcrypt.compare(password, user.password_hash)))
            return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, email: user.email, isAdmin: user.is_admin },
            process.env.JWT_SECRET, { expiresIn: '7d' }
        );
        res.json({
            user: {
                id: user.id, firstName: user.first_name, lastName: user.last_name,
                email: user.email, isAdmin: user.is_admin,
            },
            token,
        });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Login failed' }); }
};

export const me = async (req, res) => {
    try {
        const r = await pool.query(
            'SELECT id,first_name,last_name,email,is_admin FROM users WHERE id=$1',
            [req.user.id]
        );
        res.json(r.rows[0]);
    } catch { res.status(500).json({ error: 'Failed to fetch user' }); }
};