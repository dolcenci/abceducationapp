import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';

export default function PaymentSuccess() {
    const [params] = useSearchParams();
    const orderId = params.get('order');
    const sessionId = params.get('session_id');

    const [status, setStatus] = useState('checking');
    const [order, setOrder] = useState(null);
    const [attempts, setAttempts] = useState(0);

    useEffect(() => {
        if (!orderId) {
            setStatus('error');
            return;
        }
        if (attempts > 6) {
            setStatus('pending');
            return;
        }

        const check = async () => {
            try {
                // If we have a Stripe session, verify it. This marks the order paid.
                if (sessionId) {
                    await api.get(`/stripe/session/${sessionId}`);
                }

                const r = await api.get(`/payments/orders/${orderId}`);
                setOrder(r.data);

                if (r.data.status === 'paid') {
                    setStatus('paid');
                } else if (r.data.status === 'pending') {
                    setTimeout(() => setAttempts((n) => n + 1), 2000);
                } else {
                    setStatus('error');
                }
            } catch {
                setStatus('error');
            }
        };

        check();
    }, [orderId, sessionId, attempts]);

    return (
        <div className="bg-[#fdfcfb] min-h-screen flex items-center justify-center px-4">
            <div className="max-w-md w-full card p-10 text-center">
                {status === 'checking' && (
                    <>
                        <div className="text-6xl mb-4">⏳</div>
                        <p className="text-2xl font-display font-extrabold text-slate-900 mb-2">
                            Confirming your payment
                        </p>
                        <p className="text-slate-500">Just a moment...</p>
                    </>
                )}

                {status === 'paid' && (
                    <>
                        <div className="text-6xl mb-4">🎉</div>
                        <p className="text-3xl font-display font-extrabold text-slate-900 mb-2">
                            You're in!
                        </p>
                        <p className="text-slate-500 mb-1">Payment confirmed for</p>
                        <p className="font-bold text-slate-900 mb-6">{order?.course_title}</p>
                        <Link to={`/courses/${order?.course_slug}`} className="btn-primary w-full">
                            Start learning →
                        </Link>
                        <Link to="/dashboard" className="block mt-3 text-sm text-brand-600 hover:text-brand-700 font-semibold">
                            Go to dashboard
                        </Link>
                    </>
                )}

                {status === 'pending' && (
                    <>
                        <div className="text-6xl mb-4">⏱️</div>
                        <p className="text-2xl font-display font-extrabold text-slate-900 mb-2">
                            Still confirming
                        </p>
                        <p className="text-slate-500 mb-6">
                            The payment is being processed. Check your dashboard in a moment.
                        </p>
                        <Link to="/dashboard" className="btn-primary w-full">
                            Go to dashboard
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="text-6xl mb-4">😕</div>
                        <p className="text-2xl font-display font-extrabold text-slate-900 mb-2">
                            Something went wrong
                        </p>
                        <p className="text-slate-500 mb-6">
                            We couldn't confirm that order. If you were charged, contact support.
                        </p>
                        <Link to="/courses" className="btn-primary w-full">
                            Back to courses
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}