import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { usePyodide } from '../../lib/usePyodide';
import { runJavaScript } from '../../lib/runJS';

export default function CodeRunnerBlock({ block }) {
    const { user } = useAuth();
    const { pyodide, status: pyStatus } = usePyodide();

    const { language = 'python', starterCode = '', caption = '', height = 260 } = block.content || {};

    const [code, setCode] = useState(starterCode);
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [running, setRunning] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!user) return;
        api.get(`/courses/blocks/${block.id}/attempts/latest`)
            .then((r) => {
                if (r.data?.code) setCode(r.data.code);
            })
            .catch(() => {});
    }, [block.id, user]);

    const run = async () => {
        setRunning(true);
        setOutput('');
        setError('');

        try {
            if (language === 'python') {
                if (!pyodide) {
                    setError('Python runtime is still loading... please wait a moment.');
                    setRunning(false);
                    return;
                }
                pyodide.runPython(`
import sys, io
_buf = io.StringIO()
sys.stdout = _buf
sys.stderr = _buf
        `);
                let err = '';
                try {
                    pyodide.runPython(code);
                } catch (e) {
                    err = String(e);
                }
                const captured = pyodide.runPython('_buf.getvalue()');
                pyodide.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
        `);
                setOutput(captured || '');
                setError(err);
            } else if (language === 'javascript' || language === 'js') {
                const { output: out, error: err } = await runJavaScript(code);
                setOutput(out);
                setError(err);
            } else {
                setError(`Language "${language}" is not supported yet.`);
            }
        } catch (e) {
            setError(String(e));
        } finally {
            setRunning(false);
        }
    };

    const saveAttempt = async (passed = null) => {
        if (!user) return;
        try {
            await api.post(`/courses/blocks/${block.id}/attempts`, {
                code,
                passed,
                output,
                error,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch {
            /* silent */
        }
    };

    const handleRun = async () => {
        await run();
        setTimeout(() => saveAttempt(null), 50);
    };

    return (
        <div className="my-8">
            <div className="rounded-2xl overflow-hidden shadow-pop border border-slate-800 bg-slate-900">
                <div className="flex items-center justify-between bg-slate-800 px-4 py-2">
                    <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-red-400" />
                        <span className="w-3 h-3 rounded-full bg-yellow-400" />
                        <span className="w-3 h-3 rounded-full bg-green-400" />
                        <span className="ml-3 text-xs font-mono text-slate-400 uppercase">
              {language}
            </span>
                        {language === 'python' && pyStatus !== 'ready' && (
                            <span className="ml-2 text-xs text-amber-400">
                {pyStatus === 'loading' ? '⚙ Loading Python runtime...' : ''}
              </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {saved && <span className="text-xs text-green-400">✓ Saved</span>}
                        <button
                            onClick={handleRun}
                            disabled={running || (language === 'python' && pyStatus !== 'ready')}
                            className="text-xs font-bold bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-md transition"
                        >
                            {running ? 'Running...' : '▶ Run'}
                        </button>
                    </div>
                </div>

                <Editor
                    height={`${height}px`}
                    language={language === 'js' ? 'javascript' : language}
                    theme="vs-dark"
                    value={code}
                    onChange={(v) => setCode(v ?? '')}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        padding: { top: 12, bottom: 12 },
                        fontFamily: 'JetBrains Mono, Menlo, Consolas, monospace',
                        tabSize: 4,
                    }}
                />

                {(output || error) && (
                    <div className="border-t border-slate-700 bg-black p-4 font-mono text-sm">
                        <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">
                            Output
                        </p>
                        {output && (
                            <pre className="text-green-400 whitespace-pre-wrap">{output}</pre>
                        )}
                        {error && (
                            <pre className="text-red-400 whitespace-pre-wrap mt-2">{error}</pre>
                        )}
                    </div>
                )}
            </div>
            {caption && (
                <p className="text-sm text-slate-500 italic mt-3 text-center">{caption}</p>
            )}
        </div>
    );
}