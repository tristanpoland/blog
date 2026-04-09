const basePath = process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || '';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadataBase = new URL(`${basePath}/`, siteUrl);
export const metadata = {
  title: 'Blog - Tristan Poland',
  description: 'A blog about game and web development, backend programming, hardware, security, privacy, and technology.',
};
