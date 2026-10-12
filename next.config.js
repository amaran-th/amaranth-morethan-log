/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/sitemap.xml",
        destination: "/sitemap.xml", // 실제 파일 경로가 pages/sitemap.xml.tsx인 경우
      },
    ]
  },
  images: {
    // Locally the image optimizer fetches Notion with Node's user agent, which
    // Notion's Cloudflare answers with 403; let the browser load images directly
    // in development. Vercel's optimizer is not blocked.
    unoptimized: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.notion.so",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com", // accept all subdomains of googleusercontent.com
      },
      {
        protocol: "https",
        hostname: "s3-us-west-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "docs.chaeyeon.dev",
      },
      {
        protocol: "https",
        hostname: "vvony.vercel.app",
      },
    ],
  },
}

module.exports = nextConfig
