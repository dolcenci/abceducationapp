import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import LessonContent from '../components/LessonContent';
import BlockRenderer from '../components/blocks/BlockRenderer';

export default function LessonPage() {
    const { slug, lessonId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [course, setCourse] = useState(null);
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchCourse = () => {
        setLoading(true);
        api.get(`/courses/${slug}`)
            .then((r) => setCourse(r.data))
            .catch(() => setError('Course not found'))
            .finally(() => setLoading(false));
    };

    const fetchBlocks = () => {
        if (!lessonId) return;
        api.get(`/courses/lessons/${lessonId}/blocks`)
            .then((r) => setBlocks(r.data || []))
            .catch(() => setBlocks([]));
    };

    useEffect(() => { fetchCourse(); }, [slug, user]);
    useEffect(() => { fetchBlocks(); }, [lessonId]);

    const flatLessons = useMemo(() => {
        if (!course?.modules) return [];
        const list = [];
        course.modules.forEach((m) => {
            (m.lessons || []).forEach((l) => {
                list.push({ ...l, moduleTitle: m.title, moduleId: m.id });
            });
        });
        return list;
    }, [course]);

    const currentIndex = flatLessons.findIndex((l) => String(l.id) === String(lessonId));
    const currentLesson = flatLessons[currentIndex] || null;
    const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
    const nextLesson =
        currentIndex >= 0 && currentIndex < flatLessons.length - 1
            ? flatLessons[currentIndex + 1]
            : null;

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (currentLesson && course?.hasAccess && !course.completedLessonIds?.includes(currentLesson.id)) {
            const t = setTimeout(() => {
                api.post('/courses/lessons/complete', { lessonId: currentLesson.id })
                    .then(() => fetchCourse())
                    .catch(() => {});
            }, 4000);
            return () => clearTimeout(t);
        }
    }, [lessonId, course?.hasAccess]);

    if (loading) {
        return <p className="text-center py-24 text-slate-400">Loading lesson...</p>;
    }

    if (error || !course) {
        return (
            <div className="max-w-2xl mx-auto py-24 text-center px-4">
                <p className="text-5xl mb-4">😕</p>
                <p className="text-xl font-display font-extrabold text-slate-900 mb-2">
                    {error || 'Something went wrong'}
                </p>
                <Link to="/courses" className="btn-primary mt-6">Back to courses</Link>
            </div>
        );
    }

    if (!currentLesson) {
        return (
            <div className="max-w-2xl mx-auto py-24 text-center px-4">
                <p className="text-5xl mb-4">🔍</p>
                <p className="text-xl font-display font-extrabold text-slate-900 mb-2">
                    Lesson not found
                </p>
                <Link to={`/courses/${slug}`} className="btn-primary mt-6">
                    Back to course
                </Link>
            </div>
        );
    }

    const isLocked = !course.hasAccess && !currentLesson.is_preview;

    return (
        <div className="bg-[#fdfcfb] min-h-screen">
            {/* TOP BAR */}
            <section className="bg-white border-b border-slate-100 sticky top-16 z-30">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
                    <Link
                        to={`/courses/${slug}`}
                        className="text-brand-600 hover:text-brand-700 text-sm font-semibold whitespace-nowrap"
                    >
                        ← {course.title}
                    </Link>
                    {course.hasAccess && (
                        <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                            <span>Lesson {currentIndex + 1} of {flatLessons.length}</span>
                            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-brand-600 to-coral-500 transition-all"
                                    style={{
                                        width: `${
                                            flatLessons.length
                                                ? ((course.completedLessonIds?.length || 0) / flatLessons.length) * 100
                                                : 0
                                        }%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[280px_1fr] gap-8">
                {/* SIDEBAR */}
                <aside className="hidden lg:block">
                    <div className="card p-4 sticky top-36 max-h-[calc(100vh-10rem)] overflow-y-auto">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 px-2">
                            Course Content
                        </p>
                        {course.modules?.map((m, mi) => (
                            <div key={m.id} className="mb-3">
                                <p className="text-xs font-bold text-slate-600 px-2 py-1.5 uppercase">
                                    {mi + 1}. {m.title}
                                </p>
                                <ul className="space-y-0.5">
                                    {m.lessons?.map((l) => {
                                        const isCurrent = String(l.id) === String(lessonId);
                                        const isDone = course.completedLessonIds?.includes(l.id);
                                        const locked = !course.hasAccess && !l.is_preview;
                                        return (
                                            <li key={l.id}>
                                                <Link
                                                    to={`/courses/${slug}/lessons/${l.id}`}
                                                    className={`flex items-start gap-2 px-2 py-2 rounded-lg text-sm transition ${
                                                        isCurrent
                                                            ? 'bg-brand-50 text-brand-700 font-semibold'
                                                            : 'text-slate-600 hover:bg-slate-50'
                                                    }`}
                                                >
                          <span
                              className={`w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold shrink-0 mt-0.5 ${
                                  isDone
                                      ? 'bg-green-500 text-white'
                                      : isCurrent
                                          ? 'bg-brand-600 text-white'
                                          : 'bg-slate-100 text-slate-500'
                              }`}
                          >
                            {isDone ? '✓' : locked ? '🔒' : ''}
                          </span>
                                                    <span className="flex-1 leading-snug">{l.title}</span>
                                                    {l.duration_minutes > 0 && (
                                                        <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">
                              {l.duration_minutes}m
                            </span>
                                                    )}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* MAIN */}
                <main className="min-w-0">
                    <div className="mb-8">
                        <p className="text-sm font-bold text-brand-600 uppercase tracking-wide mb-2">
                            {currentLesson.moduleTitle}
                        </p>
                        <h1 className="text-3xl md:text-4xl font-display font-extrabold text-slate-900 mb-3 leading-tight">
                            {currentLesson.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                            {currentLesson.duration_minutes > 0 && (
                                <span className="flex items-center gap-1.5">
                  ⏱️ {currentLesson.duration_minutes} min read
                </span>
                            )}
                            {currentLesson.is_preview && (
                                <span className="px-2.5 py-1 rounded-full bg-brand-100 text-brand-700 font-bold text-xs">
                  FREE PREVIEW
                </span>
                            )}
                        </div>
                    </div>

                    {isLocked ? (
                        <div className="card p-12 text-center">
                            <p className="text-6xl mb-4">🔒</p>
                            <p className="text-2xl font-display font-extrabold text-slate-900 mb-2">
                                This lesson is locked
                            </p>
                            <p className="text-slate-500 mb-8 max-w-md mx-auto">
                                Enroll in <strong>{course.title}</strong> to unlock every lesson
                                and track your progress.
                            </p>
                            <Link to={`/courses/${slug}`} className="btn-primary">
                                View course & enroll
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Blocks take priority; fall back to legacy Markdown */}
                            {blocks.length > 0 ? (
                                <div>
                                    {blocks.map((b) => (
                                        <BlockRenderer key={b.id} block={b} />
                                    ))}
                                </div>
                            ) : currentLesson.content_md || currentLesson.content ? (
                                <LessonContent
                                    markdown={currentLesson.content_md || currentLesson.content}
                                />
                            ) : (
                                <div className="card p-8 text-slate-500 italic">
                                    The instructor hasn't added content to this lesson yet.
                                </div>
                            )}

                            {currentLesson.video_url && (
                                <div className="mt-10">
                                    <h3 className="font-display font-extrabold text-xl text-slate-900 mb-3">
                                        Watch the lesson
                                    </h3>
                                    <div className="rounded-2xl overflow-hidden shadow-card aspect-video">
                                        <iframe
                                            src={currentLesson.video_url}
                                            title={currentLesson.title}
                                            className="w-full h-full"
                                            allowFullScreen
                                        />
                                    </div>
                                </div>
                            )}

                            {Array.isArray(currentLesson.resources) && currentLesson.resources.length > 0 && (
                                <div className="mt-10">
                                    <h3 className="font-display font-extrabold text-xl text-slate-900 mb-3">
                                        Resources
                                    </h3>
                                    <ul className="space-y-2">
                                        {currentLesson.resources.map((r, i) => (
                                            <li key={i}>
                                                <a
                                                    href={r.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-slate-100 hover:border-brand-300 transition"
                                                >
                          <span className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 grid place-items-center">
                            📎
                          </span>
                                                    <span className="font-semibold text-slate-800">{r.name}</span>
                                                    <span className="ml-auto text-slate-400">↗</span>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="mt-14 pt-8 border-t border-slate-200 flex items-center justify-between gap-4">
                                {prevLesson ? (
                                    <Link
                                        to={`/courses/${slug}/lessons/${prevLesson.id}`}
                                        className="btn-ghost flex-1 md:flex-none md:w-auto"
                                    >
                                        ← Previous
                                    </Link>
                                ) : (
                                    <div className="flex-1 md:flex-none" />
                                )}

                                {nextLesson ? (
                                    <Link
                                        to={`/courses/${slug}/lessons/${nextLesson.id}`}
                                        className="btn-primary flex-1 md:flex-none md:w-auto"
                                    >
                                        Next: {nextLesson.title.length > 30
                                        ? nextLesson.title.slice(0, 30) + '…'
                                        : nextLesson.title} →
                                    </Link>
                                ) : (
                                    <Link to={`/courses/${slug}`} className="btn-primary">
                                        Finish course ✓
                                    </Link>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </section>
        </div>
    );
}