/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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
