import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Checkout() {
    const { slug } = useParams();
    const { user } = useAuth();

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get(`/courses/${slug}`)
            .then((r) => setCourse(r.data))
            .catch(() => setCourse(null))
            .finally(() => setLoading(false));
    }, [slug]);

    const startPayment = async () => {
        setError('');
        setStarting(true);
        try {
            const r = await api.post('/stripe/checkout', { courseId: course.id });
            // Redirect the browser to the Stripe-hosted checkout page
            window.location.href = r.data.checkoutUrl;
        } catch (e) {
            setError(e.response?.data?.error || 'Could not start payment');
            setStarting(false);
        }
    };

    if (loading) return <p className="text-center py-24 text-slate-400">Loading checkout...</p>;

    if (!course) {
        return (
            <div className="max-w-2xl mx-auto py-24 text-center px-4">
                <p className="text-5xl mb-4">😕</p>
                <p className="text-xl font-display font-extrabold text-slate-900 mb-2">
                    Course not found
                </p>
                <Link to="/courses" className="btn-primary mt-6">Back to courses</Link>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="max-w-2xl mx-auto py-24 text-center px-4">
                <p className="text-5xl mb-4">🔒</p>
                <p className="text-xl font-display font-extrabold text-slate-900 mb-2">
                    Please log in to continue
                </p>
                <Link to="/login" className="btn-primary mt-6">Log in</Link>
            </div>
        );
    }

    if (course.is_free) {
        return (
            <div className="max-w-2xl mx-auto py-24 text-center px-4">
                <p className="text-5xl mb-4">🎉</p>
                <p className="text-xl font-display font-extrabold text-slate-900 mb-2">
                    This course is free
                </p>
                <p className="text-slate-500 mb-6">
                    No payment is required. Enroll from the course page to get started.
                </p>
                <Link to={`/courses/${slug}`} className="btn-primary">Go to course</Link>
            </div>
        );
    }

    return (
        <div className="bg-[#fdfcfb] min-h-screen">
            <section className="relative overflow-hidden">
                <div className="blob w-[350px] h-[350px] bg-brand-400 -top-32 -left-20" />
                <div className="blob w-[300px] h-[300px] bg-coral-400 top-0 right-0" />

                <div className="relative max-w-4xl mx-auto px-4 pt-12 pb-8">
                    <Link to={`/courses/${slug}`} className="text-brand-600 hover:text-brand-700 text-sm font-semibold">
                        ← Back to course
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-display font-extrabold text-slate-900 mt-4 mb-2">
                        Checkout
                    </h1>
                    <p className="text-slate-600 text-lg">
                        One quick step and you're in.
                    </p>
                </div>
            </section>

            <section className="max-w-4xl mx-auto px-4 pb-20 grid md:grid-cols-[1fr_auto] gap-8">
                <div className="card p-6">
                    <h2 className="font-display font-extrabold text-lg text-slate-900 mb-4">
                        You're buying
                    </h2>
                    <div className="flex gap-4 items-start">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                            {course.image_url ? (
                                <img src={course.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-brand-500 to-coral-400 grid place-items-center text-white font-extrabold text-2xl">
                                    {course.title[0]}
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="font-display font-extrabold text-slate-900">{course.title}</p>
                            <p className="text-sm text-slate-500 mt-1">{course.short_description}</p>
                            <div className="flex gap-3 mt-3 text-xs text-slate-500">
                                <span>🎓 {course.level}</span>
                                <span>🌐 {course.language || 'English'}</span>
                                {course.duration_hours > 0 && <span>⏱️ {course.duration_hours}h</span>}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-100 space-y-3 text-sm">
                        {[
                            ['📚', 'Full lifetime access'],
                            ['♾️', 'All future updates'],
                            ['🏆', 'Certificate of completion'],
                            ['💬', 'Instructor support'],
                        ].map(([icon, label]) => (
                            <div key={label} className="flex items-center gap-3 text-slate-700">
                                <span>{icon}</span>
                                <span>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="md:w-80">
                    <div className="card p-6 sticky top-24">
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="text-sm font-semibold text-slate-500">Total</span>
                            <span className="text-3xl font-display font-extrabold text-slate-900">
                R{course.price}
              </span>
                        </div>
                        <p className="text-xs text-slate-400 mb-6">VAT included where applicable.</p>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-sm mb-4">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={startPayment}
                            disabled={starting}
                            className="btn-accent w-full mb-3"
                        >
                            {starting ? 'Redirecting to Stripe...' : 'Pay with Stripe →'}
                        </button>

                        <div className="text-xs text-slate-500 leading-relaxed">
                            <p className="mb-1">
                                <strong>Test mode.</strong> No real money will be charged.
                            </p>
                            <p>
                                You'll be redirected to Stripe's secure hosted page. We never see your card details.
                            </p>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-500">
                            <span className="text-xl">🔒</span>
                            <span>Secured by Stripe — PCI-DSS compliant.</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}