const basePath = process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || '';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadataBase = siteUrl ? new URL(`${basePath}/`, siteUrl) : undefined;
export const metadata = {
  title: 'Blog - Tristan Poland',
  description: 'A blog about game and web development, backend programming, hardware, security, privacy, and technology.',
};
