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
export const metadataBase = siteUrl ? new URL(`${basePath}/`, siteUrl) : undefined;
export const metadata = {
  title: 'Blog - Tristan Poland',
  description: 'A blog about game and web development, backend programming, hardware, security, privacy, and technology.',
};
