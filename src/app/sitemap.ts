import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://careerguidanceacademy.in';
  const currentDate = new Date().toISOString();

  const publicRoutes = [
    { path: '', changeFrequency: 'daily' as const, priority: 1.0 },
    { path: '/courses', changeFrequency: 'daily' as const, priority: 0.9 },
    { path: '/mock-tests', changeFrequency: 'daily' as const, priority: 0.9 },
    { path: '/how-to-pay', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/achievements', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/faculty', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/about', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.8 },
    { path: '/login', changeFrequency: 'monthly' as const, priority: 0.5 },
    { path: '/register', changeFrequency: 'monthly' as const, priority: 0.6 },
    { path: '/forgot-password', changeFrequency: 'monthly' as const, priority: 0.3 },
    { path: '/privacy-policy', changeFrequency: 'yearly' as const, priority: 0.4 },
    { path: '/terms-and-conditions', changeFrequency: 'yearly' as const, priority: 0.4 },
    { path: '/refund-policy', changeFrequency: 'yearly' as const, priority: 0.4 },
    { path: '/cookie-policy', changeFrequency: 'yearly' as const, priority: 0.3 },
  ];

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: currentDate,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
