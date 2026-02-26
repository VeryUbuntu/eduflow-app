/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/eduflow',
  async rewrites() {
    // Use environment variable for backend URL, fallback to localhost in development
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ]
  },
};

export default nextConfig;
