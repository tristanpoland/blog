import Link from 'next/link';
import { formatDate } from '../utils/date-formatter';

const basePath = process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || '';

export default function BlogPost({ post }) {
  return (
    <div className="bg-white dark:bg-gray-950 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      {post.cover && (
        <Link href={`/posts/${post.slug}`}>
          <div className="relative w-full h-48 overflow-hidden bg-gray-200 dark:bg-gray-800">
            <img
              src={`${basePath}/blogs/covers/${post.cover}`}
              alt={post.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>
      )}
      <div className="p-6 flex flex-col flex-grow">
        <h2 className="text-xl font-bold mb-2">
          <Link href={`/posts/${post.slug}`} className="text-blue-600 dark:text-blue-400 hover:underline">
            {post.title}
          </Link>
        </h2>
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
        <p className="mb-4 text-gray-700 dark:text-gray-300 text-sm flex-grow line-clamp-3">{post.excerpt}</p>
        <Link href={`/posts/${post.slug}`} className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
          Read more →
        </Link>
      </div>
    </div>
  );
}
