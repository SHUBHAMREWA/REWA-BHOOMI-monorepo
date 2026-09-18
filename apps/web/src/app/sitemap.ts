import { MetadataRoute } from 'next';
import { APP_URL, API_URL } from '@rewa-bhoomi/config';

// ─── Static routes (always indexed) ─────────────────────────────────────────
const staticRoutes: MetadataRoute.Sitemap = [
  {
    url: APP_URL,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 1.0,
  },
  {
    url: `${APP_URL}/properties`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.95,
  },
  {
    url: `${APP_URL}/projects`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  },
  {
    url: `${APP_URL}/blog`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.85,
  },
  {
    url: `${APP_URL}/about`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  },
  {
    url: `${APP_URL}/contact`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  },
  {
    url: `${APP_URL}/privacy`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  {
    url: `${APP_URL}/terms`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.3,
  },
];

// ─── Dynamic blog routes fetched from API ────────────────────────────────────
async function getBlogRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/blogs?status=PUBLISHED&limit=500&page=1`,
      {
        next: { revalidate: 3600 }, // re-fetch every hour
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) return [];

    const json = await res.json();
    const blogs: { slug: string; updatedAt?: string; createdAt?: string }[] =
      Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.data?.data)
        ? json.data.data
        : [];

    return blogs.map((blog) => ({
      url: `${APP_URL}/blog/${blog.slug}`,
      lastModified: blog.updatedAt
        ? new Date(blog.updatedAt)
        : blog.createdAt
        ? new Date(blog.createdAt)
        : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch {
    // If API is down or waking up during build, return empty — static routes still work
    return [];
  }
}

// ─── Dynamic property routes fetched from API ───────────────────────────────
async function getPropertyRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/properties?status=PUBLISHED&limit=500&page=1`,
      {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) return [];

    const json = await res.json();
    const properties: { slug: string; updatedAt?: string; createdAt?: string }[] =
      Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.data?.data)
        ? json.data.data
        : [];

    return properties.map((prop) => ({
      url: `${APP_URL}/property/${prop.slug}`,
      lastModified: prop.updatedAt
        ? new Date(prop.updatedAt)
        : prop.createdAt
        ? new Date(prop.createdAt)
        : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }));
  } catch {
    return [];
  }
}

// ─── Dynamic project routes fetched from API ────────────────────────────────
async function getProjectRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/projects?limit=100`,
      {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) return [];

    const json = await res.json();
    const projects: { slug: string; updatedAt?: string; createdAt?: string }[] =
      Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.data?.data)
        ? json.data.data
        : [];

    return projects.map((proj) => ({
      url: `${APP_URL}/projects/${proj.slug}`,
      lastModified: proj.updatedAt
        ? new Date(proj.updatedAt)
        : proj.createdAt
        ? new Date(proj.createdAt)
        : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }));
  } catch {
    return [];
  }
}

// ─── Sitemap export ───────────────────────────────────────────────────────────
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogRoutes, propertyRoutes, projectRoutes] = await Promise.all([
    getBlogRoutes(),
    getPropertyRoutes(),
    getProjectRoutes(),
  ]);
  return [...staticRoutes, ...propertyRoutes, ...projectRoutes, ...blogRoutes];
}
