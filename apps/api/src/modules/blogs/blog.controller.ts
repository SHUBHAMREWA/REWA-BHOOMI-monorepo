import { Request, Response } from 'express';
import { query, queryOne } from '../../database/connection';
import { NotFoundError, ValidationError, BadRequestError } from '../../errors/AppError';
import { CreateBlogSchema, UpdateBlogSchema } from '@rewa-bhoomi/validation';
import { deleteFromR2 } from '../media/media.service';
import { env } from '../../config/env';

// Helper to delete an image asset from DB and R2
const cleanupImageUrl = async (url: string | null) => {
  if (!url) return;
  
  // 1. Delete from DB media_assets
  await query('DELETE FROM media_assets WHERE url = $1', [url]);
  
  // 2. Delete from Cloudflare R2
  const publicUrl = env.CLOUDFLARE_R2_PUBLIC_URL || '';
  let key = '';
  if (publicUrl && url.startsWith(publicUrl)) {
    key = url.replace(`${publicUrl}/`, '');
  }
  
  if (key) {
    try {
      await deleteFromR2(key);
    } catch (err) {
      console.error(`Failed to delete key ${key} from R2`, err);
    }
  }
};

// ─── List Blogs ─────────────────────────────────────────────────────────────
export const listBlogs = async (req: Request, res: Response) => {
  const { limit = '20', cursor, status } = req.query;
  const parsedLimit = parseInt(limit as string, 10);
  
  let queryStr = `
    SELECT b.id, b.slug, b.title, b.excerpt, b.featured_image_url as "featuredImageUrl", 
           b.status, b.published_at as "publishedAt", b.created_at as "createdAt",
           u.id as "authorId", u.name as "authorName", u.avatar_url as "authorAvatarUrl"
    FROM blogs b
    JOIN users u ON b.author_id = u.id
    WHERE b.deleted_at IS NULL
  `;
  const params: any[] = [];
  
  if (status) {
    params.push(status);
    queryStr += ` AND b.status = $${params.length}`;
  }

  if (cursor) {
    params.push(cursor);
    queryStr += ` AND b.created_at < $${params.length}`;
  }
  
  queryStr += ` ORDER BY b.created_at DESC LIMIT $${params.length + 1}`;
  params.push(parsedLimit + 1);

  const blogsRaw = await query(queryStr, params);
  
  const hasMore = blogsRaw.length > parsedLimit;
  const blogs = hasMore ? blogsRaw.slice(0, -1) : blogsRaw;
  const nextCursor = hasMore ? blogs[blogs.length - 1].createdAt : undefined;

  const formattedBlogs = blogs.map(b => ({
    id: b.id,
    slug: b.slug,
    title: b.title,
    excerpt: b.excerpt,
    featuredImageUrl: b.featuredImageUrl,
    status: b.status,
    publishedAt: b.publishedAt,
    createdAt: b.createdAt,
    author: {
      id: b.authorId,
      name: b.authorName,
      avatar_url: b.authorAvatarUrl
    }
  }));

  res.json({ 
    success: true, 
    data: formattedBlogs,
    meta: {
      hasMore,
      cursor: nextCursor,
      limit: parsedLimit
    }
  });
};

export const getBlogDetails = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

  const blog = await queryOne(
    `SELECT b.id, b.slug, b.title, b.excerpt, b.content, b.featured_image_url as "featuredImageUrl",
            b.tags, b.meta_title as "metaTitle", b.meta_description as "metaDescription",
            b.canonical_url as "canonicalUrl", b.og_title as "ogTitle", b.og_description as "ogDescription",
            b.og_image_url as "ogImageUrl", b.schema_type as "schemaType", b.no_index as "noIndex",
            b.no_follow as "noFollow", b.schema_data as "schemaData", b.status,
            b.published_at as "publishedAt", b.created_at as "createdAt", b.updated_at as "updatedAt",
            u.id as "authorId", u.name as "authorName", u.avatar_url as "authorAvatarUrl",
            c.id as "categoryId", c.name as "categoryName", c.slug as "categorySlug"
     FROM blogs b
     JOIN users u ON b.author_id = u.id
     LEFT JOIN blog_categories c ON b.category_id = c.id
     WHERE ${isUuid ? 'b.id = $1::uuid' : 'b.slug = $1'} AND b.deleted_at IS NULL`,
    [slug]
  );

  if (!blog) {
    throw new NotFoundError('Blog not found');
  }

  const formattedBlog = {
    id: blog.id,
    slug: blog.slug,
    title: blog.title,
    excerpt: blog.excerpt,
    content: blog.content,
    featuredImageUrl: blog.featuredImageUrl,
    tags: blog.tags,
    metaTitle: blog.metaTitle,
    metaDescription: blog.metaDescription,
    canonicalUrl: blog.canonicalUrl,
    ogTitle: blog.ogTitle,
    ogDescription: blog.ogDescription,
    ogImageUrl: blog.ogImageUrl,
    schemaType: blog.schemaType,
    noIndex: blog.noIndex,
    noFollow: blog.noFollow,
    status: blog.status,
    publishedAt: blog.publishedAt,
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt,
    author: {
      id: blog.authorId,
      name: blog.authorName,
      avatar_url: blog.authorAvatarUrl
    },
    category: blog.categoryId ? {
      id: blog.categoryId,
      name: blog.categoryName,
      slug: blog.categorySlug
    } : undefined
  };

  res.json({ success: true, data: formattedBlog });
};

// ─── Create Blog (Admin) ────────────────────────────────────────────────────
export const createBlog = async (req: Request, res: Response) => {
  const validation = CreateBlogSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError('Invalid input data', validation.error.format());
  }

  const data = validation.data;
  // @ts-ignore req.user exists from authenticate middleware
  const author_id = req.user?.userId; 
  
  if (!author_id) throw new BadRequestError('User not authenticated properly');

  // Basic slug generation
  const baseSlug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

  const [blog] = await query(
    `INSERT INTO blogs (
      id, author_id, title, slug, excerpt, content, featured_image_url, category_id, tags,
      meta_title, meta_description, canonical_url, og_title, og_description, og_image_url,
      schema_type, no_index, no_follow,
      status, published_at
    ) VALUES (
      uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
      CASE WHEN $18 = 'PUBLISHED'::blog_status THEN NOW() ELSE NULL END
    ) RETURNING id, slug, status`,
    [
      author_id, data.title, slug, data.excerpt || null, data.content, data.featuredImageUrl || null,
      data.categoryId || null, data.tags || [], data.metaTitle || null, data.metaDescription || null,
      data.canonicalUrl || null, data.ogTitle || null, data.ogDescription || null, data.ogImageUrl || null,
      data.schemaType || 'BlogPosting', data.noIndex || false, data.noFollow || false,
      data.status || 'DRAFT'
    ]
  );

  res.status(201).json({ success: true, data: blog, message: 'Blog created successfully' });
};

// ─── Update Blog (Admin) ────────────────────────────────────────────────────
export const updateBlog = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const validation = UpdateBlogSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError('Invalid input data', validation.error.format());
  }
  
  const data = validation.data;
  if (Object.keys(data).length === 0) {
    throw new BadRequestError('No data provided for update');
  }

  // Retrieve current blog to check if any images have changed
  const currentBlog = await queryOne<{ featured_image_url: string | null; og_image_url: string | null }>(
    `SELECT featured_image_url, og_image_url FROM blogs WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );

  if (!currentBlog) {
    throw new NotFoundError('Blog not found');
  }
  
  const setClauses: string[] = [];
  const params: any[] = [];
  
  const fieldMapping: Record<string, string> = {
    title: 'title',
    excerpt: 'excerpt',
    content: 'content',
    featuredImageUrl: 'featured_image_url',
    categoryId: 'category_id',
    tags: 'tags',
    metaTitle: 'meta_title',
    metaDescription: 'meta_description',
    canonicalUrl: 'canonical_url',
    ogTitle: 'og_title',
    ogDescription: 'og_description',
    ogImageUrl: 'og_image_url',
    schemaType: 'schema_type',
    noIndex: 'no_index',
    noFollow: 'no_follow',
    status: 'status'
  };

  for (const [key, value] of Object.entries(data)) {
    if (fieldMapping[key] !== undefined && value !== undefined) {
      params.push(value);
      setClauses.push(`${fieldMapping[key]} = $${params.length}`);
    }
  }
  
  if (data.status === 'PUBLISHED') {
    setClauses.push(`published_at = COALESCE(published_at, NOW())`);
  } else if (data.status === 'DRAFT') {
    setClauses.push(`published_at = NULL`);
  }

  if (setClauses.length === 0) {
    throw new BadRequestError('No valid fields provided for update');
  }

  params.push(id);
  const queryStr = `
    UPDATE blogs 
    SET ${setClauses.join(', ')} 
    WHERE id = $${params.length} AND deleted_at IS NULL 
    RETURNING id, slug, status, featured_image_url, og_image_url
  `;

  const updatedBlog = await queryOne(queryStr, params);

  // If the featured image was changed or removed, delete the old one from R2
  if (
    currentBlog.featured_image_url && 
    currentBlog.featured_image_url !== data.featuredImageUrl
  ) {
    await cleanupImageUrl(currentBlog.featured_image_url);
  }

  // If the OG image was changed or removed, delete the old one from R2
  if (
    currentBlog.og_image_url && 
    currentBlog.og_image_url !== data.ogImageUrl
  ) {
    await cleanupImageUrl(currentBlog.og_image_url);
  }

  res.json({ success: true, data: updatedBlog, message: 'Blog updated successfully' });
};

// ─── Delete Blog (Admin) ────────────────────────────────────────────────────
export const deleteBlog = async (req: Request, res: Response) => {
  const { id } = req.params;

  const currentBlog = await queryOne<{ featured_image_url: string | null; og_image_url: string | null }>(
    `SELECT featured_image_url, og_image_url FROM blogs WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );

  if (!currentBlog) {
    throw new NotFoundError('Blog not found');
  }

  // Soft delete in database
  await query(
    `UPDATE blogs SET deleted_at = NOW() WHERE id = $1`,
    [id]
  );

  // Clean up R2 assets associated with the blog
  if (currentBlog.featured_image_url) {
    await cleanupImageUrl(currentBlog.featured_image_url);
  }
  if (currentBlog.og_image_url) {
    await cleanupImageUrl(currentBlog.og_image_url);
  }

  res.json({ success: true, message: 'Blog deleted successfully' });
};
