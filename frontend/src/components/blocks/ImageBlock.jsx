export default function ImageBlock({ block }) {
    const { url = '', caption = '', alt = '' } = block.content || {};
    if (!url) return null;

    return (
        <figure className="my-8">
            <img
                src={url}
                alt={alt || caption || ''}
                className="w-full rounded-2xl shadow-card"
            />
            {caption && (
                <figcaption className="text-sm text-slate-500 italic mt-3 text-center">
                    {caption}
                </figcaption>
            )}
        </figure>
    );
}