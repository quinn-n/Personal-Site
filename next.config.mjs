/** @type {import('next').NextConfig} */


// NextJS's ESLint integration has some design flaws:
// https://github.com/vercel/next.js/discussions/59347#discussioncomment-9448488
// Unfortunately using a custom ESLint config means losing `next lint`
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
