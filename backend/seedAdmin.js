import bcrypt from 'bcryptjs';
import pool from './src/config/db.js';

const run = async () => {
    const hash = await bcrypt.hash('admin123', 10);
    try {
        const r = await pool.query(
            `INSERT INTO users (first_name,last_name,email,password_hash,is_admin)
       VALUES ('Admin','User','admin@abcedu.com',$1,TRUE)
       ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash
       RETURNING id,email`,
            [hash]
        );
        console.log('Admin ready:', r.rows[0]);
    } catch (e) { console.error(e); }
    process.exit(0);
};
run();