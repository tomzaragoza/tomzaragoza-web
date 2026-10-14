/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/lol/download": ["./downloads/act.zip"],
    "/images/*": ["./private/course-images/*"]
  }
};

export default nextConfig;
