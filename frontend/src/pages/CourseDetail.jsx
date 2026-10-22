import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import ProgressRing from '../components/ProgressRing';

export default function CourseDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [course, setCourse] = useState(null);
    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [review, setReview] = useState({ rating: 5, comment: '' });
    const [openModule, setOpenModule] = useState(null);
    const [wishlisted, setWishlisted] = useState(false);

    const fetchCourse = () => {
        setLoading(true);
        api.get(`/courses/${slug}`)
            .then((r) => {
                setCourse(r.data);
                if (r.data.modules?.length > 0) setOpenModule(r.data.modules[0].id);
            })
            .catch(() => setCourse(null))
            .finally(() => setLoading(false));
    };

    const fetchCertificate = () => {
        if (!user || !course) return;
        api.get(`/certificates/by-course/${course.id}`)
            .then((r) => {
                if (r.data.certificate) setCertificate(r.data.certificate);
                else setCertificate(null);
            })
            .catch(() => setCertificate(null));
    };

    useEffect(() => { fetchCourse(); }, [slug, user]);
    useEffect(() => { fetchCertificate(); }, [user, course?.id]);

    useEffect(() => {
        if (!user || !course) return;
        api.get('/courses/wishlist/my')
            .then((r) => {
                const found = r.data.some((c) => c.id === course.id);
                setWishlisted(found);
            })
            .catch(() => {});
    }, [user, course?.id]);

    const enroll = async () => {
        if (!user) return navigate('/login');
        setBusy(true);
        try {
            const r = await api.post('/enrollments', { courseId: course.id });
            setMessage(r.data.message);
            fetchCourse();
        } catch (e) {
            setMessage(e.response?.data?.error || 'Enrollment failed');
        } finally { setBusy(false); }
    };

    const pay = () => navigate(`/checkout/${course.slug}`);

    const toggleWishlist = async () => {
        if (!user) return navigate('/login');
        try {
            const r = await api.post('/courses/wishlist', { courseId: course.id });
            setWishlisted(r.data.wishlisted);
        } catch {}
    };

    const submitReview = async (e) => {
        e.preventDefault();
        try {
            await api.post('/courses/reviews', { courseId: course.id, ...review });
            setMessage('Review submitted!');
            setReview({ rating: 5, comment: '' });
            fetchCourse();
        } catch (err) {
            setMessage(err.response?.data?.error || 'Failed to submit review');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fdfcfb]">
                <p className="text-slate-400">Loading course...</p>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="max-w-2xl mx-auto py-24 text-center px-4">
                <p className="text-6xl mb-4">😕</p>
                <p className="text-2xl font-display font-extrabold text-slate-900 mb-2">
                    Course not found
                </p>
                <p className="text-slate-500 mb-8">It may have been removed, or the link is incorrect.</p>
                <button onClick={() => navigate('/courses')} className="btn-primary">
                    Back to all courses
                </button>
            </div>
        );
    }

    const totalLessons = course.modules?.reduce((a, m) => a + (m.lessons?.length || 0), 0) || 0;
    const completed = course.completedLessonIds?.length || 0;
    const progress = totalLessons ? Math.round((completed / totalLessons) * 100) : 0;
    const firstLesson = course.modules?.flatMap((m) => m.lessons || [])[0];
    const isEnrolled = course.hasAccess;
    const isComplete = isEnrolled && progress === 100 && totalLessons > 0;
    const rating = parseFloat(course.avg_rating) || 0;
    const reviewCount = course.review_count || 0;
    const studentCount = course.student_count || 0;

    // Fake original price for anchoring (only for paid courses)
    const price = parseFloat(course.price) || 0;
    const originalPrice = price > 0 ? Math.round(price * 2) : 0;

    return (
        <div className="bg-[#fdfcfb]">
            {/* ======================================================
          HERO — full-bleed cinematic
          ====================================================== */}
            <section className="relative overflow-hidden bg-slate-900 text-white">
                {course.image_url && (
                    <div className="absolute inset-0">
                        <img src={course.image_url} alt="" className="w-full h-full object-cover opacity-25" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/85 to-slate-900/40" />
                    </div>
                )}
                {!course.image_url && (
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-800 via-brand-700 to-coral-600" />
                )}

                <div className="relative max-w-7xl mx-auto px-4 py-16 lg:py-20">
                    <Link
                        to="/courses"
                        className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-semibold mb-6 transition"
                    >
                        ← Back to all courses
                    </Link>

                    <div className="max-w-3xl">
                        <div className="flex flex-wrap gap-2 mb-5">
              <span className="px-3 py-1.5 rounded-full bg-brand-600/30 border border-brand-400/40 text-xs font-bold uppercase tracking-wide backdrop-blur">
                {course.category || 'Course'}
              </span>
                            <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold backdrop-blur">
                🎓 {course.level || 'Beginner'}
              </span>
                            <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold backdrop-blur">
                🌐 {course.language || 'English'}
              </span>
                            {course.featured && (
                                <span className="px-3 py-1.5 rounded-full bg-accent-500 text-xs font-bold text-brand-900">
                  ⭐ Featured
                </span>
                            )}
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold leading-[1.05] mb-5">
                            {course.title}
                        </h1>

                        <p className="text-lg md:text-xl text-white/85 mb-8 leading-relaxed">
                            {course.short_description}
                        </p>

                        {/* By-the-numbers strip */}
                        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="text-accent-400 text-xl">★</span>
                                <span className="font-display font-extrabold text-2xl text-white leading-none">
                  {rating.toFixed(1)}
                </span>
                                <span className="text-white/60">
                  ({reviewCount} rating{reviewCount !== 1 ? 's' : ''})
                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-white/60">👥</span>
                                <span className="font-display font-extrabold text-2xl text-white leading-none">
                  {studentCount}
                </span>
                                <span className="text-white/60">students</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-white/60">📚</span>
                                <span className="font-display font-extrabold text-2xl text-white leading-none">
                  {totalLessons}
                </span>
                                <span className="text-white/60">lessons</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-white/60">⏱️</span>
                                <span className="font-display font-extrabold text-2xl text-white leading-none">
                  {course.duration_hours || 0}
                </span>
                                <span className="text-white/60">hours</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ======================================================
          MAIN LAYOUT — content + sticky purchase panel
          ====================================================== */}
            <section className="max-w-7xl mx-auto px-4 py-12 grid lg:grid-cols-[1fr_400px] gap-10">
                {/* ---------- LEFT: main content ---------- */}
                <div className="min-w-0">
                    {/* Certificate highlight */}
                    <div className="rounded-3xl bg-gradient-to-r from-accent-50 via-white to-brand-50 border border-accent-200 p-5 mb-8 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-400 to-coral-500 grid place-items-center text-2xl shrink-0">
                            🏆
                        </div>
                        <div className="flex-1">
                            <p className="font-display font-extrabold text-slate-900">
                                Earn a certificate on completion
                            </p>
                            <p className="text-sm text-slate-600">
                                Finish every lesson and get a verifiable certificate you can share.
                            </p>
                        </div>
                        <Link
                            to="/certificates"
                            className="hidden md:inline-flex text-sm font-bold text-brand-600 hover:text-brand-700 whitespace-nowrap"
                        >
                            See examples →
                        </Link>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 mb-8 border-b border-slate-200 overflow-x-auto">
                        {[
                            ['overview', 'Overview'],
                            ['curriculum', `Curriculum (${course.modules?.length || 0} modules)`],
                            ['reviews', `Reviews (${reviewCount})`],
                        ].map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`px-6 py-3.5 font-bold text-sm whitespace-nowrap transition border-b-2 -mb-px ${
                                    activeTab === key
                                        ? 'border-brand-600 text-brand-700'
                                        : 'border-transparent text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* ============ OVERVIEW TAB ============ */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            {/* What you'll learn */}
                            {course.what_you_learn && (
                                <div className="card p-8">
                                    <h2 className="text-2xl font-display font-extrabold text-slate-900 mb-6">
                                        What you'll learn
                                    </h2>
                                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
                                        {course.what_you_learn
                                            .split(/\n|•/)
                                            .map((s) => s.trim())
                                            .filter((s) => s.length > 3)
                                            .map((point, i) => (
                                                <div key={i} className="flex gap-3 items-start">
                          <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 grid place-items-center text-xs font-bold shrink-0 mt-0.5">
                            ✓
                          </span>
                                                    <p className="text-slate-700 text-sm leading-relaxed">
                                                        {point}{!point.endsWith('.') ? '.' : ''}
                                                    </p>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* About this course */}
                            <div className="card p-8">
                                <h2 className="text-2xl font-display font-extrabold text-slate-900 mb-4">
                                    About this course
                                </h2>
                                <p className="text-slate-600 whitespace-pre-line leading-relaxed text-[15px]">
                                    {course.long_description}
                                </p>
                            </div>

                            {/* Entry requirements */}
                            <div className="card p-8">
                                <h2 className="text-2xl font-display font-extrabold text-slate-900 mb-4">
                                    Who this is for
                                </h2>
                                <div className="flex gap-3 items-start">
                  <span className="w-10 h-10 rounded-2xl bg-accent-100 text-accent-600 grid place-items-center shrink-0">
                    🎯
                  </span>
                                    <p className="text-slate-600 leading-relaxed pt-1">
                                        {course.entry_requirements || 'Open to everyone — no prior experience required.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ============ CURRICULUM TAB ============ */}
                    {activeTab === 'curriculum' && (
                        <div className="space-y-4">
                            {(!course.modules || course.modules.length === 0) && (
                                <div className="card p-16 text-center">
                                    <p className="text-5xl mb-4">📚</p>
                                    <p className="text-xl font-display font-extrabold text-slate-900 mb-2">
                                        Curriculum coming soon
                                    </p>
                                    <p className="text-slate-500">
                                        The instructor is still preparing the lessons for this course.
                                    </p>
                                </div>
                            )}

                            {course.modules?.map((m, mi) => {
                                const isOpen = openModule === m.id;
                                const completedInModule = m.lessons?.filter((l) =>
                                    course.completedLessonIds?.includes(l.id)
                                ).length || 0;
                                const moduleMinutes = (m.lessons || []).reduce(
                                    (a, l) => a + (l.duration_minutes || 0), 0
                                );

                                return (
                                    <div key={m.id} className="card overflow-hidden">
                                        <button
                                            onClick={() => setOpenModule(isOpen ? null : m.id)}
                                            className="w-full text-left p-5 flex items-center gap-4 hover:bg-slate-50 transition"
                                        >
                      <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-coral-400 text-white font-display font-extrabold grid place-items-center shrink-0 text-sm">
                        {mi + 1}
                      </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-display font-extrabold text-slate-900">
                                                    {m.title}
                                                </p>
                                                <p className="text-sm text-slate-500 mt-0.5">
                                                    {m.lessons?.length || 0} lessons
                                                    {moduleMinutes > 0 && ` · ${moduleMinutes} min`}
                                                    {course.hasAccess && completedInModule > 0 && (
                                                        <span className="text-brand-600 font-semibold">
                              {' '}· {completedInModule} done
                            </span>
                                                    )}
                                                </p>
                                            </div>
                                            <span className={`text-2xl text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                        ⌄
                      </span>
                                        </button>

                                        {isOpen && (
                                            <div className="border-t border-slate-100 bg-slate-50/50">
                                                {m.description && (
                                                    <p className="px-5 pt-4 text-sm text-slate-500 italic">
                                                        {m.description}
                                                    </p>
                                                )}
                                                <ul>
                                                    {m.lessons?.map((l, li) => {
                                                        const isDone = course.completedLessonIds?.includes(l.id);
                                                        const locked = !course.hasAccess && !l.is_preview;
                                                        return (
                                                            <li key={l.id} className="border-t border-slate-100 first:border-0">
                                                                <Link
                                                                    to={`/courses/${course.slug}/lessons/${l.id}`}
                                                                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-white transition"
                                                                >
                                  <span
                                      className={`w-7 h-7 rounded-full grid place-items-center text-xs font-bold shrink-0 ${
                                          isDone
                                              ? 'bg-green-500 text-white'
                                              : locked
                                                  ? 'bg-slate-200 text-slate-500'
                                                  : 'bg-white border-2 border-slate-200 text-slate-500'
                                      }`}
                                  >
                                    {isDone ? '✓' : locked ? '🔒' : li + 1}
                                  </span>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-medium text-slate-800 text-sm truncate">
                                                                            {l.title}
                                                                        </p>
                                                                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                                                                            {l.duration_minutes > 0 && (
                                                                                <span>⏱️ {l.duration_minutes} min</span>
                                                                            )}
                                                                            {l.is_preview && (
                                                                                <span className="text-brand-600 font-bold">
                                          ▶ FREE PREVIEW
                                        </span>
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                    <span className="text-slate-400">→</span>
                                                                </Link>
                                                            </li>
                                                        );
                                                    })}
                                                    {(!m.lessons || m.lessons.length === 0) && (
                                                        <li className="px-5 py-6 text-sm text-slate-400 italic text-center">
                                                            No lessons in this module yet.
                                                        </li>
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ============ REVIEWS TAB ============ */}
                    {activeTab === 'reviews' && (
                        <div className="space-y-6">
                            {/* Aggregate */}
                            <div className="card p-8">
                                <div className="flex flex-wrap items-center gap-8">
                                    <div className="text-center">
                                        <p className="text-6xl font-display font-extrabold text-slate-900 leading-none">
                                            {rating.toFixed(1)}
                                        </p>
                                        <div className="text-accent-500 text-2xl mt-2">
                                            {'★'.repeat(Math.round(rating))}
                                            <span className="text-slate-200">
                        {'★'.repeat(5 - Math.round(rating))}
                      </span>
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {reviewCount} rating{reviewCount !== 1 ? 's' : ''}
                                        </p>
                                    </div>

                                    <div className="flex-1 min-w-[200px] space-y-2">
                                        {[5, 4, 3, 2, 1].map((star) => {
                                            const count = course.reviews?.filter((r) => r.rating === star).length || 0;
                                            const pct = reviewCount ? Math.round((count / reviewCount) * 100) : 0;
                                            return (
                                                <div key={star} className="flex items-center gap-3">
                                                    <span className="text-sm font-semibold text-slate-600 w-8">{star}★</span>
                                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-accent-400 transition-all"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-slate-400 w-10 text-right">{pct}%</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* List */}
                            <div className="space-y-4">
                                {(!course.reviews || course.reviews.length === 0) && (
                                    <div className="card p-12 text-center">
                                        <p className="text-5xl mb-3">💬</p>
                                        <p className="text-lg font-display font-extrabold text-slate-900 mb-1">
                                            No reviews yet
                                        </p>
                                        <p className="text-slate-500">Be the first to share your experience.</p>
                                    </div>
                                )}

                                {course.reviews?.map((r) => (
                                    <div key={r.id} className="card p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-coral-400 text-white grid place-items-center font-bold shrink-0">
                                                {r.first_name?.[0] || 'U'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between gap-4 flex-wrap">
                                                    <div>
                                                        <p className="font-bold text-slate-900">
                                                            {r.first_name} {r.last_name}
                                                        </p>
                                                        <p className="text-xs text-slate-400">
                                                            {new Date(r.created_at).toLocaleDateString('en-ZA', {
                                                                year: 'numeric', month: 'long', day: 'numeric',
                                                            })}
                                                        </p>
                                                    </div>
                                                    <p className="text-accent-500 text-lg">
                                                        {'★'.repeat(r.rating)}
                                                        <span className="text-slate-200">
                              {'★'.repeat(5 - r.rating)}
                            </span>
                                                    </p>
                                                </div>
                                                {r.comment && (
                                                    <p className="text-slate-700 mt-3 leading-relaxed">{r.comment}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Leave a review */}
                            {course.hasAccess && (
                                <form onSubmit={submitReview} className="card p-6">
                                    <h3 className="font-display font-extrabold text-lg text-slate-900 mb-4">
                                        Share your experience
                                    </h3>
                                    <label className="label">Rating</label>
                                    <select
                                        value={review.rating}
                                        onChange={(e) => setReview({ ...review, rating: Number(e.target.value) })}
                                        className="input mb-4"
                                    >
                                        {[5, 4, 3, 2, 1].map((n) => (
                                            <option key={n} value={n}>
                                                {'★'.repeat(n)} ({n} star{n > 1 ? 's' : ''})
                                            </option>
                                        ))}
                                    </select>
                                    <label className="label">Comment</label>
                                    <textarea
                                        value={review.comment}
                                        onChange={(e) => setReview({ ...review, comment: e.target.value })}
                                        rows={4}
                                        className="input mb-4"
                                        placeholder="What did you think of the course?"
                                    />
                                    <button type="submit" className="btn-primary">Submit review</button>
                                </form>
                            )}
                        </div>
                    )}
                </div>

                {/* ---------- RIGHT: sticky purchase panel ---------- */}
                <aside className="lg:sticky lg:top-24 h-fit">
                    <div className="card p-6 shadow-pop">
                        {/* Image preview */}
                        {course.image_url ? (
                            <div className="rounded-2xl overflow-hidden mb-5">
                                <img src={course.image_url} alt="" className="w-full h-44 object-cover" />
                            </div>
                        ) : (
                            <div className="w-full h-44 rounded-2xl mb-5 bg-gradient-to-br from-brand-500 to-coral-400 grid place-items-center text-white font-display font-extrabold text-5xl">
                                {course.title[0]}
                            </div>
                        )}

                        {/* ---- Certificate-earned state ---- */}
                        {certificate ? (
                            <>
                                <div className="rounded-2xl bg-gradient-to-br from-green-50 to-accent-50 border border-green-200 p-4 text-center mb-5">
                                    <p className="text-3xl mb-1">🎉</p>
                                    <p className="font-display font-extrabold text-green-900">You completed this course</p>
                                    <p className="text-xs text-green-800 mt-1">Certificate earned</p>
                                </div>
                                <Link
                                    to={`/certificates/${certificate.verification_code}`}
                                    className="btn-primary w-full text-center"
                                >
                                    View certificate 🏆
                                </Link>
                            </>
                        ) : isEnrolled ? (
                            /* ---- Enrolled state ---- */
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase text-slate-500">Your progress</p>
                                        <p className="font-display font-extrabold text-slate-900 text-lg">
                                            {completed} / {totalLessons} lessons
                                        </p>
                                    </div>
                                    <ProgressRing percent={progress} size={64} stroke={6} />
                                </div>
                                {firstLesson ? (
                                    <Link
                                        to={
                                            course.modules
                                                ?.flatMap((m) => m.lessons || [])
                                                .find((l) => !course.completedLessonIds?.includes(l.id))
                                                ? `/courses/${course.slug}/lessons/${
                                                    course.modules
                                                        .flatMap((m) => m.lessons || [])
                                                        .find((l) => !course.completedLessonIds?.includes(l.id))?.id
                                                }`
                                                : `/courses/${course.slug}/lessons/${firstLesson.id}`
                                        }
                                        className="btn-primary w-full text-center"
                                    >
                                        {completed === 0 ? 'Start learning' : 'Continue learning'} →
                                    </Link>
                                ) : (
                                    <p className="text-sm text-slate-500">Curriculum coming soon.</p>
                                )}
                            </>
                        ) : (
                            /* ---- Purchase state ---- */
                            <>
                                {/* Price anchoring */}
                                {!course.is_free && originalPrice > 0 && (
                                    <div className="flex items-baseline gap-3 mb-1">
                    <span className="text-4xl font-display font-extrabold text-slate-900">
                      R{price}
                    </span>
                                        <span className="text-lg text-slate-400 line-through">
                      R{originalPrice}
                    </span>
                                        <span className="text-xs font-bold text-coral-500 bg-coral-50 px-2 py-1 rounded-full">
                      SAVE 50%
                    </span>
                                    </div>
                                )}
                                {course.is_free && (
                                    <p className="text-4xl font-display font-extrabold text-green-600 mb-1">
                                        Free
                                    </p>
                                )}
                                <p className="text-xs text-slate-500 mb-5">
                                    {course.is_free
                                        ? 'No payment required — enroll now.'
                                        : 'One-time payment · Lifetime access'}
                                </p>

                                {message && (
                                    <div className="bg-brand-50 border border-brand-200 text-brand-800 p-3 rounded-xl text-sm mb-4">
                                        {message}
                                    </div>
                                )}

                                {!user ? (
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="btn-primary w-full mb-3"
                                    >
                                        Log in to enroll
                                    </button>
                                ) : (
                                    <>
                                        {course.is_free ? (
                                            <button
                                                onClick={enroll}
                                                disabled={busy}
                                                className="btn-primary w-full mb-3"
                                            >
                                                {busy ? 'Enrolling...' : 'Enroll for free'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={pay}
                                                className="btn-accent w-full mb-3"
                                            >
                                                Buy now — R{price}
                                            </button>
                                        )}
                                        <button
                                            onClick={toggleWishlist}
                                            className="btn-ghost w-full mb-3"
                                        >
                                            {wishlisted ? '♥ In wishlist' : '♡ Add to wishlist'}
                                        </button>
                                    </>
                                )}

                                {/* Value stack */}
                                <div className="mt-5 pt-5 border-t border-slate-100 space-y-3 text-sm">
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                                        This course includes
                                    </p>
                                    {[
                                        ['📚', `${totalLessons} lessons · ${course.duration_hours || 0} hours`],
                                        ['💻', 'Interactive code exercises'],
                                        ['🏆', 'Certificate of completion'],
                                        ['♾️', 'Full lifetime access'],
                                        ['📱', 'Access on mobile and desktop'],
                                    ].map(([icon, label]) => (
                                        <div key={label} className="flex items-center gap-3 text-slate-700">
                                            <span>{icon}</span>
                                            <span>{label}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Guarantee */}
                                <div className="mt-5 pt-5 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-500">
                                    <span className="text-2xl">🛡️</span>
                                    <span>30-day money-back guarantee. No questions asked.</span>
                                </div>
                            </>
                        )}
                    </div>
                </aside>
            </section>
        </div>
    );
}