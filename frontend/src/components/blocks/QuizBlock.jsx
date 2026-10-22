import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function QuizBlock({ block }) {
    const { user } = useAuth();
    const {
        question = '',
        options = [],
        correctIndex = 0,
        explanation = '',
    } = block.content || {};

    const [picked, setPicked] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load previous answer
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        api.get(`/courses/blocks/${block.id}/quiz-answer`)
            .then((r) => {
                if (r.data) setPicked(r.data.selected_index);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [block.id, user]);

    const answer = async (i) => {
        setPicked(i);
        if (!user) return;
        const correct = i === correctIndex;
        try {
            await api.post(`/courses/blocks/${block.id}/quiz-answer`, {
                selectedIndex: i,
                correct,
            });
        } catch {
            /* silent */
        }
    };

    const answered = picked !== null;
    const isCorrect = picked === correctIndex;

    return (
        <div className="my-8 rounded-2xl border-2 border-brand-100 bg-gradient-to-br from-brand-50/60 to-accent-50/40 p-6">
            <div className="flex items-center gap-2 mb-4">
        <span className="px-2.5 py-1 rounded-full bg-brand-600 text-white text-xs font-bold uppercase tracking-wide">
          Quiz
        </span>
                {answered && (
                    <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            isCorrect
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                        }`}
                    >
            {isCorrect ? '✓ Correct' : '✗ Incorrect'}
          </span>
                )}
                <span className="ml-auto text-xs text-slate-500 font-semibold">
          {options.length} options
        </span>
            </div>

            <p className="font-display font-extrabold text-lg text-slate-900 mb-5">
                {question || 'Question'}
            </p>

            <div className="space-y-2.5">
                {options.map((opt, i) => {
                    const isPicked = picked === i;
                    const isRight = i === correctIndex;

                    let classes =
                        'w-full text-left px-4 py-3 rounded-xl border-2 font-medium transition flex items-center gap-3 ';
                    if (!answered) {
                        classes +=
                            'bg-white border-slate-200 hover:border-brand-400 text-slate-700 cursor-pointer';
                    } else if (isRight) {
                        classes += 'bg-green-50 border-green-400 text-green-900';
                    } else if (isPicked) {
                        classes += 'bg-red-50 border-red-400 text-red-900';
                    } else {
                        classes += 'bg-white border-slate-200 text-slate-400';
                    }

                    return (
                        <button
                            key={i}
                            onClick={() => !answered && answer(i)}
                            disabled={answered}
                            className={classes}
                        >
              <span
                  className={`w-7 h-7 rounded-full grid place-items-center text-xs font-bold shrink-0 ${
                      answered
                          ? isRight
                              ? 'bg-green-500 text-white'
                              : isPicked
                                  ? 'bg-red-500 text-white'
                                  : 'bg-slate-100 text-slate-400'
                          : 'bg-slate-100 text-slate-600'
                  }`}
              >
                {answered && isRight
                    ? '✓'
                    : answered && isPicked
                        ? '✗'
                        : String.fromCharCode(65 + i)}
              </span>
                            <span className="flex-1">{opt}</span>
                        </button>
                    );
                })}
            </div>

            {answered && (
                <div className="mt-5">
                    <div
                        className={`rounded-2xl p-4 ${
                            isCorrect
                                ? 'bg-green-100 border border-green-200'
                                : 'bg-red-100 border border-red-200'
                        }`}
                    >
                        <p
                            className={`font-display font-extrabold mb-1 ${
                                isCorrect ? 'text-green-800' : 'text-red-800'
                            }`}
                        >
                            {isCorrect ? '✓ Correct!' : '✗ Not quite'}
                        </p>
                        {!isCorrect && (
                            <p className="text-sm text-red-700 mb-2">
                                The correct answer is{' '}
                                <strong>{String.fromCharCode(65 + correctIndex)}</strong>:{' '}
                                {options[correctIndex]}
                            </p>
                        )}
                        {explanation && (
                            <p
                                className={`text-sm ${
                                    isCorrect ? 'text-green-800' : 'text-red-800'
                                }`}
                            >
                                {explanation}
                            </p>
                        )}
                    </div>

                    {user ? (
                        <p className="mt-3 text-xs text-slate-500 italic">
                            Your answer has been saved.
                        </p>
                    ) : (
                        <p className="mt-3 text-xs text-slate-500 italic">
                            Log in to save your answer and track your progress.
                        </p>
                    )}
                </div>
            )}

            {loading && (
                <p className="mt-3 text-xs text-slate-400">Loading your previous answer...</p>
            )}
        </div>
    );
}