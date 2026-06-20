/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Bundle the setup SQL with the admin route so the Setup tab can serve it on Vercel.
  outputFileTracingIncludes: {
    "/api/admin/setup-check": ["./supabase/api-keys.sql"],
  },
}

export default nextConfig
