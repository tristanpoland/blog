'use client';

import { useState, useEffect } from 'react';
import BlogPost from './BlogPost';

const url_prefix = 'https://tridentforu.com/';
const PULSAR_API = 'https://pulsarnative.com/blog/blog-all.json';

export default function MergedBlogGrid({ personalPosts }) {
  const [merged, setMerged] = useState([]);

  useEffect(() => {
    const personal = (personalPosts || []).map(p => ({
      ...p,
      key: p.slug,
      sortDate: new Date(p.date || 0).getTime(),
    }));

    fetch(PULSAR_API)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (!Array.isArray(data)) { setMerged(personal); return; }
        const pulsar = data.map(p => ({
          slug: p.slug,
          title: p.title,
          date: p.date,
          readingTime: p.readingTime,
          tags: p.tags,
          excerpt: p.description,
          externalThumbnail: p.thumbnail,
          externalUrl: p.url,
          source: 'pulsar',
          key: `pulsar-${p.slug}`,
          sortDate: new Date(p.date || 0).getTime(),
        }));
        const all = [...personal, ...pulsar].sort((a, b) => b.sortDate - a.sortDate);
        setMerged(all);
      })
      .catch(() => setMerged(personal));
  }, [personalPosts]);

  if (merged.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">
          No blog posts found. Add some markdown files to the /public/blogs directory to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
      {merged.map(post => (
        <BlogPost key={post.key} post={post} />
      ))}
    </div>
  );
}