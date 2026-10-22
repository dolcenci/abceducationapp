import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
    const [error, setError] = useState('');

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await signup(form);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Signup failed');
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
            <form onSubmit={handleSubmit} className="card p-8 w-full max-w-md">
                <h1 className="text-3xl font-display font-extrabold text-slate-900 mb-2 text-center">Create account</h1>
                <p className="text-slate-500 text-center mb-8">Start learning in under a minute.</p>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-4 text-sm">{error}</div>}

                <label className="label">First Name</label>
                <input name="firstName" value={form.firstName} onChange={handleChange} required className="input mb-4" />

                <label className="label">Last Name</label>
                <input name="lastName" value={form.lastName} onChange={handleChange} required className="input mb-4" />

                <label className="label">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required className="input mb-4" />

                <label className="label">Password</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} required minLength={6} className="input mb-6" />

                <button type="submit" className="btn-primary w-full">Sign Up</button>

                <p className="text-center mt-6 text-sm text-slate-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-brand-600 font-semibold hover:text-brand-700">Log in</Link>
                </p>
            </form>
        </div>
    );
}