import { getBlogSlugs, getBlogBySlug } from '../../../utils/markdown';
import Markdown from '../../../components/Markdown';
import { formatDate } from '../../../utils/date-formatter';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const basePath = process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || '';

function normalizeSiteUrl(url) {
  if (!url) return undefined;
  const candidate = url.trim().replace(/\/+$/, '');
  const normalized = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
  try {
    const parsed = new URL(normalized);
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname === '127.0.0.1') return undefined;
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return undefined;
  }
}

function getSiteUrl() {
  return (
    normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizeSiteUrl(process.env.NEXT_PUBLIC_VERCEL_URL) ||
    normalizeSiteUrl(process.env.VERCEL_URL) ||
    normalizeSiteUrl(process.env.RENDER_EXTERNAL_URL) ||
    normalizeSiteUrl(process.env.NETLIFY_SITE_URL)
  );
}

const siteUrl = getSiteUrl();
const hasSiteUrl = Boolean(siteUrl);

// This function gets called at build time to generate static paths
export async function generateStaticParams() {
  try {
    const slugs = await getBlogSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// This function generates metadata for the page
export async function generateMetadata({ params }) {
  try {
    // Always await params in Next.js App Router
    const awaitedParams = await params;
    const { slug } = awaitedParams;
    const blog = await getBlogBySlug(slug);

    if (!blog) {
      return {
        title: 'Post Not Found',
        description: 'The requested blog post could not be found.',
      };
    }

    const description = blog.description || blog.excerpt || 'No description available';
    const tags = Array.isArray(blog.tags) ? blog.tags.filter(Boolean) : [];
    const postUrl = hasSiteUrl ? new URL(`${basePath}/posts/${slug}`, siteUrl).toString() : `${basePath}/posts/${slug}`;
    const coverImage = blog.cover ? (hasSiteUrl ? new URL(`${basePath}/blogs/covers/${blog.cover}`, siteUrl).toString() : `${basePath}/blogs/covers/${blog.cover}`) : null;

    const metadata = {
      title: blog.title,
      description,
      openGraph: {
        title: blog.title,
        description,
        siteName: 'Tristan Poland Blog',
        type: 'article',
        publishedTime: blog.date,
        modifiedTime: blog.updated || blog.date,
        article: {
          tags,
        },
      },
      twitter: {
        card: coverImage ? 'summary_large_image' : 'summary',
        title: blog.title,
        description,
      },
    };

    if (hasSiteUrl) {
      metadata.openGraph.images = coverImage ? [{ url: coverImage, alt: blog.title }] : [];
      metadata.twitter.images = coverImage ? [coverImage] : undefined;
      const postUrl = new URL(`${basePath}/posts/${slug}`, siteUrl).toString();
      metadata.alternates = { canonical: postUrl };
      metadata.openGraph.url = postUrl;
    }

    return metadata;
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Error',
      description: 'There was an error loading this post',
    };
  }
}

// The main blog page component
export default async function BlogPage({ params }) {
  try {
    // Always await params in Next.js App Router
    const awaitedParams = await params;
    const { slug } = awaitedParams;
    const blog = await getBlogBySlug(slug);
    
    if (!blog) {
      // Use Next.js notFound function to show 404 page
      notFound();
    }
    
    // Calculate reading time if not already provided
    const readingTime = blog.readingTime || 
      (blog.content ? Math.ceil(blog.content.split(/\s+/).length / 200) : 1);
    
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 mt-36">
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline mb-8 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mt-4 mb-4">{blog.title}</h1>

          {blog.cover && (
            <div className="relative w-full h-64 md:h-96 mb-6 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
              <img
                src={`${basePath}/blogs/covers/${blog.cover}`}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
            <span className="mr-4">{formatDate(blog.date)}</span>
            <span>{readingTime} min read</span>
          </div>

          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {blog.tags.map(tag => (
                <Link
                  key={tag}
                  href={`/tags/${tag}`}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-sm"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </div>

        <article className="prose prose-lg max-w-none dark:prose-invert">
          <Markdown content={blog.content} />
        </article>
      </div>
    );
  } catch (error) {
    console.error('Error rendering blog post:', error);
    // Handle any errors gracefully
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Error Loading Post</h1>
        <p className="mb-6">Sorry, we couldn't load this blog post. Please try again later.</p>
        <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Return to Home
        </Link>
      </div>
    );
  }
}