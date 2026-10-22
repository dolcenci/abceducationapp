import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';

const categories = [
    { name: 'Programming', icon: '💻', gradient: 'from-brand-500 to-sky-400' },
    { name: 'Business',    icon: '📈', gradient: 'from-teal-500 to-emerald-400' },
    { name: 'Design',      icon: '🎨', gradient: 'from-coral-500 to-accent-400' },
    { name: 'Psychology',  icon: '🧠', gradient: 'from-accent-400 to-coral-400' },
    { name: 'Law',         icon: '⚖️', gradient: 'from-slate-700 to-brand-600' },
    { name: 'Finance',     icon: '💰', gradient: 'from-accent-500 to-brand-500' },
];
const levels = ['Beginner', 'Intermediate', 'Advanced'];

export default function CoursesList() {
    const [params, setParams] = useSearchParams();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(params.get('search') || '');
    const category = params.get('category') || '';
    const level = params.get('level') || '';
    const freeOnly = params.get('freeOnly') === 'true';

    useEffect(() => {
        const qs = new URLSearchParams();
        if (search) qs.set('search', search);
        if (category) qs.set('category', category);
        if (level) qs.set('level', level);
        if (freeOnly) qs.set('freeOnly', 'true');

        setLoading(true);
        api.get(`/courses?${qs.toString()}`)
            .then((r) => setCourses(r.data))
            .finally(() => setLoading(false));
    }, [search, category, level, freeOnly]);

    const update = (key, value) => {
        const next = new URLSearchParams(params);
        if (value) next.set(key, value); else next.delete(key);
        setParams(next);
    };

    const clearAll = () => {
        setSearch('');
        setParams(new URLSearchParams());
    };

    const hasFilters = search || category || level || freeOnly;

    return (
        <div className="bg-[#fdfcfb] min-h-screen">
            {/* ================= PAGE HEADER ================= */}
            <section className="relative overflow-hidden">
                <div className="blob w-[400px] h-[400px] bg-brand-400 -top-32 -left-20" />
                <div className="blob w-[350px] h-[350px] bg-coral-400 top-0 right-0" />

                <div className="relative max-w-7xl mx-auto px-4 pt-16 pb-12">
          <span className="inline-block text-sm font-bold text-brand-600 uppercase tracking-wide mb-3">
            Course Library
          </span>
                    <h1 className="text-5xl md:text-6xl font-display font-extrabold text-slate-900 mb-4 leading-tight">
                        Find your next <span className="text-gradient">skill.</span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl">
                        {courses.length} {courses.length === 1 ? 'course' : 'courses'} to choose from.
                        Filter by category, level, or price to find your perfect fit.
                    </p>
                </div>
            </section>

            {/* ================= CATEGORY PILLS ================= */}
            <section className="max-w-7xl mx-auto px-4 pb-8">
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => update('category', '')}
                        className={`px-5 py-2.5 rounded-full text-sm font-bold transition ${
                            !category
                                ? 'bg-brand-600 text-white shadow-soft'
                                : 'bg-white text-slate-700 border border-slate-200 hover:border-brand-400'
                        }`}
                    >
                        All Courses
                    </button>
                    {categories.map((c) => (
                        <button
                            key={c.name}
                            onClick={() => update('category', c.name)}
                            className={`px-5 py-2.5 rounded-full text-sm font-bold transition flex items-center gap-2 ${
                                category === c.name
                                    ? `bg-gradient-to-r ${c.gradient} text-white shadow-soft`
                                    : 'bg-white text-slate-700 border border-slate-200 hover:border-brand-400'
                            }`}
                        >
                            <span>{c.icon}</span>
                            {c.name}
                        </button>
                    ))}
                </div>
            </section>

            {/* ================= FILTER PANEL ================= */}
            <section className="max-w-7xl mx-auto px-4 pb-10">
                <div className="card p-6">
                    <div className="grid md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-5">
                            <label className="label">Search</label>
                            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  🔍
                </span>
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="What do you want to learn?"
                                    className="input pl-11"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-3">
                            <label className="label">Level</label>
                            <select
                                value={level}
                                onChange={(e) => update('level', e.target.value)}
                                className="input"
                            >
                                <option value="">All levels</option>
                                {levels.map((l) => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="label">Price</label>
                            <select
                                value={freeOnly ? 'free' : 'all'}
                                onChange={(e) => update('freeOnly', e.target.value === 'free' ? 'true' : '')}
                                className="input"
                            >
                                <option value="all">All prices</option>
                                <option value="free">Free only</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            {hasFilters && (
                                <button
                                    onClick={clearAll}
                                    className="btn-ghost w-full text-sm"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= RESULTS ================= */}
            <section className="max-w-7xl mx-auto px-4 pb-24">
                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="card overflow-hidden animate-pulse">
                                <div className="h-48 bg-slate-100" />
                                <div className="p-6 space-y-3">
                                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                                    <div className="h-5 bg-slate-100 rounded w-4/5" />
                                    <div className="h-3 bg-slate-100 rounded w-full" />
                                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : courses.length === 0 ? (
                    <div className="card p-20 text-center">
                        <p className="text-6xl mb-4">🔍</p>
                        <p className="text-2xl font-display font-extrabold text-slate-900 mb-2">
                            No courses found
                        </p>
                        <p className="text-slate-500 mb-6">
                            Try adjusting your filters or searching for something else.
                        </p>
                        {hasFilters && (
                            <button onClick={clearAll} className="btn-primary">
                                Clear all filters
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-sm text-slate-500 font-semibold">
                                Showing {courses.length} {courses.length === 1 ? 'course' : 'courses'}
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.map((c) => (
                                <CourseCard key={c.id} course={c} />
                            ))}
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}

function CourseCard({ course }) {
    const free = course.is_free;
    return (
        <Link
            to={`/courses/${course.slug || course.id}`}
            className="card card-hover overflow-hidden flex flex-col transition group"
        >
            <div className="relative h-52 bg-slate-100">
                {course.image_url ? (
                    <img
                        src={course.image_url}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-500 to-coral-400 grid place-items-center text-white font-display font-extrabold text-5xl">
                        {course.title?.[0] || 'C'}
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur text-xs font-bold text-slate-800">
          {course.category || 'Course'}
        </span>
                {free && (
                    <span className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-accent-400 text-xs font-bold text-brand-900">
            FREE
          </span>
                )}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs font-semibold">
                    <span className="flex items-center gap-1">🎓 {course.level}</span>
                    <span className="flex items-center gap-1">⏱️ {course.duration_hours || 0}h</span>
                </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-display font-extrabold text-lg text-slate-900 mb-2 leading-snug group-hover:text-brand-700 transition">
                    {course.title}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-2 flex-1">
                    {course.short_description}
                </p>

                {course.avg_rating > 0 && (
                    <div className="flex items-center gap-2 mt-4 text-sm">
            <span className="text-accent-500">
              {'★'.repeat(Math.round(course.avg_rating))}
            </span>
                        <span className="font-semibold text-slate-700">
              {course.avg_rating}
            </span>
                        <span className="text-slate-400">
              ({course.review_count || 0})
            </span>
                    </div>
                )}

                <div className="flex items-center justify-between mt-5 pt-5 border-t border-slate-100">
          <span className="text-2xl font-display font-extrabold text-slate-900">
            {free ? 'Free' : `R${course.price}`}
          </span>
                    <span className="text-xs text-slate-400 font-semibold">
            {course.student_count || 0} students
          </span>
                </div>
            </div>
        </Link>
    );
}