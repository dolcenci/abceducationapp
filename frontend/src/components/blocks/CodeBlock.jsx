import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function CodeBlock({ block }) {
    const { language = 'text', code = '', caption = '' } = block.content || {};
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* clipboard blocked */
        }
    };

    return (
        <div className="my-8">
            <div className="rounded-2xl overflow-hidden shadow-pop border border-slate-800">
                <div className="flex items-center justify-between bg-slate-800 px-4 py-2">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-400" />
                        <span className="w-3 h-3 rounded-full bg-yellow-400" />
                        <span className="w-3 h-3 rounded-full bg-green-400" />
                        <span className="ml-3 text-xs font-mono text-slate-400 uppercase">
              {language}
            </span>
                    </div>
                    <button
                        onClick={copy}
                        className="text-xs font-bold text-slate-300 hover:text-white px-3 py-1 rounded-md hover:bg-slate-700 transition"
                    >
                        {copied ? '✓ Copied' : 'Copy'}
                    </button>
                </div>
                <SyntaxHighlighter
                    language={language}
                    style={vscDarkPlus}
                    customStyle={{
                        margin: 0,
                        padding: '1.25rem',
                        fontSize: '0.9rem',
                        lineHeight: 1.6,
                        background: '#0f172a',
                    }}
                    showLineNumbers={code.split('\n').length > 4}
                >
                    {code}
                </SyntaxHighlighter>
            </div>
            {caption && (
                <p className="text-sm text-slate-500 italic mt-3 text-center">{caption}</p>
            )}
        </div>
    );
}