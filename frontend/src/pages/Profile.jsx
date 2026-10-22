import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import ProgressRing from '../components/ProgressRing';

export default function Profile() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/users/dashboard')
            .then((r) => setData(r.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p className="text-center py-24 text-slate-400">Loading profile...</p>;
    if (!data) return <p className="text-center py-24 text-slate-400">Couldn't load profile.</p>;

    const { stats, enrollments } = data;

    return (
        <div className="bg-[#fdfcfb] min-h-screen">
            <section className="relative overflow-hidden">
                <div className="blob w-[350px] h-[350px] bg-brand-400 -top-32 -left-20" />

                <div className="relative max-w-4xl mx-auto px-4 pt-12 pb-8">
                    <div className="card p-8 flex flex-col md:flex-row items-center gap-6">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-500 via-coral-400 to-accent-400 grid place-items-center text-white text-4xl font-display font-extrabold shrink-0">
                            {user?.firstName?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-3xl font-display font-extrabold text-slate-900">
                                {user?.firstName} {user?.lastName}
                            </h1>
                            <p className="text-slate-500">{user?.email}</p>
                            <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                <span className="px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
                  🔥 {data.user.current_streak || 0} day streak
                </span>
                                <span className="px-3 py-1 rounded-full bg-accent-100 text-accent-700 text-xs font-bold">
                  🏆 Best: {data.user.longest_streak || 0}
                </span>
                                {user?.isAdmin && (
                                    <span className="px-3 py-1 rounded-full bg-coral-100 text-coral-600 text-xs font-bold">
                    ADMIN
                  </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="max-w-4xl mx-auto px-4 pb-16">
                <h2 className="text-2xl font-display font-extrabold text-slate-900 mb-4">
                    Lifetime stats
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <StatBox icon="📚" value={stats.courses_enrolled} label="Enrolled" />
                    <StatBox icon="✅" value={stats.lessons_completed} label="Lessons done" />
                    <StatBox icon="🧪" value={stats.exercises_passed} label="Exercises" />
                    <StatBox icon="❓" value={stats.quizzes_correct} label="Quizzes right" />
                </div>

                <h2 className="text-2xl font-display font-extrabold text-slate-900 mb-4">
                    My Courses
                </h2>
                {enrollments.length === 0 ? (
                    <p className="text-slate-500">You haven't enrolled in any courses yet.</p>
                ) : (
                    <div className="space-y-3">
                        {enrollments.map((e) => (
                            <Link
                                key={e.enrollment_id}
                                to={`/courses/${e.slug}`}
                                className="card card-hover p-4 flex items-center gap-4 transition"
                            >
                                <ProgressRing percent={e.progress_percent} size={64} stroke={6} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-display font-extrabold text-slate-900 truncate">
                                        {e.title}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {e.completed_lessons} of {e.lesson_count} lessons
                                        {e.payment_status === 'pending' && (
                                            <span className="text-amber-600 font-semibold"> · Payment due</span>
                                        )}
                                    </p>
                                </div>
                                <span className="text-slate-400 text-xl">→</span>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function StatBox({ icon, value, label }) {
    return (
        <div className="card p-5 text-center">
            <p className="text-3xl mb-1">{icon}</p>
            <p className="text-3xl font-display font-extrabold text-slate-900 leading-none">{value}</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-2">
                {label}
            </p>
        </div>
    );
}