export default function VideoBlock({ block }) {
    const { url = '', caption = '' } = block.content || {};
    if (!url) return null;

    return (
        <figure className="my-8">
            <div className="rounded-2xl overflow-hidden shadow-card aspect-video">
                <iframe
                    src={url}
                    title={caption || 'Lesson video'}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>
            {caption && (
                <figcaption className="text-sm text-slate-500 italic mt-3 text-center">
                    {caption}
                </figcaption>
            )}
        </figure>
    );
}