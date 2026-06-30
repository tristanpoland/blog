import Link from 'next/link';
import { formatDate } from '../utils/date-formatter';

const basePath = process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || '';

function PostLink({ post, children }) {
  const href = post.externalUrl || `/posts/${post.slug}`;
  if (post.externalUrl) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className="block h-full">{children}</a>;
  }
  return <Link href={href} className="block h-full">{children}</Link>;
}

export default function BlogPost({ post }) {
  const thumbnailSrc = post.externalThumbnail || (post.cover ? `${basePath}/blogs/covers/${post.cover}` : null);

  return (
    <div className="bg-white dark:bg-gray-950 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      {thumbnailSrc && (
        <PostLink post={post}>
          <div className="relative w-full h-48 overflow-hidden bg-gray-200 dark:bg-gray-800">
            <img
              src={thumbnailSrc}
              alt={post.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        </PostLink>
      )}
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-bold flex-1">
            {post.externalUrl ? (
              <a href={post.externalUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                {post.title}
              </a>
            ) : (
              <Link href={`/posts/${post.slug}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                {post.title}
              </Link>
            )}
          </h2>
          {post.source === 'pulsar' && (
            <span className="shrink-0 bg-purple-900/40 text-purple-300 text-xs px-2 py-0.5 rounded font-medium">
              Pulsar
            </span>
          )}
        </div>
        <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
          <span>{formatDate(post.date)}</span>
          <span>{post.readingTime} min read</span>
        </div>
        {post.tags && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <p className="mb-4 text-gray-700 dark:text-gray-300 text-sm flex-grow line-clamp-3">{post.excerpt || post.description}</p>
        {post.externalUrl ? (
          <a href={post.externalUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
            Read more →
          </a>
        ) : (
          <Link href={`/posts/${post.slug}`} className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
            Read more →
          </Link>
        )}
      </div>
    </div>
  );
}
