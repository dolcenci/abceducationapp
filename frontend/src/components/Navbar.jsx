import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const linkCls = ({ isActive }) =>
        `px-4 py-2 rounded-full text-sm font-semibold transition ${
            isActive
                ? 'bg-brand-100 text-brand-700'
                : 'text-slate-700 hover:text-brand-700'
        }`;

    return (
        <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-lg border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-600 via-coral-400 to-accent-400 grid place-items-center text-white font-display font-extrabold shadow-soft">
            A
          </span>
                    <span className="font-display font-extrabold text-lg tracking-tight">
            ABC <span className="text-gradient">Education</span>
          </span>
                </Link>

                <nav className="hidden md:flex items-center gap-1">
                    <NavLink to="/" end className={linkCls}>Home</NavLink>
                    <NavLink to="/courses" className={linkCls}>Courses</NavLink>
                    {user && <NavLink to="/dashboard" className={linkCls}>My Learning</NavLink>}
                    {user && <NavLink to="/wishlist" className={linkCls}>Wishlist</NavLink>}
                    {user?.isAdmin && <NavLink to="/admin" className={linkCls}>Admin</NavLink>}
                </nav>

                <div className="flex items-center gap-2">
                    {user ? (
                        <div className="relative">
                            <button
                                onClick={() => setOpen(!open)}
                                className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full hover:bg-slate-100 transition"
                            >
                <span className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-coral-400 grid place-items-center text-white font-bold text-sm">
                  {user.firstName?.[0]?.toUpperCase() || 'U'}
                </span>
                                <span className="hidden md:block text-sm font-semibold text-slate-700">
                  {user.firstName}
                </span>
                            </button>
                            {open && (
                                <div className="absolute right-0 mt-2 w-48 card py-2 overflow-hidden">
                                    <button
                                        onClick={() => { setOpen(false); navigate('/profile'); }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-brand-50"
                                    >
                                        My Profile
                                    </button>

                                    <button
                                        onClick={() => { setOpen(false); navigate('/orders'); }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                                    >
                                        Order History
                                    </button>
                                    <button
                                        onClick={() => { setOpen(false); navigate('/certificates'); }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                                    >
                                        My Certificates
                                    </button>
                                    <button
                                        onClick={() => { setOpen(false); logout(); navigate('/'); }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600"
                                    >
                                        Log Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="hidden md:inline text-sm font-semibold text-slate-700 px-4 py-2 hover:text-brand-700"
                            >
                                Log in
                            </Link>
                            <Link to="/signup" className="btn-primary text-sm">Get Started</Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}