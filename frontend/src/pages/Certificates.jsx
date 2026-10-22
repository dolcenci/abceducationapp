import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function Certificates() {
    const [certs, setCerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/certificates/my')
            .then((r) => setCerts(r.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p className="text-center py-24 text-slate-400">Loading certificates...</p>;

    return (
        <div className="bg-[#fdfcfb] min-h-screen">
            <section className="relative overflow-hidden">
                <div className="blob w-[400px] h-[400px] bg-accent-300 -top-32 -left-20" />
                <div className="blob w-[350px] h-[350px] bg-brand-400 top-0 right-0" />

                <div className="relative max-w-5xl mx-auto px-4 pt-12 pb-10">
          <span className="inline-block text-sm font-bold text-accent-600 uppercase tracking-wide mb-3">
            Achievements
          </span>
                    <h1 className="text-4xl md:text-5xl font-display font-extrabold text-slate-900 mb-3">
                        Your Certificates
                    </h1>
                    <p className="text-slate-600 text-lg">
                        Every course you complete earns you a shareable, verifiable certificate.
                    </p>
                </div>
            </section>

            <section className="max-w-5xl mx-auto px-4 pb-20">
                {certs.length === 0 ? (
                    <div className="card p-16 text-center">
                        <p className="text-6xl mb-4">🏆</p>
                        <p className="text-xl font-display font-extrabold text-slate-900 mb-2">
                            No certificates yet
                        </p>
                        <p className="text-slate-500 mb-6">
                            Finish every lesson in a course to earn your first one.
                        </p>
                        <Link to="/courses" className="btn-primary">Browse courses</Link>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        {certs.map((c) => (
                            <Link
                                key={c.id}
                                to={`/certificates/${c.verification_code}`}
                                className="card card-hover overflow-hidden transition group"
                            >
                                <div className="relative h-32 bg-gradient-to-br from-brand-600 via-brand-500 to-accent-500 grid place-items-center">
                                    <span className="text-5xl">🏆</span>
                                </div>
                                <div className="p-6">
                                    <p className="text-xs font-bold uppercase tracking-wide text-brand-600 mb-2">
                                        Certificate of Completion
                                    </p>
                                    <h3 className="font-display font-extrabold text-lg text-slate-900 mb-1 group-hover:text-brand-700 transition">
                                        {c.course_title}
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        Issued to {c.student_name}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-3">
                                        {new Date(c.issued_at).toLocaleDateString('en-ZA', {
                                            year: 'numeric', month: 'long', day: 'numeric'
                                        })}
                                        {' · '}
                                        <span className="font-mono">{c.verification_code}</span>
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}