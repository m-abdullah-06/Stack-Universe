import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  // Base URL of the application
  const baseUrl = 'https://stackuniverse.com' // Replace with actual production domain

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1,
    },
    // We can't automatically list all 100M+ GitHub users here statically. 
    // They are dynamically generated as users search for them or click random!
  ]
}
