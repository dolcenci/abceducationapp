import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';

export default function LessonContent({ markdown = '' }) {
    return (
        <article
            className="
        prose prose-slate max-w-none
        prose-headings:font-display prose-headings:font-extrabold prose-headings:text-slate-900
        prose-h1:text-4xl prose-h1:mt-10 prose-h1:mb-6
        prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-4
        prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3
        prose-p:text-slate-700 prose-p:leading-relaxed prose-p:my-4
        prose-a:text-brand-600 prose-a:no-underline hover:prose-a:underline prose-a:font-semibold
        prose-strong:text-slate-900
        prose-ul:my-4 prose-ul:pl-6
        prose-ol:my-4 prose-ol:pl-6
        prose-li:text-slate-700 prose-li:my-1.5
        prose-blockquote:border-l-4 prose-blockquote:border-brand-400 prose-blockquote:bg-brand-50
        prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-xl prose-blockquote:italic
        prose-code:text-brand-700 prose-code:bg-brand-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
        prose-code:before:content-[''] prose-code:after:content-[''] prose-code:font-semibold
        prose-pre:bg-slate-900 prose-pre:rounded-2xl prose-pre:p-5 prose-pre:shadow-pop
        prose-pre:overflow-x-auto prose-pre:text-sm
        prose-img:rounded-2xl prose-img:shadow-card prose-img:my-6
        prose-hr:my-8 prose-hr:border-slate-200
        prose-table:rounded-xl prose-table:overflow-hidden
        prose-th:bg-slate-100 prose-th:px-4 prose-th:py-2
        prose-td:px-4 prose-td:py-2
        prose-video:rounded-2xl prose-video:shadow-card prose-video:my-6
        prose-iframe:rounded-2xl prose-iframe:shadow-card prose-iframe:my-6 prose-iframe:w-full
        prose-iframe:aspect-video
      "
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeHighlight]}
            >
                {markdown || '*No content yet.*'}
            </ReactMarkdown>
        </article>
    );
}