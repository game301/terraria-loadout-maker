import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    cacheComponents: false, // Disable for dynamic routes with auth
}

export default nextConfig
