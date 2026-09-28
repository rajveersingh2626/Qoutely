import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/security', '/login', '/pricing'],
        disallow: ['/app/', '/api/']
      }
    ],
    sitemap: 'https://quotely.in/sitemap.xml'
  };
}
