import { useEffect, useState } from 'react';
import api from '../../api/client';

const emptyFor = (type) => {
    switch (type) {
        case 'text':
            return { markdown: '# Heading\n\nWrite your lesson content here.' };
        case 'code':
            return { language: 'python', code: 'print("Hello, world!")', caption: '' };
        case 'image':
            return { url: '', caption: '', alt: '' };
        case 'video':
            return { url: '', caption: '' };
        case 'callout':
            return { variant: 'info', title: '', body: 'Something to note.' };
        case 'quiz':
            return {
                question: 'What is the correct answer?',
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correctIndex: 0,
                explanation: '',
            };
        case 'code_runner':
            return {
                language: 'python',
                starterCode: '# Write your code here\nprint("Hello")\n',
                caption: 'Try it out',
                height: 260,
            };
        case 'exercise':
            return {
                language: 'python',
                instructions: 'Write a function called `double` that takes a number and returns twice its value.',
                starterCode: 'def double(n):\n    # your code here\n    pass\n',
                tests: "_assert('defines double', 'double' in dir())\n_assert('double(2) == 4', double(2) == 4, f'Got {double(2)}')\n_assert('double(0) == 0', double(0) == 0, f'Got {double(0)}')",
                caption: '',
            };
        default:
            return {};
    }
};

const BLOCK_LABELS = {
    text: '📝 Text',
    code: '💻 Code (static)',
    code_runner: '▶️ Code Runner (interactive)',
    exercise: '🧪 Exercise (graded)',
    image: '🖼️ Image',
    video: '🎬 Video',
    callout: '💡 Callout',
    quiz: '❓ Quiz',
};

export default function BlockEditor({ lessonId, lessonTitle }) {
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openBlockId, setOpenBlockId] = useState(null);
    const [addingType, setAddingType] = useState('text');
    const [message, setMessage] = useState('');

    const flash = (text) => {
        setMessage(text);
        setTimeout(() => setMessage(''), 3000);
    };

    const loadBlocks = async () => {
        setLoading(true);
        try {
            const r = await api.get(`/courses/lessons/${lessonId}/blocks`);
            setBlocks(r.data || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (lessonId) loadBlocks();
        else setBlocks([]);
    }, [lessonId]);

    const addBlock = async () => {
        try {
            await api.post(`/courses/lessons/${lessonId}/blocks`, {
                type: addingType,
                content: emptyFor(addingType),
            });
            await loadBlocks();
            flash(`Added ${addingType} block`);
        } catch (err) {
            flash(err.response?.data?.error || 'Failed to add block');
        }
    };

    const updateBlock = async (blockId, content) => {
        try {
            await api.put(`/courses/lessons/blocks/${blockId}`, { content });
            setBlocks((prev) =>
                prev.map((b) => (b.id === blockId ? { ...b, content } : b))
            );
            flash('Saved');
        } catch (err) {
            flash(err.response?.data?.error || 'Failed to save');
        }
    };

    const deleteBlock = async (blockId) => {
        if (!window.confirm('Delete this block?')) return;
        await api.delete(`/courses/lessons/blocks/${blockId}`);
        setBlocks((prev) => prev.filter((b) => b.id !== blockId));
        flash('Block deleted');
    };

    const moveBlock = async (index, dir) => {
        const next = [...blocks];
        const target = index + dir;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        setBlocks(next);
        const order = next.map((b) => b.id);
        await api.put(`/courses/lessons/${lessonId}/blocks/reorder`, { order });
    };

    if (!lessonId) {
        return (
            <div className="card p-8 text-slate-500 italic">
                Select a lesson to edit its blocks.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="card p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h3 className="font-display font-extrabold text-xl text-slate-900">
                            Blocks for "{lessonTitle}"
                        </h3>
                        <p className="text-sm text-slate-500">
                            Add content blocks in any order. Each one is rendered on the lesson page.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={addingType}
                            onChange={(e) => setAddingType(e.target.value)}
                            className="input !w-auto"
                        >
                            {Object.entries(BLOCK_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                            ))}
                        </select>
                        <button onClick={addBlock} className="btn-primary whitespace-nowrap">
                            + Add Block
                        </button>
                    </div>
                </div>

                {message && (
                    <div className="mt-4 text-sm font-semibold text-brand-700">
                        {message}
                    </div>
                )}
            </div>

            {loading ? (
                <div className="card p-8 text-slate-400">Loading blocks...</div>
            ) : blocks.length === 0 ? (
                <div className="card p-12 text-center text-slate-500">
                    <p className="text-4xl mb-3">🧱</p>
                    <p className="font-bold text-slate-700 mb-1">No blocks yet</p>
                    <p className="text-sm">
                        Click <strong>+ Add Block</strong> above to start building this lesson.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {blocks.map((b, i) => (
                        <BlockRow
                            key={b.id}
                            block={b}
                            index={i}
                            total={blocks.length}
                            isOpen={openBlockId === b.id}
                            onToggle={() => setOpenBlockId(openBlockId === b.id ? null : b.id)}
                            onSave={(content) => updateBlock(b.id, content)}
                            onDelete={() => deleteBlock(b.id)}
                            onMoveUp={() => moveBlock(i, -1)}
                            onMoveDown={() => moveBlock(i, 1)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function BlockRow({ block, index, total, isOpen, onToggle, onSave, onDelete, onMoveUp, onMoveDown }) {
    return (
        <div className="card overflow-hidden">
            <div className="flex items-center gap-3 p-4 bg-slate-50 border-b border-slate-100">
                <div className="flex flex-col">
                    <button
                        onClick={onMoveUp}
                        disabled={index === 0}
                        className="text-slate-400 hover:text-slate-700 disabled:opacity-30 text-xs leading-none"
                    >
                        ▲
                    </button>
                    <button
                        onClick={onMoveDown}
                        disabled={index === total - 1}
                        className="text-slate-400 hover:text-slate-700 disabled:opacity-30 text-xs leading-none"
                    >
                        ▼
                    </button>
                </div>
                <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 grid place-items-center text-xs font-bold text-slate-500">
          {index + 1}
        </span>
                <span className="font-bold text-slate-700 flex-1">
          {BLOCK_LABELS[block.type] || block.type}
        </span>
                <button onClick={onToggle} className="btn-ghost text-xs">
                    {isOpen ? 'Close' : 'Edit'}
                </button>
                <button onClick={onDelete} className="btn bg-red-50 text-red-600 hover:bg-red-100 text-xs">
                    Delete
                </button>
            </div>

            {isOpen && (
                <div className="p-5">
                    <BlockForm type={block.type} initial={block.content} onSave={onSave} />
                </div>
            )}
        </div>
    );
}

function BlockForm({ type, initial, onSave }) {
    const [draft, setDraft] = useState(initial);

    useEffect(() => { setDraft(initial); }, [initial]);

    const set = (key, value) => setDraft({ ...draft, [key]: value });

    if (type === 'text') {
        return (
            <FieldGroup onSave={() => onSave(draft)}>
                <label className="label">Markdown</label>
                <textarea
                    value={draft.markdown || ''}
                    onChange={(e) => set('markdown', e.target.value)}
                    rows={10}
                    className="input font-mono text-sm"
                />
            </FieldGroup>
        );
    }

    if (type === 'code') {
        return (
            <FieldGroup onSave={() => onSave(draft)}>
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="label">Language</label>
                        <input
                            value={draft.language || ''}
                            onChange={(e) => set('language', e.target.value)}
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="label">Caption (optional)</label>
                        <input
                            value={draft.caption || ''}
                            onChange={(e) => set('caption', e.target.value)}
                            className="input"
                        />
                    </div>
                </div>
                <div>
                    <label className="label">Code</label>
                    <textarea
                        value={draft.code || ''}
                        onChange={(e) => set('code', e.target.value)}
                        rows={12}
                        className="input font-mono text-sm"
                    />
                </div>
            </FieldGroup>
        );
    }

    if (type === 'image') {
        return (
            <FieldGroup onSave={() => onSave(draft)}>
                <div>
                    <label className="label">Image URL</label>
                    <input
                        value={draft.url || ''}
                        onChange={(e) => set('url', e.target.value)}
                        className="input"
                    />
                </div>
                <div>
                    <label className="label">Caption (optional)</label>
                    <input
                        value={draft.caption || ''}
                        onChange={(e) => set('caption', e.target.value)}
                        className="input"
                    />
                </div>
                <div>
                    <label className="label">Alt text (for accessibility)</label>
                    <input
                        value={draft.alt || ''}
                        onChange={(e) => set('alt', e.target.value)}
                        className="input"
                    />
                </div>
            </FieldGroup>
        );
    }

    if (type === 'video') {
        return (
            <FieldGroup onSave={() => onSave(draft)}>
                <div>
                    <label className="label">Embed URL</label>
                    <input
                        value={draft.url || ''}
                        onChange={(e) => set('url', e.target.value)}
                        placeholder="https://www.youtube.com/embed/..."
                        className="input"
                    />
                </div>
                <div>
                    <label className="label">Caption (optional)</label>
                    <input
                        value={draft.caption || ''}
                        onChange={(e) => set('caption', e.target.value)}
                        className="input"
                    />
                </div>
            </FieldGroup>
        );
    }

    if (type === 'callout') {
        return (
            <FieldGroup onSave={() => onSave(draft)}>
                <div>
                    <label className="label">Variant</label>
                    <select
                        value={draft.variant || 'info'}
                        onChange={(e) => set('variant', e.target.value)}
                        className="input"
                    >
                        <option value="info">💡 Info</option>
                        <option value="tip">✨ Tip</option>
                        <option value="warning">⚠️ Warning</option>
                        <option value="success">✅ Success</option>
                    </select>
                </div>
                <div>
                    <label className="label">Title (optional)</label>
                    <input
                        value={draft.title || ''}
                        onChange={(e) => set('title', e.target.value)}
                        className="input"
                    />
                </div>
                <div>
                    <label className="label">Body</label>
                    <textarea
                        value={draft.body || ''}
                        onChange={(e) => set('body', e.target.value)}
                        rows={4}
                        className="input"
                    />
                </div>
            </FieldGroup>
        );
    }

    if (type === 'quiz') {
        const options = draft.options || [];
        return (
            <FieldGroup onSave={() => onSave(draft)}>
                <div>
                    <label className="label">Question</label>
                    <input
                        value={draft.question || ''}
                        onChange={(e) => set('question', e.target.value)}
                        className="input"
                    />
                </div>
                <div>
                    <label className="label">Options</label>
                    <div className="space-y-2">
                        {options.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="correct"
                                    checked={draft.correctIndex === i}
                                    onChange={() => set('correctIndex', i)}
                                    className="w-4 h-4 accent-brand-600"
                                />
                                <input
                                    value={opt}
                                    onChange={(e) => {
                                        const next = [...options];
                                        next[i] = e.target.value;
                                        set('options', next);
                                    }}
                                    className="input"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const next = options.filter((_, idx) => idx !== i);
                                        set('options', next);
                                        if (draft.correctIndex >= next.length) set('correctIndex', 0);
                                    }}
                                    className="text-red-500 hover:text-red-700 px-2"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() => set('options', [...options, ''])}
                        className="mt-2 text-sm font-bold text-brand-600 hover:text-brand-700"
                    >
                        + Add option
                    </button>
                </div>
                <div>
                    <label className="label">Explanation (shown after answering)</label>
                    <textarea
                        value={draft.explanation || ''}
                        onChange={(e) => set('explanation', e.target.value)}
                        rows={2}
                        className="input"
                    />
                </div>
            </FieldGroup>
        );
    }

    if (type === 'code_runner') {
        return (
            <FieldGroup onSave={() => onSave(draft)}>
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="label">Language</label>
                        <select
                            value={draft.language || 'python'}
                            onChange={(e) => set('language', e.target.value)}
                            className="input"
                        >
                            <option value="python">Python</option>
                            <option value="javascript">JavaScript</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Editor height (px)</label>
                        <input
                            type="number"
                            value={draft.height || 260}
                            onChange={(e) => set('height', Number(e.target.value))}
                            className="input"
                        />
                    </div>
                </div>
                <div>
                    <label className="label">Starter code</label>
                    <textarea
                        value={draft.starterCode || ''}
                        onChange={(e) => set('starterCode', e.target.value)}
                        rows={8}
                        className="input font-mono text-sm"
                    />
                </div>
                <div>
                    <label className="label">Caption (optional)</label>
                    <input
                        value={draft.caption || ''}
                        onChange={(e) => set('caption', e.target.value)}
                        className="input"
                    />
                </div>
            </FieldGroup>
        );
    }

    if (type === 'exercise') {
        return (
            <FieldGroup onSave={() => onSave(draft)}>
                <div>
                    <label className="label">Language</label>
                    <select
                        value={draft.language || 'python'}
                        onChange={(e) => set('language', e.target.value)}
                        className="input"
                    >
                        <option value="python">Python</option>
                    </select>
                </div>
                <div>
                    <label className="label">Instructions shown to the student</label>
                    <textarea
                        value={draft.instructions || ''}
                        onChange={(e) => set('instructions', e.target.value)}
                        rows={3}
                        className="input"
                    />
                </div>
                <div>
                    <label className="label">Starter code</label>
                    <textarea
                        value={draft.starterCode || ''}
                        onChange={(e) => set('starterCode', e.target.value)}
                        rows={6}
                        className="input font-mono text-sm"
                    />
                </div>
                <div>
                    <label className="label">
                        Tests
                        <span className="text-slate-400 font-normal ml-2">
              call the <code>_assert(name, condition, message)</code> helper
            </span>
                    </label>
                    <textarea
                        value={draft.tests || ''}
                        onChange={(e) => set('tests', e.target.value)}
                        rows={8}
                        className="input font-mono text-sm"
                    />
                </div>
                <div>
                    <label className="label">Caption (optional)</label>
                    <input
                        value={draft.caption || ''}
                        onChange={(e) => set('caption', e.target.value)}
                        className="input"
                    />
                </div>
            </FieldGroup>
        );
    }

    return <div className="text-slate-400 italic">Unsupported block type: {type}</div>;
}

function FieldGroup({ children, onSave }) {
    return (
        <div className="space-y-4">
            {children}
            <div className="flex justify-end">
                <button onClick={onSave} className="btn-primary text-sm">
                    Save block
                </button>
            </div>
        </div>
    );
}