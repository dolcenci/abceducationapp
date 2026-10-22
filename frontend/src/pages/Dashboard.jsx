import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import ProgressRing from '../components/ProgressRing';

export default function Dashboard() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/users/dashboard')
            .then((r) => setData(r.data))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <p className="text-center py-24 text-slate-400">Loading your dashboard...</p>;
    }
    if (!data) {
        return (
            <div className="max-w-2xl mx-auto py-24 text-center px-4">
                <p className="text-5xl mb-4">😕</p>
                <p className="text-xl font-display font-extrabold text-slate-900 mb-2">
                    Couldn't load your dashboard
                </p>
                <button onClick={() => window.location.reload()} className="btn-primary mt-6">
                    Retry
                </button>
            </div>
        );
    }

    const { enrollments, stats, activity, recommended } = data;
    const firstName = user?.firstName || 'there';

    const inProgress = enrollments.filter((e) => ['paid', 'free'].includes(e.payment_status) && e.progress_percent < 100);
    const completed = enrollments.filter((e) => ['paid', 'free'].includes(e.payment_status) && e.progress_percent === 100);
    const unpaid = enrollments.filter((e) => e.payment_status === 'pending');

    // Continue where you left off — most recently enrolled in-progress course
    const continueCourse = inProgress[0] || null;

    return (
        <div className="bg-[#fdfcfb] min-h-screen">
            {/* ============ HERO ============ */}
            <section className="relative overflow-hidden">
                <div className="blob w-[400px] h-[400px] bg-brand-400 -top-32 -left-20" />
                <div className="blob w-[350px] h-[350px] bg-coral-400 top-0 right-0" />

                <div className="relative max-w-7xl mx-auto px-4 pt-12 pb-16">
                    <div className="flex flex-wrap items-center justify-between gap-6">
                        <div>
                            <p className="text-sm font-bold text-brand-600 uppercase tracking-wide mb-2">
                                My Learning
                            </p>
                            <h1 className="text-4xl md:text-5xl font-display font-extrabold text-slate-900 mb-2">
                                Welcome back, {firstName}.
                            </h1>
                            <p className="text-slate-600 text-lg">
                                {stats.courses_enrolled === 0
                                    ? "You haven't enrolled in a course yet. Let's change that."
                                    : `You're enrolled in ${stats.courses_enrolled} course${stats.courses_enrolled > 1 ? 's' : ''}. Keep going.`}
                            </p>
                        </div>

                        {/* Streak widget */}
                        <div className="card px-6 py-5 flex items-center gap-4">
                            <div className="text-5xl">🔥</div>
                            <div>
                                <p className="text-3xl font-display font-extrabold text-slate-900 leading-none">
                                    {data.user.current_streak || 0}
                                </p>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">
                                    day streak
                                </p>
                                {data.user.longest_streak > 0 && (
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Best: {data.user.longest_streak}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============ CONTINUE LEARNING ============ */}
            {continueCourse && (
                <section className="max-w-7xl mx-auto px-4 pb-8">
                    <div className="relative rounded-3xl overflow-hidden shadow-pop">
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-700 via-brand-600 to-coral-500" />
                        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />

                        <div className="relative grid md:grid-cols-[1fr_auto] gap-6 p-8 items-center text-white">
                            <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-wide text-white/80 mb-2">
                                    Continue where you left off
                                </p>
                                <h2 className="text-2xl md:text-3xl font-display font-extrabold mb-2 truncate">
                                    {continueCourse.title}
                                </h2>
                                {continueCourse.next_lesson ? (
                                    <p className="text-white/80 mb-5">
                                        Next up: <span className="font-semibold">{continueCourse.next_lesson.module_title}</span> · {continueCourse.next_lesson.title}
                                    </p>
                                ) : (
                                    <p className="text-white/80 mb-5">All lessons complete. Nice work!</p>
                                )}
                                <Link
                                    to={continueCourse.next_lesson
                                        ? `/courses/${continueCourse.slug}/lessons/${continueCourse.next_lesson.id}`
                                        : `/courses/${continueCourse.slug}`}
                                    className="btn bg-white text-brand-700 hover:bg-slate-100 inline-flex"
                                >
                                    {continueCourse.next_lesson ? 'Resume lesson →' : 'Review course →'}
                                </Link>
                            </div>

                            <div className="hidden md:flex items-center gap-4">
                                <ProgressRing
                                    percent={continueCourse.progress_percent}
                                    size={110}
                                    stroke={10}
                                    color="#ffffff"
                                    bg="rgba(255,255,255,0.2)"
                                />
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ============ STATS GRID ============ */}
            <section className="max-w-7xl mx-auto px-4 pb-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon="📚" value={stats.courses_enrolled} label="Courses enrolled" gradient="from-brand-500 to-brand-700" />
                    <StatCard icon="✅" value={stats.lessons_completed} label="Lessons completed" gradient="from-coral-400 to-coral-600" />
                    <StatCard icon="🧪" value={stats.exercises_passed} label="Exercises passed" gradient="from-teal-400 to-teal-600" />
                    <StatCard icon="⚡" value={stats.code_runs} label="Code runs" gradient="from-accent-400 to-accent-600" />
                </div>
            </section>

            {/* ============ MY COURSES ============ */}
            <section className="max-w-7xl mx-auto px-4 pb-16">
                <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
                    <div>
                        <h2 className="text-3xl font-display font-extrabold text-slate-900">
                            My Courses
                        </h2>
                        <p className="text-slate-500 mt-1">
                            {inProgress.length > 0
                                ? `${inProgress.length} in progress · ${completed.length} completed`
                                : completed.length > 0
                                    ? `${completed.length} completed`
                                    : 'Enroll in a course to get started'}
                        </p>
                    </div>
                    <Link to="/courses" className="btn-ghost text-sm">
                        Browse more courses →
                    </Link>
                </div>

                {enrollments.length === 0 ? (
                    <div className="card p-16 text-center">
                        <p className="text-6xl mb-4">📚</p>
                        <p className="text-xl font-display font-extrabold text-slate-900 mb-2">
                            Nothing here yet
                        </p>
                        <p className="text-slate-500 mb-6">
                            Find a course that interests you and start learning today.
                        </p>
                        <Link to="/courses" className="btn-primary">Browse courses</Link>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {enrollments.map((e) => (
                            <CourseProgressCard key={e.enrollment_id} enrollment={e} />
                        ))}
                    </div>
                )}
            </section>

            {/* ============ UNPAID ALERT ============ */}
            {unpaid.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 pb-16">
                    <div className="rounded-3xl bg-amber-50 border border-amber-200 p-6 md:p-8 flex flex-wrap items-center gap-4">
                        <div className="text-4xl">⏳</div>
                        <div className="flex-1 min-w-[200px]">
                            <p className="font-display font-extrabold text-lg text-amber-900">
                                {unpaid.length === 1 ? 'One course is waiting for payment' : `${unpaid.length} courses are waiting for payment`}
                            </p>
                            <p className="text-amber-800 text-sm mt-1">
                                Complete payment to unlock every lesson and track your progress.
                            </p>
                        </div>
                        <Link to={`/courses/${unpaid[0].slug}`} className="btn-accent">
                            Complete payment →
                        </Link>
                    </div>
                </section>
            )}

            {/* ============ ACTIVITY + RECOMMENDED ============ */}
            <section className="max-w-7xl mx-auto px-4 pb-20 grid lg:grid-cols-3 gap-8">
                {/* Activity feed */}
                <div className="lg:col-span-2">
                    <h2 className="text-2xl font-display font-extrabold text-slate-900 mb-4">
                        Recent activity
                    </h2>
                    {activity.length === 0 ? (
                        <div className="card p-8 text-slate-500 italic">
                            No activity yet. Complete a lesson, answer a quiz, or run some code to see it here.
                        </div>
                    ) : (
                        <div className="card divide-y divide-slate-100">
                            {activity.map((a, i) => (
                                <div key={i} className="flex items-start gap-4 p-4">
                                    <div className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${
                                        a.type === 'lesson_completed' ? 'bg-green-100 text-green-700' :
                                            a.type === 'quiz_answered' ? 'bg-brand-100 text-brand-700' :
                                                'bg-coral-100 text-coral-600'
                                    }`}>
                                        {a.type === 'lesson_completed' ? '✅' :
                                            a.type === 'quiz_answered' ? '❓' : '🧪'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-800">
                                            {a.label}
                                        </p>
                                        <p className="text-sm text-slate-500 mt-0.5 truncate">
                                            <Link to={`/courses/${a.course_slug}`} className="text-brand-600 hover:text-brand-700 font-medium">
                                                {a.course_title}
                                            </Link>
                                        </p>
                                    </div>
                                    <p className="text-xs text-slate-400 whitespace-nowrap">
                                        {timeAgo(a.happened_at)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recommended */}
                <div>
                    <h2 className="text-2xl font-display font-extrabold text-slate-900 mb-4">
                        Recommended for you
                    </h2>
                    {recommended.length === 0 ? (
                        <div className="card p-6 text-slate-500 italic text-sm">
                            You're enrolled in everything we've got. Impressive.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recommended.map((c) => (
                                <Link
                                    key={c.id}
                                    to={`/courses/${c.slug}`}
                                    className="card card-hover flex gap-3 p-3 items-center transition"
                                >
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                                        {c.image_url ? (
                                            <img src={c.image_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-brand-500 to-coral-400 grid place-items-center text-white font-extrabold">
                                                {c.title[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug">
                                            {c.title}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {c.category} · {c.is_free ? 'Free' : `R${c.price}`}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

function StatCard({ icon, value, label, gradient }) {
    return (
        <div className="card p-5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} grid place-items-center text-white text-lg mb-3`}>
                {icon}
            </div>
            <p className="text-3xl font-display font-extrabold text-slate-900 leading-none">
                {value}
            </p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-2">
                {label}
            </p>
        </div>
    );
}

function CourseProgressCard({ enrollment }) {
    const isUnpaid = enrollment.payment_status === 'pending';
    const isComplete = enrollment.progress_percent === 100 && !isUnpaid;

    const target = enrollment.next_lesson
        ? `/courses/${enrollment.slug}/lessons/${enrollment.next_lesson.id}`
        : `/courses/${enrollment.slug}`;

    return (
        <Link to={target} className="card card-hover overflow-hidden flex flex-col transition group">
            <div className="relative h-36 bg-slate-100">
                {enrollment.image_url ? (
                    <img
                        src={enrollment.image_url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-500 to-coral-400 grid place-items-center text-white font-extrabold text-3xl">
                        {enrollment.title[0]}
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 text-xs font-bold text-slate-800">
          {enrollment.category}
        </span>
                {isUnpaid && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-amber-400 text-xs font-bold text-amber-900">
            PAYMENT DUE
          </span>
                )}
                {isComplete && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-green-500 text-xs font-bold text-white">
            ✓ COMPLETE
          </span>
                )}
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-display font-extrabold text-base text-slate-900 mb-3 line-clamp-2 leading-snug">
                    {enrollment.title}
                </h3>

                {!isUnpaid && (
                    <div className="mb-3">
                        <div className="flex justify-between text-xs text-slate-600 font-semibold mb-1.5">
                            <span>{enrollment.completed_lessons} of {enrollment.lesson_count} lessons</span>
                            <span>{enrollment.progress_percent}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-brand-600 to-coral-500 transition-all duration-500"
                                style={{ width: `${enrollment.progress_percent}%` }}
                            />
                        </div>
                    </div>
                )}

                {isUnpaid && (
                    <p className="text-sm text-amber-700 font-semibold">
                        Complete payment to unlock
                    </p>
                )}

                {!isUnpaid && enrollment.next_lesson && (
                    <p className="text-xs text-slate-500 mt-auto pt-3 truncate">
                        Next: {enrollment.next_lesson.title}
                    </p>
                )}
            </div>
        </Link>
    );
}

function timeAgo(timestamp) {
    const date = new Date(timestamp);
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
}