/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['avatars.githubusercontent.com'],
  },
  transpilePackages: ['recharts', 'jspdf', 'html2canvas'],
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      bufferutil: 'commonjs bufferutil',
      canvas: 'commonjs canvas',
    })
    return config
  },
}

module.exports = nextConfig
