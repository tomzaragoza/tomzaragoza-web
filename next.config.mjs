/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/lol/download": ["./downloads/act.zip"]
  }
};

export default nextConfig;
