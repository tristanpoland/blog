const basePath = process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || '';

function normalizeSiteUrl(url) {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname === '127.0.0.1') return undefined;
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return undefined;
  }
}

const siteUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
export const metadataBase = siteUrl ? new URL(`${basePath}/`, siteUrl) : undefined;
export const metadata = {
  title: 'Blog - Tristan Poland',
  description: 'A blog about game and web development, backend programming, hardware, security, privacy, and technology.',
};
