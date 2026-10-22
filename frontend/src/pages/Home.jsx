import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api/client';

const categories = [
    {
        name: 'Programming',
        icon: '💻',
        img: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=600&q=80',
        gradient: 'from-brand-500 to-sky-400',
    },
    {
        name: 'Business',
        icon: '📈',
        img: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&q=80',
        gradient: 'from-teal-500 to-emerald-400',
    },
    {
        name: 'Design',
        icon: '🎨',
        img: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&q=80',
        gradient: 'from-coral-500 to-accent-400',
    },
    {
        name: 'Psychology',
        icon: '🧠',
        img: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&q=80',
        gradient: 'from-accent-400 to-coral-400',
    },
    {
        name: 'Law',
        icon: '⚖️',
        img: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80',
        gradient: 'from-slate-700 to-brand-600',
    },
    {
        name: 'Finance',
        icon: '💰',
        img: 'https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=600&q=80',
        gradient: 'from-accent-500 to-brand-500',
    },
];

const featuredInstructors = [
    {
        name: 'Nzama Mokgotu',
        role: 'IT & Security Instructor',
        img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80',
    },
    {
        name: 'Thamsanqa Tyatya',
        role: 'Product Design Lead',
        img: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80',
    },
    {
        name: 'Prosper Ntuli',
        role: 'Full-Stack Engineer',
        img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80',
    },
];

const testimonials = [
    {
        name: 'Thandi M.',
        role: 'Software Engineer @ FNB',
        img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80',
        text: 'ABC Education got me from zero to hired in 6 months. Every lesson felt designed by someone who cares.',
    },
    {
        name: 'Sipho D.',
        role: 'Data Analyst @ Discovery',
        img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
        text: 'The SQL course alone was worth it. Real-world projects, not toy examples.',
    },
    {
        name: 'Lerato K.',
        role: 'Product Designer',
        img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
        text: 'I finally understand what I was doing. The instructors respond fast and the community is warm.',
    },
];

const faqs = [
    { q: 'Are the courses self-paced?', a: 'Yes. Every course is fully self-paced. Start, pause, resume whenever. Access never expires.' },
    { q: 'Do I get a certificate?', a: 'Absolutely. Complete a course and receive a verifiable ABC Education certificate you can add to LinkedIn.' },
    { q: 'What payment methods do you accept?', a: 'Card payments through our payment provider. The first lesson of every course is free so you can try before you buy.' },
    { q: 'Can I access courses on mobile?', a: 'Yes. The platform is fully responsive and works on phones, tablets, and desktops.' },
];

const stats = [
    { value: '25K+', label: 'Active students' },
    { value: '180+', label: 'Video lessons' },
    { value: '40+', label: 'Expert instructors' },
    { value: '4.9★', label: 'Average rating' },
];

export default function Home() {
    const [featured, setFeatured] = useState([]);
    const [counts, setCounts] = useState({ courses: 0, students: 0 });

    useEffect(() => {
        api.get('/courses?featured=true')
            .then((r) => setFeatured(r.data.slice(0, 3)))
            .catch(() => {});
        api.get('/courses')
            .then((r) =>
                setCounts({
                    courses: r.data.length,
                    students: r.data.reduce((a, c) => a + (c.student_count || 0), 0),
                })
            )
            .catch(() => {});
    }, []);

    return (
        <div className="bg-[#fdfcfb] overflow-hidden">
            {/* ============ HERO ============ */}
            <section className="relative">
                {/* Background blobs */}
                <div className="blob w-[500px] h-[500px] bg-brand-400 -top-40 -left-40" />
                <div className="blob w-[400px] h-[400px] bg-coral-400 top-20 right-0" />
                <div className="blob w-[450px] h-[450px] bg-accent-300 bottom-0 left-1/3" />

                <div className="relative max-w-7xl mx-auto px-4 py-20 lg:py-28 grid lg:grid-cols-2 gap-16 items-center">
                    <div>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-card text-xs font-bold tracking-wide uppercase text-brand-700 mb-6">
              <span className="w-2 h-2 rounded-full bg-coral-500 animate-pulse" />
              New — Payment plans available
            </span>

                        <h1 className="text-5xl md:text-7xl font-display font-extrabold leading-[1.05] mb-6">
                            Learn the skills that <span className="text-gradient">actually</span> get you hired.
                        </h1>

                        <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-xl leading-relaxed">
                            Project-based courses taught by working professionals. Master
                            Programming, Design, Finance, Law and more — at your own pace,
                            on your own schedule.
                        </p>

                        <div className="flex flex-wrap gap-4 mb-10">
                            <Link to="/courses" className="btn-primary text-base">
                                Browse Courses
                                <span className="text-lg">→</span>
                            </Link>
                            <Link to="/signup" className="btn-ghost text-base">
                                Create free account
                            </Link>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <img
                                        key={i}
                                        src={`https://i.pravatar.cc/80?img=${i + 10}`}
                                        alt=""
                                        className="w-11 h-11 rounded-full border-2 border-white shadow-sm"
                                    />
                                ))}
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">Join 25,000+ learners</p>
                                <p className="text-sm text-slate-500">⭐⭐⭐⭐⭐ Rated 4.9 / 5</p>
                            </div>
                        </div>
                    </div>

                    {/* Hero image collage */}
                    <div className="relative h-[520px] hidden lg:block">
                        <div className="absolute top-0 right-8 w-72 rounded-3xl overflow-hidden shadow-pop rotate-3 animate-[float_6s_ease-in-out_infinite]">
                            <img
                                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80"
                                alt=""
                                className="w-full h-64 object-cover"
                            />
                            <div className="bg-white p-4">
                                <p className="font-bold text-slate-800 text-sm">Team Collaboration</p>
                                <p className="text-xs text-slate-500">Business • 12 lessons</p>
                            </div>
                        </div>

                        <div className="absolute top-40 left-0 w-72 rounded-3xl overflow-hidden shadow-pop -rotate-3 animate-[float_7s_ease-in-out_infinite_0.5s]">
                            <img
                                src="https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600&q=80"
                                alt=""
                                className="w-full h-64 object-cover"
                            />
                            <div className="bg-white p-4">
                                <p className="font-bold text-slate-800 text-sm">Full-Stack Development</p>
                                <p className="text-xs text-slate-500">Programming • 24 lessons</p>
                            </div>
                        </div>

                        {/* Floating pill */}
                        <div className="absolute top-72 right-4 bg-white shadow-pop rounded-2xl px-5 py-3 flex items-center gap-3 animate-[float_5s_ease-in-out_infinite_1s]">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-400 to-coral-400 grid place-items-center text-white text-lg">
                🎓
              </span>
                            <div>
                                <p className="text-xs text-slate-500 font-semibold">Just earned</p>
                                <p className="text-sm font-bold text-slate-900">Certificate</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============ STATS STRIP ============ */}
            <section className="bg-gradient-to-r from-brand-600 via-brand-500 to-coral-500 text-white">
                <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((s) => (
                        <div key={s.label} className="text-center">
                            <p className="text-4xl font-display font-extrabold mb-1">{s.value}</p>
                            <p className="text-white/80 text-sm font-medium">{s.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ============ CATEGORIES ============ */}
            <section className="max-w-7xl mx-auto px-4 py-24">
                <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
                    <div>
            <span className="text-sm font-bold text-brand-600 uppercase tracking-wide">
              Explore
            </span>
                        <h2 className="text-4xl md:text-5xl font-display font-extrabold text-slate-900 mt-2">
                            Six paths. One future.
                        </h2>
                        <p className="text-slate-500 mt-3 text-lg">
                            Find the career track that fits — then dive in.
                        </p>
                    </div>
                    <Link to="/courses" className="btn-ghost hidden md:inline-flex">
                        View all courses →
                    </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {categories.map((c) => (
                        <Link
                            key={c.name}
                            to={`/courses?category=${encodeURIComponent(c.name)}`}
                            className="group relative rounded-3xl overflow-hidden card-hover transition"
                        >
                            <div className="h-48 relative">
                                <img src={c.img} alt={c.name} className="w-full h-full object-cover" />
                                <div className={`absolute inset-0 bg-gradient-to-t ${c.gradient} opacity-70 group-hover:opacity-90 transition`} />
                                <div className="absolute inset-0 flex flex-col justify-end p-4">
                                    <span className="text-3xl mb-1">{c.icon}</span>
                                    <p className="text-white font-display font-extrabold text-lg leading-tight">
                                        {c.name}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ============ FEATURED COURSES ============ */}
            <section className="bg-white border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-4 py-24">
                    <div className="text-center mb-14">
            <span className="text-sm font-bold text-coral-500 uppercase tracking-wide">
              Hand-picked
            </span>
                        <h2 className="text-4xl md:text-5xl font-display font-extrabold text-slate-900 mt-2">
                            Featured courses
                        </h2>
                        <p className="text-slate-500 mt-3 text-lg max-w-2xl mx-auto">
                            Loved by thousands of students — picked by our instructors.
                        </p>
                    </div>

                    {featured.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-6xl mb-4">✨</p>
                            <p className="text-slate-500">Featured courses coming soon.</p>
                            <Link to="/admin" className="btn-ghost mt-6">Add one in admin</Link>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {featured.map((c) => (
                                <FeaturedCard key={c.id} course={c} />
                            ))}
                        </div>
                    )}

                    <div className="text-center mt-14">
                        <Link to="/courses" className="btn-primary text-base">
                            See all courses →
                        </Link>
                    </div>
                </div>
            </section>

            {/* ============ WHY US ============ */}
            <section className="max-w-7xl mx-auto px-4 py-24">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="relative">
                        <div className="rounded-3xl overflow-hidden shadow-pop">
                            <img
                                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=900&q=80"
                                alt="Students learning"
                                className="w-full h-[500px] object-cover"
                            />
                        </div>
                        <div className="absolute -bottom-6 -right-6 bg-white rounded-3xl shadow-pop p-6 w-52">
                            <p className="text-4xl font-display font-extrabold text-brand-600">94%</p>
                            <p className="text-sm text-slate-600 font-medium">
                                of students land a job within 6 months
                            </p>
                        </div>
                    </div>

                    <div>
            <span className="text-sm font-bold text-teal-500 uppercase tracking-wide">
              Why ABC
            </span>
                        <h2 className="text-4xl md:text-5xl font-display font-extrabold text-slate-900 mt-2 mb-6">
                            Built by people who've actually done the job.
                        </h2>
                        <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                            Every instructor we hire still works in their field. Every
                            course is written around real projects. Nothing is theoretical.
                        </p>

                        <div className="space-y-5">
                            {[
                                { icon: '🎯', title: 'Outcome-driven', body: 'Courses built backwards from the job you want.' },
                                { icon: '🧑‍🏫', title: 'Real instructors', body: 'Taught by working professionals, not career academics.' },
                                { icon: '⚡', title: 'Practical first', body: 'You build a portfolio, not just notes.' },
                            ].map((f) => (
                                <div key={f.title} className="flex gap-4 items-start">
                  <span className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 grid place-items-center text-2xl shrink-0">
                    {f.icon}
                  </span>
                                    <div>
                                        <p className="font-bold text-slate-900 text-lg">{f.title}</p>
                                        <p className="text-slate-600">{f.body}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ============ INSTRUCTORS ============ */}
            <section className="bg-gradient-to-br from-brand-50 via-white to-accent-50">
                <div className="max-w-7xl mx-auto px-4 py-24">
                    <div className="text-center mb-14">
            <span className="text-sm font-bold text-accent-600 uppercase tracking-wide">
              The team
            </span>
                        <h2 className="text-4xl md:text-5xl font-display font-extrabold text-slate-900 mt-2">
                            Meet your instructors
                        </h2>
                        <p className="text-slate-500 mt-3 text-lg">
                            Working professionals who care about your progress.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {featuredInstructors.map((i) => (
                            <div key={i.name} className="card card-hover overflow-hidden text-center p-8 transition">
                                <img
                                    src={i.img}
                                    alt={i.name}
                                    className="w-32 h-32 rounded-full object-cover mx-auto mb-5 border-4 border-white shadow-soft"
                                />
                                <p className="font-display font-extrabold text-xl text-slate-900">
                                    {i.name}
                                </p>
                                <p className="text-brand-600 text-sm font-semibold mt-1">
                                    {i.role}
                                </p>
                                <div className="flex justify-center gap-2 mt-5">
                                    {['in', 'tw', 'ig'].map((s) => (
                                        <span
                                            key={s}
                                            className="w-9 h-9 rounded-full bg-brand-50 text-brand-600 grid place-items-center text-xs font-bold uppercase cursor-pointer hover:bg-brand-600 hover:text-white transition"
                                        >
                      {s}
                    </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============ TESTIMONIALS ============ */}
            <section className="max-w-7xl mx-auto px-4 py-24">
                <div className="text-center mb-14">
          <span className="text-sm font-bold text-coral-500 uppercase tracking-wide">
            Testimonials
          </span>
                    <h2 className="text-4xl md:text-5xl font-display font-extrabold text-slate-900 mt-2">
                        Real people. Real results.
                    </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {testimonials.map((t) => (
                        <div key={t.name} className="card p-8 relative">
                            <div className="absolute -top-4 -left-4 w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-coral-500 grid place-items-center text-white text-2xl font-display font-extrabold shadow-soft">
                                "
                            </div>
                            <p className="text-slate-700 text-lg leading-relaxed mb-6">
                                {t.text}
                            </p>
                            <div className="flex items-center gap-3">
                                <img
                                    src={t.img}
                                    alt={t.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                                <div>
                                    <p className="font-bold text-slate-900">{t.name}</p>
                                    <p className="text-sm text-slate-500">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ============ FAQ ============ */}
            <section className="bg-white border-y border-slate-100">
                <div className="max-w-3xl mx-auto px-4 py-24">
                    <div className="text-center mb-14">
            <span className="text-sm font-bold text-brand-600 uppercase tracking-wide">
              Questions
            </span>
                        <h2 className="text-4xl md:text-5xl font-display font-extrabold text-slate-900 mt-2">
                            Everything you need to know
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((f) => (
                            <details key={f.q} className="card p-6 group cursor-pointer">
                                <summary className="flex justify-between items-center font-bold text-slate-900 list-none text-lg">
                                    {f.q}
                                    <span className="text-brand-600 group-open:rotate-45 transition text-3xl leading-none ml-4">
                    +
                  </span>
                                </summary>
                                <p className="mt-4 text-slate-600 leading-relaxed">{f.a}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============ CTA ============ */}
            <section className="max-w-7xl mx-auto px-4 py-24">
                <div className="relative rounded-[2.5rem] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-600 to-coral-500" />
                    <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-accent-400/30 blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-teal-400/20 blur-3xl" />

                    <div className="relative px-8 md:px-16 py-20 text-center text-white">
                        <h2 className="text-4xl md:text-6xl font-display font-extrabold mb-6 leading-tight">
                            Your future self will thank you.
                        </h2>
                        <p className="text-xl text-white/90 max-w-2xl mx-auto mb-10">
                            Create a free account and start learning today. First lesson of
                            every course is on us.
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Link to="/signup" className="btn-accent text-base">
                                Get started for free
                            </Link>
                            <Link to="/courses" className="btn bg-white/15 text-white border border-white/30 hover:bg-white/25 text-base">
                                Browse courses
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============ FOOTER ============ */}
            <footer className="bg-slate-900 text-slate-400">
                <div className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-4 gap-12">
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2.5 mb-5">
              <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-600 via-coral-400 to-accent-400 grid place-items-center text-white font-display font-extrabold">
                A
              </span>
                            <span className="font-display font-extrabold text-white text-lg">
                ABC Education
              </span>
                        </div>
                        <p className="max-w-sm leading-relaxed">
                            Learn practical skills that get you hired. Taught by
                            professionals who still do the work.
                        </p>
                    </div>
                    <div>
                        <p className="text-white font-bold mb-4">Learn</p>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/courses" className="hover:text-white">All courses</Link></li>
                            <li><Link to="/courses?category=Programming" className="hover:text-white">Programming</Link></li>
                            <li><Link to="/courses?category=Design" className="hover:text-white">Design</Link></li>
                            <li><Link to="/courses?category=Finance" className="hover:text-white">Finance</Link></li>
                        </ul>
                    </div>
                    <div>
                        <p className="text-white font-bold mb-4">Company</p>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/signup" className="hover:text-white">Sign up</Link></li>
                            <li><Link to="/login" className="hover:text-white">Log in</Link></li>
                            <li><a href="#" className="hover:text-white">Privacy</a></li>
                            <li><a href="#" className="hover:text-white">Terms</a></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-slate-800">
                    <div className="max-w-7xl mx-auto px-4 py-6 text-sm text-center">
                        © {new Date().getFullYear()} ABC Education. Made with care in South Africa.
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeaturedCard({ course }) {
    const free = course.is_free;
    return (
        <Link
            to={`/courses/${course.slug}`}
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur text-xs font-bold text-slate-800">
          {course.category || 'Course'}
        </span>
                {free && (
                    <span className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-accent-400 text-xs font-bold text-brand-900">
            FREE
          </span>
                )}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="text-xs font-semibold opacity-90">
                        {course.level} • {course.duration_hours || 0}h
                    </p>
                </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-display font-extrabold text-xl text-slate-900 mb-2 leading-snug group-hover:text-brand-700 transition">
                    {course.title}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-2 flex-1">
                    {course.short_description}
                </p>
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