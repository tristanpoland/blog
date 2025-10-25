import fs from 'fs';
import path from 'path';
import BlogPost from '../components/BlogPost';

const basePath = process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || '';

export default function Home() {
  // Read the blog index
  let blogPosts = [];
  const indexPath = path.join(process.cwd(), 'public/blog-index.json');
  
  try {
    if (fs.existsSync(indexPath)) {
      const indexData = fs.readFileSync(indexPath, 'utf8');
      blogPosts = JSON.parse(indexData);
    }
  } catch (error) {
    console.error('Error reading blog index:', error);
  }

  return (
    <div>
      <div className="mb-12 text-center">
        <br></br><br></br>
        <div className="flex justify-center mb-6">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-300 dark:border-gray-700 shadow-lg">
            <img
              src={`${basePath}/images/pfp.png`}
              alt="Profile Picture"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4"></h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Exploring web development, programming, and technology
        </p>
      </div>

      {blogPosts.length > 0 ? (
        blogPosts.map((post) => (
          <BlogPost key={post.slug} post={post} />
        ))
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            No blog posts found. Add some markdown files to the /public/blogs directory to get started.
          </p>
        </div>
      )}
    </div>
  );
}
