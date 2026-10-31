/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS || false;

const nextConfig = {
  reactStrictMode: true,
  ...(isGithubActions
    ? {
        output: 'export',
        basePath: '/harmonylab',
      }
    : {}),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
