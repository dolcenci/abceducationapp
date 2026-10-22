const VARIANTS = {
    info: {
        bg: 'bg-sky-50',
        border: 'border-sky-200',
        text: 'text-sky-900',
        titleText: 'text-sky-700',
        icon: '💡',
        label: 'Note',
    },
    tip: {
        bg: 'bg-brand-50',
        border: 'border-brand-200',
        text: 'text-brand-900',
        titleText: 'text-brand-700',
        icon: '✨',
        label: 'Tip',
    },
    warning: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-900',
        titleText: 'text-amber-700',
        icon: '⚠️',
        label: 'Watch out',
    },
    success: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-900',
        titleText: 'text-green-700',
        icon: '✅',
        label: 'Nice',
    },
};

export default function CalloutBlock({ block }) {
    const { variant = 'info', title = '', body = '' } = block.content || {};
    const v = VARIANTS[variant] || VARIANTS.info;

    return (
        <div className={`my-8 rounded-2xl border-l-4 ${v.bg} ${v.border} p-5`}>
            <div className="flex items-start gap-4">
                <span className="text-2xl shrink-0">{v.icon}</span>
                <div className="flex-1">
                    <p className={`font-display font-extrabold mb-1 ${v.titleText}`}>
                        {title || v.label}
                    </p>
                    <p className={`text-[15px] leading-relaxed whitespace-pre-line ${v.text}`}>
                        {body}
                    </p>
                </div>
            </div>
        </div>
    );
}