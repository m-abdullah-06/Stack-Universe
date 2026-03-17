import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'], // Best practice to disallow API routes from indexing
    },
    sitemap: 'https://stackuniverse.com/sitemap.xml', // Replace with your actual domain
  }
}
