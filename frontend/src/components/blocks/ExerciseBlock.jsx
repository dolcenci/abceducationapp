import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { usePyodide } from '../../lib/usePyodide';

export default function ExerciseBlock({ block }) {
    const { user } = useAuth();
    const { pyodide, status: pyStatus } = usePyodide();

    const {
        language = 'python',
        instructions = '',
        starterCode = '',
        tests = '',
        caption = '',
    } = block.content || {};

    const [code, setCode] = useState(starterCode);
    const [results, setResults] = useState(null);
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

    const runTests = async () => {
        if (language !== 'python') {
            setResults([{
                name: 'Unsupported',
                passed: false,
                message: `Tests only run for Python for now. Detected: ${language}`,
            }]);
            return;
        }
        if (!pyodide) {
            setResults([{
                name: 'Runtime',
                passed: false,
                message: 'Python is still loading. Try again in a moment.',
            }]);
            return;
        }

        setRunning(true);
        setResults(null);

        try {
            pyodide.runPython(`
import sys, io, json
_buf = io.StringIO()
sys.stdout = _buf
sys.stderr = _buf
      `);

            let studentError = '';
            try {
                pyodide.runPython(code);
            } catch (e) {
                studentError = String(e);
            }

            if (studentError) {
                setResults([{
                    name: 'Syntax / runtime',
                    passed: false,
                    message: studentError,
                }]);
                setRunning(false);
                pyodide.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
        `);
                await saveAttempt(false);
                return;
            }

            pyodide.runPython(`
_tests_code = """${tests.replace(/"""/g, '\\"\\"\\"')}"""
_test_results = []
def _assert(name, condition, message=''):
    _test_results.append({'name': name, 'passed': bool(condition), 'message': message})

try:
    exec(_tests_code, globals())
except Exception as e:
    _assert('Test setup', False, str(e))
      `);

            const resultsJson = pyodide.runPython('json.dumps(_test_results)');
            const parsed = JSON.parse(resultsJson || '[]');
            setResults(parsed);

            const allPassed = parsed.length > 0 && parsed.every((t) => t.passed);
            await saveAttempt(allPassed);

            pyodide.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
      `);
        } catch (e) {
            setResults([{ name: 'Runner', passed: false, message: String(e) }]);
        } finally {
            setRunning(false);
        }
    };

    const saveAttempt = async (passed) => {
        if (!user) return;
        try {
            await api.post(`/courses/blocks/${block.id}/attempts`, {
                code,
                passed,
                output: '',
                error: '',
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch {
            /* silent */
        }
    };

    const passedCount = results?.filter((r) => r.passed).length || 0;
    const totalCount = results?.length || 0;
    const allPassed = totalCount > 0 && passedCount === totalCount;

    return (
        <div className="my-8">
            <div className="rounded-2xl overflow-hidden shadow-pop border border-slate-800 bg-slate-900">
                <div className="flex items-center justify-between bg-slate-800 px-4 py-2">
                    <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded-md bg-coral-500 text-white text-xs font-bold uppercase tracking-wide">
              Exercise
            </span>
                        <span className="text-xs font-mono text-slate-400 uppercase">
              {language}
            </span>
                        {language === 'python' && pyStatus !== 'ready' && (
                            <span className="ml-2 text-xs text-amber-400">
                {pyStatus === 'loading' ? '⚙ Loading Python...' : ''}
              </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {saved && <span className="text-xs text-green-400">✓ Saved</span>}
                        <button
                            onClick={runTests}
                            disabled={running || (language === 'python' && pyStatus !== 'ready')}
                            className="text-xs font-bold bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-md transition"
                        >
                            {running ? 'Testing...' : '▶ Run tests'}
                        </button>
                    </div>
                </div>

                {instructions && (
                    <div className="bg-slate-800/50 px-4 py-3 text-sm text-slate-300 whitespace-pre-line border-b border-slate-700">
                        {instructions}
                    </div>
                )}

                <Editor
                    height="280px"
                    language={language}
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

                {results && (
                    <div className="border-t border-slate-700 bg-black p-4 text-sm">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-slate-500 text-xs uppercase tracking-wide">
                                Test results
                            </p>
                            <p
                                className={`font-bold ${
                                    allPassed ? 'text-green-400' : 'text-red-400'
                                }`}
                            >
                                {passedCount} / {totalCount} passed
                            </p>
                        </div>
                        <ul className="space-y-2">
                            {results.map((r, i) => (
                                <li key={i} className="flex items-start gap-3">
                  <span
                      className={`w-5 h-5 rounded-full grid place-items-center text-xs shrink-0 mt-0.5 ${
                          r.passed ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}
                  >
                    {r.passed ? '✓' : '✗'}
                  </span>
                                    <div className="flex-1">
                                        <p className={r.passed ? 'text-green-400' : 'text-red-400'}>
                                            {r.name}
                                        </p>
                                        {!r.passed && r.message && (
                                            <pre className="text-slate-400 text-xs mt-1 whitespace-pre-wrap font-mono">
                        {r.message}
                      </pre>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                        {allPassed && (
                            <p className="text-green-400 font-bold mt-4">
                                🎉 All tests passed!
                            </p>
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