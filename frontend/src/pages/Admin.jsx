import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import LessonContent from '../components/LessonContent';
import BlockEditor from '../components/admin/BlockEditor';

const categories = [
    { name: 'Programming', icon: '💻' },
    { name: 'Business',    icon: '📈' },
    { name: 'Design',      icon: '🎨' },
    { name: 'Psychology',  icon: '🧠' },
    { name: 'Law',         icon: '⚖️' },
    { name: 'Finance',     icon: '💰' },
];
const levels = ['Beginner', 'Intermediate', 'Advanced'];

const emptyCourse = {
    title: '', slug: '', shortDescription: '', longDescription: '',
    category: 'Programming', price: 199, isFree: false,
    imageUrl: '', promoVideoUrl: '', entryRequirements: '',
    level: 'Beginner', language: 'English', durationHours: 0,
    whatYouLearn: '', featured: false,
};

export default function Admin() {
    const { user } = useAuth();
    const [tab, setTab] = useState('create');
    const [courses, setCourses] = useState([]);
    const [form, setForm] = useState(emptyCourse);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef(null);

    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedCourseDetail, setSelectedCourseDetail] = useState(null);
    const [modules, setModules] = useState([]);
    const [newModule, setNewModule] = useState({ title: '', description: '' });
    const [lessonForm, setLessonForm] = useState({
        moduleId: '', title: '', contentMd: '', videoUrl: '',
        durationMinutes: 0, isPreview: false,
    });

    // Block editor state
    const [blocksCourseId, setBlocksCourseId] = useState('');
    const [blocksCourseDetail, setBlocksCourseDetail] = useState(null);
    const [blocksLessonId, setBlocksLessonId] = useState('');

    const flash = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    const loadCourses = async () => {
        const r = await api.get('/courses');
        setCourses(r.data);
        return r.data;
    };

    useEffect(() => { loadCourses(); }, []);

    useEffect(() => {
        if (!selectedCourseId) {
            setSelectedCourseDetail(null);
            setModules([]);
            return;
        }
        const course = courses.find((c) => String(c.id) === String(selectedCourseId));
        if (!course) {
            setSelectedCourseDetail(null);
            setModules([]);
            return;
        }
        api.get(`/courses/${course.slug}`)
            .then((r) => {
                setSelectedCourseDetail(r.data);
                setModules(r.data.modules || []);
            })
            .catch(() => {
                setSelectedCourseDetail(null);
                setModules([]);
            });
    }, [selectedCourseId, courses]);

    useEffect(() => {
        if (!blocksCourseId) {
            setBlocksCourseDetail(null);
            setBlocksLessonId('');
            return;
        }
        const course = courses.find((c) => String(c.id) === String(blocksCourseId));
        if (!course) {
            setBlocksCourseDetail(null);
            setBlocksLessonId('');
            return;
        }
        api.get(`/courses/${course.slug}`)
            .then((r) => {
                setBlocksCourseDetail(r.data);
                setBlocksLessonId('');
            })
            .catch(() => {
                setBlocksCourseDetail(null);
                setBlocksLessonId('');
            });
    }, [blocksCourseId, courses]);

    if (!user?.isAdmin) return <Navigate to="/" />;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    };

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('image', file);
            const r = await api.post('/upload', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setForm((f) => ({ ...f, imageUrl: r.data.url }));
            flash('success', 'Image uploaded');
        } catch {
            flash('error', 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const r = await api.post('/courses', form);
            flash('success', `Course created: ${r.data.title}`);
            const updated = await loadCourses();
            const created = updated.find((c) => String(c.id) === String(r.data.id));
            if (created) {
                setSelectedCourseId(String(created.id));
                setTab('builder');
            }
            setForm(emptyCourse);
        } catch (err) {
            flash('error', err.response?.data?.error || 'Create failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this course and all its content? This cannot be undone.')) return;
        await api.delete(`/courses/${id}`);
        await loadCourses();
        if (String(id) === String(selectedCourseId)) {
            setSelectedCourseId('');
            setSelectedCourseDetail(null);
            setModules([]);
        }
        flash('success', 'Course deleted');
    };

    const reloadModules = async () => {
        if (!selectedCourseDetail) return;
        const r = await api.get(`/courses/${selectedCourseDetail.slug}`);
        setSelectedCourseDetail(r.data);
        setModules(r.data.modules || []);
    };

    const addModule = async (e) => {
        e.preventDefault();
        if (!selectedCourseId) return flash('error', 'Select a course first');
        if (!newModule.title.trim()) return flash('error', 'Module title is required');
        try {
            await api.post('/courses/modules', {
                courseId: Number(selectedCourseId),
                title: newModule.title,
                description: newModule.description,
                orderIndex: modules.length,
            });
            setNewModule({ title: '', description: '' });
            await reloadModules();
            flash('success', 'Module added');
        } catch (err) {
            flash('error', err.response?.data?.error || 'Failed to add module');
        }
    };

    const addLesson = async (e) => {
        e.preventDefault();
        if (!lessonForm.moduleId) return flash('error', 'Pick a module first');
        if (!lessonForm.title.trim()) return flash('error', 'Lesson title is required');
        try {
            await api.post('/courses/lessons', {
                courseId: Number(selectedCourseId),
                moduleId: Number(lessonForm.moduleId),
                title: lessonForm.title,
                contentMd: lessonForm.contentMd,
                content: lessonForm.contentMd,
                videoUrl: lessonForm.videoUrl,
                orderIndex: 0,
                durationMinutes: Number(lessonForm.durationMinutes) || 0,
                isPreview: lessonForm.isPreview,
            });
            setLessonForm({
                moduleId: lessonForm.moduleId,
                title: '', contentMd: '', videoUrl: '',
                durationMinutes: 0, isPreview: false,
            });
            await reloadModules();
            flash('success', 'Lesson added');
        } catch (err) {
            flash('error', err.response?.data?.error || 'Failed to add lesson');
        }
    };

    const allLessons = blocksCourseDetail?.modules?.flatMap((m) =>
        (m.lessons || []).map((l) => ({ ...l, moduleTitle: m.title }))
    ) || [];

    const currentBlockLesson = allLessons.find((l) => String(l.id) === String(blocksLessonId));

    return (
        <div className="bg-[#fdfcfb] min-h-screen">
            {/* HEADER */}
            <section className="relative overflow-hidden border-b border-slate-100 bg-white">
                <div className="blob w-[300px] h-[300px] bg-brand-300 -top-20 -left-10" />
                <div className="blob w-[250px] h-[250px] bg-coral-300 top-0 right-0" />

                <div className="relative max-w-7xl mx-auto px-4 py-10">
          <span className="px-3 py-1 rounded-full bg-accent-100 text-accent-700 text-xs font-bold uppercase tracking-wide">
            Admin
          </span>
                    <h1 className="text-4xl md:text-5xl font-display font-extrabold text-slate-900 mt-2 mb-2">
                        Content Studio
                    </h1>
                    <p className="text-slate-600">
                        Create courses, build modules, add lessons, and edit content blocks.
                    </p>
                </div>
            </section>

            {/* TABS */}
            <section className="max-w-7xl mx-auto px-4 pt-8">
                <div className="flex gap-2 flex-wrap">
                    {[
                        ['create', '➕ Create Course'],
                        ['builder', '🛠️ Course Builder'],
                        ['blocks', '🧱 Block Editor'],
                        ['list', `📚 All Courses (${courses.length})`],
                    ].map(([k, label]) => (
                        <button
                            key={k}
                            onClick={() => setTab(k)}
                            className={`px-5 py-3 rounded-2xl font-bold text-sm transition ${
                                tab === k
                                    ? 'bg-brand-600 text-white shadow-soft'
                                    : 'bg-white text-slate-700 border border-slate-200 hover:border-brand-400'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </section>

            {message.text && (
                <section className="max-w-7xl mx-auto px-4 pt-6">
                    <div
                        className={`rounded-2xl p-4 flex items-start gap-3 font-semibold ${
                            message.type === 'error'
                                ? 'bg-red-50 border border-red-200 text-red-800'
                                : 'bg-green-50 border border-green-200 text-green-800'
                        }`}
                    >
                        <span className="text-xl">{message.type === 'error' ? '⚠️' : '✓'}</span>
                        <span>{message.text}</span>
                    </div>
                </section>
            )}

            <section className="max-w-7xl mx-auto px-4 py-8">
                {/* ========== CREATE TAB ========== */}
                {tab === 'create' && (
                    <form onSubmit={handleCreate} className="space-y-6">
                        <div className="card p-8">
                            <h2 className="text-2xl font-display font-extrabold text-slate-900 mb-1">
                                Basics
                            </h2>
                            <p className="text-slate-500 text-sm mb-6">
                                The essentials students see first.
                            </p>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="label">Course Title *</label>
                                    <input
                                        name="title"
                                        value={form.title}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g. Python for Absolute Beginners"
                                        className="input"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="label">
                                        URL Slug
                                        <span className="text-slate-400 font-normal ml-2">
                      (leave blank to auto-generate)
                    </span>
                                    </label>
                                    <input
                                        name="slug"
                                        value={form.slug}
                                        onChange={handleChange}
                                        placeholder="python-for-absolute-beginners"
                                        className="input"
                                    />
                                </div>

                                <div>
                                    <label className="label">Category</label>
                                    <select name="category" value={form.category} onChange={handleChange} className="input">
                                        {categories.map((c) => (
                                            <option key={c.name} value={c.name}>
                                                {c.icon} {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="label">Level</label>
                                    <select name="level" value={form.level} onChange={handleChange} className="input">
                                        {levels.map((l) => <option key={l}>{l}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="label">Language</label>
                                    <input name="language" value={form.language} onChange={handleChange} className="input" />
                                </div>

                                <div>
                                    <label className="label">Duration (hours)</label>
                                    <input
                                        name="durationHours"
                                        type="number"
                                        value={form.durationHours}
                                        onChange={handleChange}
                                        className="input"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="card p-8">
                            <h2 className="text-2xl font-display font-extrabold text-slate-900 mb-1">
                                Description
                            </h2>
                            <p className="text-slate-500 text-sm mb-6">
                                Explain what students will learn and why it matters.
                            </p>

                            <div className="space-y-6">
                                <div>
                                    <label className="label">Short Description</label>
                                    <input
                                        name="shortDescription"
                                        value={form.shortDescription}
                                        onChange={handleChange}
                                        placeholder="Master the fundamentals of Python in six weeks."
                                        className="input"
                                    />
                                </div>

                                <div>
                                    <label className="label">Full Description</label>
                                    <textarea
                                        name="longDescription"
                                        value={form.longDescription}
                                        onChange={handleChange}
                                        rows={6}
                                        className="input"
                                    />
                                </div>

                                <div>
                                    <label className="label">What You'll Learn (one per line)</label>
                                    <textarea
                                        name="whatYouLearn"
                                        value={form.whatYouLearn}
                                        onChange={handleChange}
                                        rows={5}
                                        className="input"
                                    />
                                </div>

                                <div>
                                    <label className="label">Entry Requirements</label>
                                    <input
                                        name="entryRequirements"
                                        value={form.entryRequirements}
                                        onChange={handleChange}
                                        className="input"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="card p-8">
                            <h2 className="text-2xl font-display font-extrabold text-slate-900 mb-1">
                                Media
                            </h2>
                            <p className="text-slate-500 text-sm mb-6">Visuals that sell the course.</p>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="label">Course Cover Image</label>
                                    <div className="flex items-start gap-4">
                                        <div className="w-40 h-28 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 grid place-items-center shrink-0">
                                            {form.imageUrl ? (
                                                <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-3xl text-slate-300">🖼️</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                ref={fileRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleUpload}
                                                className="hidden"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileRef.current?.click()}
                                                className="btn-ghost w-full mb-2"
                                            >
                                                {uploading ? 'Uploading...' : '📁 Upload from device'}
                                            </button>
                                            <input
                                                name="imageUrl"
                                                value={form.imageUrl}
                                                onChange={handleChange}
                                                placeholder="Or paste an image URL"
                                                className="input text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="label">Promo Video URL</label>
                                    <input
                                        name="promoVideoUrl"
                                        value={form.promoVideoUrl}
                                        onChange={handleChange}
                                        placeholder="https://www.youtube.com/embed/..."
                                        className="input"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="card p-8">
                            <h2 className="text-2xl font-display font-extrabold text-slate-900 mb-1">
                                Pricing & Visibility
                            </h2>
                            <p className="text-slate-500 text-sm mb-6">
                                Set the price and where the course appears.
                            </p>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label">Price (R)</label>
                                    <input
                                        name="price"
                                        type="number"
                                        value={form.price}
                                        onChange={handleChange}
                                        disabled={form.isFree}
                                        className="input disabled:opacity-50"
                                    />
                                </div>

                                <div className="flex items-end">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="isFree"
                                            checked={form.isFree}
                                            onChange={handleChange}
                                            className="w-5 h-5 accent-brand-600"
                                        />
                                        <span className="font-semibold text-slate-700">Make this course free</span>
                                    </label>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="featured"
                                            checked={form.featured}
                                            onChange={handleChange}
                                            className="w-5 h-5 accent-brand-600"
                                        />
                                        <span className="font-semibold text-slate-700">⭐ Feature on the homepage</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => setForm(emptyCourse)}
                                className="btn-ghost"
                            >
                                Reset form
                            </button>
                            <button type="submit" className="btn-primary text-base px-8">
                                Create Course
                            </button>
                        </div>
                    </form>
                )}

                {/* ========== BUILDER TAB ========== */}
                {tab === 'builder' && (
                    <div className="space-y-6">
                        <div className="card p-8">
                            <h2 className="text-2xl font-display font-extrabold text-slate-900 mb-1">
                                Choose a course
                            </h2>
                            <p className="text-slate-500 text-sm mb-6">
                                Pick a course to add modules and lessons.
                            </p>

                            <select
                                value={selectedCourseId}
                                onChange={(e) => setSelectedCourseId(e.target.value)}
                                className="input text-lg"
                            >
                                <option value="">— Select a course —</option>
                                {courses.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.title} ({c.category})
                                    </option>
                                ))}
                            </select>

                            {selectedCourseDetail && (
                                <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-brand-50 to-accent-50 flex flex-wrap gap-6">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase">Course</p>
                                        <p className="font-bold text-slate-900">{selectedCourseDetail.title}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase">Modules</p>
                                        <p className="font-bold text-slate-900">{modules.length}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase">Lessons</p>
                                        <p className="font-bold text-slate-900">
                                            {modules.reduce((a, m) => a + (m.lessons?.length || 0), 0)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedCourseId && (
                            <>
                                {/* Add Module */}
                                <div className="card p-8">
                                    <div className="flex items-center gap-3 mb-6">
                    <span className="w-10 h-10 rounded-2xl bg-brand-100 text-brand-700 grid place-items-center font-bold">
                      1
                    </span>
                                        <div>
                                            <h2 className="text-2xl font-display font-extrabold text-slate-900">
                                                Add a module
                                            </h2>
                                            <p className="text-slate-500 text-sm">
                                                Modules group lessons into chapters.
                                            </p>
                                        </div>
                                    </div>

                                    <form onSubmit={addModule} className="grid md:grid-cols-3 gap-4 items-end">
                                        <div>
                                            <label className="label">Module Title</label>
                                            <input
                                                value={newModule.title}
                                                onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                                                placeholder="e.g. Getting Started"
                                                className="input"
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Description (optional)</label>
                                            <input
                                                value={newModule.description}
                                                onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                                                className="input"
                                            />
                                        </div>
                                        <button type="submit" className="btn-primary w-full">
                                            + Add Module
                                        </button>
                                    </form>
                                </div>

                                {/* Add Lesson */}
                                <div className="card p-8">
                                    <div className="flex items-center gap-3 mb-6">
                    <span className="w-10 h-10 rounded-2xl bg-coral-100 text-coral-600 grid place-items-center font-bold">
                      2
                    </span>
                                        <div>
                                            <h2 className="text-2xl font-display font-extrabold text-slate-900">
                                                Add a lesson
                                            </h2>
                                            <p className="text-slate-500 text-sm">
                                                Lessons can be edited into blocks in the next tab.
                                            </p>
                                        </div>
                                    </div>

                                    {modules.length === 0 ? (
                                        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 text-amber-800 text-sm">
                                            <p className="font-bold mb-1">⚠️ No modules yet</p>
                                            <p>Add a module above before creating lessons.</p>
                                        </div>
                                    ) : (
                                        <form onSubmit={addLesson} className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="label">Belongs to Module *</label>
                                                <select
                                                    value={lessonForm.moduleId}
                                                    onChange={(e) => setLessonForm({ ...lessonForm, moduleId: e.target.value })}
                                                    className="input"
                                                >
                                                    <option value="">— Choose a module —</option>
                                                    {modules.map((m) => (
                                                        <option key={m.id} value={m.id}>{m.title}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="label">Lesson Title *</label>
                                                <input
                                                    value={lessonForm.title}
                                                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                                                    placeholder="e.g. Introduction to Variables"
                                                    className="input"
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="label">
                                                    Lesson Content (Markdown)
                                                    <span className="text-slate-400 font-normal ml-2">
                            you can also replace with rich blocks in the Block Editor tab
                          </span>
                                                </label>
                                                <textarea
                                                    value={lessonForm.contentMd}
                                                    onChange={(e) => setLessonForm({ ...lessonForm, contentMd: e.target.value })}
                                                    rows={12}
                                                    placeholder={"# Introduction\n\nWelcome to your first Python lesson.\n\n## What you'll learn\n\n- Variables\n- Loops"}
                                                    className="input font-mono text-sm"
                                                />
                                            </div>

                                            {lessonForm.contentMd && (
                                                <div className="md:col-span-2">
                                                    <label className="label">Live Preview</label>
                                                    <div className="rounded-2xl border border-slate-200 bg-white p-6 max-h-96 overflow-y-auto">
                                                        <LessonContent markdown={lessonForm.contentMd} />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="md:col-span-2">
                                                <label className="label">Video URL (optional)</label>
                                                <input
                                                    value={lessonForm.videoUrl}
                                                    onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                                                    className="input"
                                                />
                                            </div>

                                            <div>
                                                <label className="label">Duration (minutes)</label>
                                                <input
                                                    type="number"
                                                    value={lessonForm.durationMinutes}
                                                    onChange={(e) => setLessonForm({ ...lessonForm, durationMinutes: Number(e.target.value) })}
                                                    className="input"
                                                />
                                            </div>

                                            <div className="flex items-end">
                                                <label className="flex items-center gap-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={lessonForm.isPreview}
                                                        onChange={(e) => setLessonForm({ ...lessonForm, isPreview: e.target.checked })}
                                                        className="w-5 h-5 accent-brand-600"
                                                    />
                                                    <span className="font-semibold text-slate-700">Free preview lesson</span>
                                                </label>
                                            </div>

                                            <div className="md:col-span-2 flex justify-end">
                                                <button type="submit" className="btn-primary">+ Add Lesson</button>
                                            </div>
                                        </form>
                                    )}
                                </div>

                                {/* Curriculum Preview */}
                                <div className="card p-8">
                                    <div className="flex items-center gap-3 mb-6">
                    <span className="w-10 h-10 rounded-2xl bg-accent-100 text-accent-600 grid place-items-center font-bold">
                      3
                    </span>
                                        <div>
                                            <h2 className="text-2xl font-display font-extrabold text-slate-900">
                                                Curriculum preview
                                            </h2>
                                        </div>
                                    </div>

                                    {modules.length === 0 ? (
                                        <p className="text-slate-400 italic text-center py-8">
                                            No modules yet.
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {modules.map((m, mi) => (
                                                <div key={m.id} className="rounded-2xl border border-slate-100 overflow-hidden">
                                                    <div className="bg-gradient-to-r from-brand-50 to-coral-50 px-5 py-3 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-white text-brand-700 grid place-items-center font-bold text-sm">
                              {mi + 1}
                            </span>
                                                        <p className="font-display font-extrabold text-slate-900 flex-1">
                                                            {m.title}
                                                        </p>
                                                        <span className="text-xs font-bold text-slate-500">
                              {m.lessons?.length || 0} lessons
                            </span>
                                                    </div>
                                                    <ul className="divide-y divide-slate-100 bg-white">
                                                        {m.lessons?.map((l, li) => (
                                                            <li key={l.id} className="px-5 py-3 flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 grid place-items-center text-xs font-bold">
                                  {li + 1}
                                </span>
                                                                <span className="text-sm font-medium text-slate-700 flex-1">
                                  {l.title}
                                </span>
                                                                {l.is_preview && (
                                                                    <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                                    PREVIEW
                                  </span>
                                                                )}
                                                                {l.duration_minutes > 0 && (
                                                                    <span className="text-xs text-slate-400">
                                    {l.duration_minutes}m
                                  </span>
                                                                )}
                                                            </li>
                                                        ))}
                                                        {(!m.lessons || m.lessons.length === 0) && (
                                                            <li className="px-5 py-4 text-sm text-slate-400 italic text-center">
                                                                No lessons yet
                                                            </li>
                                                        )}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ========== BLOCK EDITOR TAB ========== */}
                {tab === 'blocks' && (
                    <div className="space-y-6">
                        <div className="card p-8">
                            <h2 className="text-2xl font-display font-extrabold text-slate-900 mb-1">
                                Choose a lesson to edit
                            </h2>
                            <p className="text-slate-500 text-sm mb-6">
                                Pick a course, then a lesson. You can then add, edit, reorder, and delete content blocks.
                            </p>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Course</label>
                                    <select
                                        value={blocksCourseId}
                                        onChange={(e) => setBlocksCourseId(e.target.value)}
                                        className="input"
                                    >
                                        <option value="">— Select a course —</option>
                                        {courses.map((c) => (
                                            <option key={c.id} value={c.id}>{c.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Lesson</label>
                                    <select
                                        value={blocksLessonId}
                                        onChange={(e) => setBlocksLessonId(e.target.value)}
                                        disabled={!blocksCourseDetail}
                                        className="input disabled:opacity-50"
                                    >
                                        <option value="">— Select a lesson —</option>
                                        {allLessons.map((l) => (
                                            <option key={l.id} value={l.id}>
                                                {l.moduleTitle} · {l.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {blocksLessonId && currentBlockLesson && (
                            <BlockEditor
                                lessonId={blocksLessonId}
                                lessonTitle={currentBlockLesson.title}
                            />
                        )}

                        {blocksCourseId && !blocksLessonId && (
                            <div className="card p-12 text-center text-slate-500">
                                <p className="text-4xl mb-3">📝</p>
                                <p className="font-bold text-slate-700">
                                    Select a lesson above to edit its content blocks.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ========== LIST TAB ========== */}
                {tab === 'list' && (
                    <div className="space-y-4">
                        {courses.length === 0 && (
                            <div className="card p-16 text-center">
                                <p className="text-5xl mb-4">📚</p>
                                <p className="text-xl font-display font-extrabold text-slate-900 mb-2">
                                    No courses yet
                                </p>
                                <button onClick={() => setTab('create')} className="btn-primary mt-4">
                                    Create your first course
                                </button>
                            </div>
                        )}

                        {courses.map((c) => (
                            <div
                                key={c.id}
                                className="card card-hover overflow-hidden flex flex-col md:flex-row md:items-center gap-4 p-4 transition"
                            >
                                <div className="w-full md:w-32 h-24 md:h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                                    {c.image_url ? (
                                        <img src={c.image_url} alt={c.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-brand-500 to-coral-400 grid place-items-center text-white font-display font-extrabold text-2xl">
                                            {c.title[0]}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="font-display font-extrabold text-lg text-slate-900 truncate">
                                        {c.title}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-1.5 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 font-bold">
                      {c.category}
                    </span>
                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                      {c.level}
                    </span>
                                        {c.is_free ? (
                                            <span className="px-2 py-0.5 rounded-full bg-accent-100 text-accent-700 font-bold">
                        FREE
                      </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">
                        R{c.price}
                      </span>
                                        )}
                                        {c.featured && (
                                            <span className="px-2 py-0.5 rounded-full bg-coral-100 text-coral-600 font-bold">
                        ⭐ FEATURED
                      </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2 font-mono">/{c.slug}</p>
                                </div>

                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => { setSelectedCourseId(String(c.id)); setTab('builder'); }}
                                        className="btn-ghost text-sm"
                                    >
                                        Edit content
                                    </button>
                                    <button
                                        onClick={() => handleDelete(c.id)}
                                        className="btn bg-red-50 text-red-600 hover:bg-red-100 text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}