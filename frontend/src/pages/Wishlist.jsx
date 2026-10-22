import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function Wishlist() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/courses/wishlist/my')
            .then((r) => setItems(r.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p className="text-center py-24 text-slate-400">Loading...</p>;

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <h1 className="text-4xl font-display font-extrabold text-slate-900 mb-2">My Wishlist</h1>
            <p className="text-slate-500 mb-10">Courses you've saved for later.</p>

            {items.length === 0 ? (
                <div className="card p-16 text-center">
                    <p className="text-5xl mb-4">♡</p>
                    <p className="text-lg font-semibold text-slate-800 mb-2">Your wishlist is empty</p>
                    <Link to="/courses" className="btn-primary mt-4">Browse courses</Link>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((c) => (
                        <Link key={c.id} to={`/courses/${c.slug}`} className="card overflow-hidden hover:-translate-y-1 hover:shadow-soft transition">
                            <div className="h-40 bg-slate-100">
                                {c.image_url ? (
                                    <img src={c.image_url} alt={c.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-brand-400 to-brand-600 grid place-items-center text-white font-display font-extrabold text-3xl">
                                        {c.title[0]}
                                    </div>
                                )}
                            </div>
                            <div className="p-5">
                                <h3 className="font-bold text-slate-900 mb-1">{c.title}</h3>
                                <p className="text-sm text-slate-500 mb-3 line-clamp-2">{c.short_description}</p>
                                <p className="font-extrabold text-slate-900">{c.is_free ? 'Free' : `R${c.price}`}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}