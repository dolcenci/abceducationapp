import LessonContent from '../LessonContent';

export default function TextBlock({ block }) {
    const markdown = block.content?.markdown || '';
    if (!markdown.trim()) {
        return (
            <div className="text-slate-400 italic text-sm">Empty text block</div>
        );
    }
    return <LessonContent markdown={markdown} />;
}