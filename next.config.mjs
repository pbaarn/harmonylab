/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS || false;

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: isGithubActions ? '/harmonylab' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
