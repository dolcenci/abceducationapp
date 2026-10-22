import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
            <form onSubmit={handleSubmit} className="card p-8 w-full max-w-md">
                <h1 className="text-3xl font-display font-extrabold text-slate-900 mb-2 text-center">Welcome back</h1>
                <p className="text-slate-500 text-center mb-8">Log in to continue your learning.</p>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-4 text-sm">{error}</div>}

                <label className="label">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input mb-4" />

                <label className="label">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input mb-6" />

                <button type="submit" className="btn-primary w-full">Log in</button>

                <p className="text-center mt-6 text-sm text-slate-600">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-brand-600 font-semibold hover:text-brand-700">Sign up</Link>
                </p>
            </form>
        </div>
    );
}