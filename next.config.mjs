/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/eduflow',
  async rewrites() {
    // Use environment variable for backend URL, fallback to 8005 (Eduflow API daemon)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8005';

    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ]
  },
};

export default nextConfig;
