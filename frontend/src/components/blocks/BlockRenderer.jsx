import TextBlock from './TextBlock';
import CodeBlock from './CodeBlock';
import ImageBlock from './ImageBlock';
import VideoBlock from './VideoBlock';
import CalloutBlock from './CalloutBlock';
import QuizBlock from './QuizBlock';
import CodeRunnerBlock from './CodeRunnerBlock';
import ExerciseBlock from './ExerciseBlock';

export default function BlockRenderer({ block }) {
    switch (block.type) {
        case 'text':
            return <TextBlock block={block} />;
        case 'code':
            return <CodeBlock block={block} />;
        case 'image':
            return <ImageBlock block={block} />;
        case 'video':
            return <VideoBlock block={block} />;
        case 'callout':
            return <CalloutBlock block={block} />;
        case 'quiz':
            return <QuizBlock block={block} />;
        case 'code_runner':
            return <CodeRunnerBlock block={block} />;
        case 'exercise':
            return <ExerciseBlock block={block} />;
        default:
            return (
                <div className="my-4 p-4 rounded-xl bg-slate-100 text-slate-500 text-sm italic">
                    Unknown block type: {block.type}
                </div>
            );
    }
}