import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

const statusStyles = {
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    failed: 'bg-red-100 text-red-700',
    cancelled: 'bg-slate-100 text-slate-600',
    refunded: 'bg-coral-100 text-coral-600',
};

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/payments/orders').then((r) => setOrders(r.data)).finally(() => setLoading(false));
    }, []);

    if (loading) return <p className="text-center py-24 text-slate-400">Loading orders...</p>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-4xl font-display font-extrabold text-slate-900 mb-2">
                Order History
            </h1>
            <p className="text-slate-500 mb-8">Every purchase you've made on ABC Education.</p>

            {orders.length === 0 ? (
                <div className="card p-16 text-center">
                    <p className="text-5xl mb-4">🧾</p>
                    <p className="text-lg font-semibold text-slate-800 mb-2">No orders yet</p>
                    <Link to="/courses" className="btn-primary mt-4">Browse courses</Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.map((o) => (
                        <div key={o.id} className="card p-5 flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                                {o.image_url ? (
                                    <img src={o.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-brand-500 to-coral-400 grid place-items-center text-white font-extrabold">
                                        {(o.course_title || '?')[0]}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-display font-extrabold text-slate-900 truncate">
                                    {o.course_title || 'Course removed'}
                                </p>
                                <p className="text-sm text-slate-500 mt-0.5">
                                    Order #{o.id} · {new Date(o.created_at).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    {o.provider_reference && <> · Ref {o.provider_reference}</>}
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="font-display font-extrabold text-slate-900">
                                    R{parseFloat(o.amount).toFixed(2)}
                                </p>
                                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${statusStyles[o.status] || statusStyles.pending}`}>
                  {o.status}
                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}