import { Request, Response } from 'express';
import { query, queryOne, withTransaction } from '../../database/connection';
import { NotFoundError, ValidationError, BadRequestError } from '../../errors/AppError';
import {
  CreateBlogSchema,
  UpdateBlogSchema,
  CreateBlogCategorySchema,
  UpdateBlogCategorySchema,
  CreateBlogTagSchema,
  BlogFaqItemSchema,
  BlogFaqReorderSchema,
} from '@rewa-bhoomi/validation';
import { deleteFromR2 } from '../media/media.service';
import { env } from '../../config/env';
import { PoolClient } from 'pg';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Delete an image asset from DB and Cloudflare R2 */
const cleanupImageUrl = async (url: string | null) => {
  if (!url) return;
  await query('DELETE FROM media_assets WHERE url = $1', [url]);
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

/** Slugify a string */
const slugify = (text: string): string =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

/** Calculate approximate reading time (200 WPM) from text */
const calcReadingTime = (text: string): number => {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
};

/** Extract plain text from Tiptap JSON doc */
const extractTextFromTiptap = (json: Record<string, unknown>): string => {
  if (!json || typeof json !== 'object') return '';
  const content = json.content as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(content)) return '';
  return content.map(node => extractTextFromNode(node)).join(' ');
};

const extractTextFromNode = (node: Record<string, unknown>): string => {
  if (node.type === 'text') return String(node.text || '');
  const content = node.content as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(content)) return '';
  return content.map(c => extractTextFromNode(c)).join(node.type === 'paragraph' ? ' ' : '');
};

/** Convert Tiptap JSON to HTML (server-side, minimal implementation) */
const tiptapJsonToHtml = (json: Record<string, unknown>): string => {
  if (!json) return '';
  const content = json.content as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(content)) return '';
  return content.map(node => nodeToHtml(node)).join('');
};

const nodeToHtml = (node: Record<string, unknown>): string => {
  const marks = (node.marks as Array<{ type: string; attrs?: Record<string, string> }>) || [];
  const getChildrenHtml = () => {
    const children = node.content as Array<Record<string, unknown>> | undefined;
    return Array.isArray(children) ? children.map(nodeToHtml).join('') : '';
  };
  const applyMarks = (text: string) => {
    return marks.reduce((t, mark) => {
      switch (mark.type) {
        case 'bold': return `<strong>${t}</strong>`;
        case 'italic': return `<em>${t}</em>`;
        case 'underline': return `<u>${t}</u>`;
        case 'strike': return `<s>${t}</s>`;
        case 'code': return `<code>${t}</code>`;
        case 'link': return `<a href="${mark.attrs?.href || '#'}" target="${mark.attrs?.target || '_blank'}" rel="noopener noreferrer">${t}</a>`;
        default: return t;
      }
    }, text);
  };

  switch (node.type) {
    case 'text': {
      const escaped = String(node.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return applyMarks(escaped);
    }
    case 'paragraph': return `<p>${getChildrenHtml()}</p>`;
    case 'heading': {
      const level = (node.attrs as any)?.level || 2;
      const text = getChildrenHtml();
      const id = text.toLowerCase().replace(/<[^>]+>/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      return `<h${level} id="${id}">${text}</h${level}>`;
    }
    case 'bulletList': return `<ul>${getChildrenHtml()}</ul>`;
    case 'orderedList': return `<ol>${getChildrenHtml()}</ol>`;
    case 'listItem': return `<li>${getChildrenHtml()}</li>`;
    case 'blockquote': return `<blockquote>${getChildrenHtml()}</blockquote>`;
    case 'codeBlock': return `<pre><code>${getChildrenHtml()}</code></pre>`;
    case 'horizontalRule': return '<hr />';
    case 'hardBreak': return '<br />';
    case 'image': {
      const attrs = node.attrs as any;
      return `<figure><img src="${attrs?.src || ''}" alt="${attrs?.alt || ''}" />${attrs?.title ? `<figcaption>${attrs.title}</figcaption>` : ''}</figure>`;
    }
    case 'youtube': {
      const attrs = node.attrs as any;
      const src = attrs?.src || '';
      return `<div class="youtube-embed"><iframe src="${src}" frameborder="0" allowfullscreen></iframe></div>`;
    }
    case 'table': return `<table>${getChildrenHtml()}</table>`;
    case 'tableRow': return `<tr>${getChildrenHtml()}</tr>`;
    case 'tableHeader': return `<th>${getChildrenHtml()}</th>`;
    case 'tableCell': return `<td>${getChildrenHtml()}</td>`;
    case 'doc': return getChildrenHtml();
    default: return getChildrenHtml();
  }
};

/** Find or create a tag by name, return its id */
const findOrCreateTag = async (client: PoolClient, name: string): Promise<string> => {
  const slug = slugify(name);
  const existing = await client.query<{ id: string }>(
    'SELECT id FROM blog_tags WHERE slug = $1',
    [slug]
  );
  if (existing.rows[0]) return existing.rows[0].id;

  const created = await client.query<{ id: string }>(
    'INSERT INTO blog_tags (id, name, slug) VALUES (uuid_generate_v4(), $1, $2) RETURNING id',
    [name.trim(), slug]
  );
  return created.rows[0].id;
};

// ─── List Blogs ─────────────────────────────────────────────────────────────
export const listBlogs = async (req: Request, res: Response) => {
  const { limit = '10', page, cursor, status, search, q, keyword, startDate, from, endDate, to, language, categoryId } = req.query;
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 10));
  const parsedPage = page ? Math.max(1, parseInt(page as string, 10) || 1) : undefined;

  const searchTerm = (search || q || keyword) as string | undefined;
  const fromDate = (startDate || from) as string | undefined;
  const toDate = (endDate || to) as string | undefined;

  let queryStr = `
    SELECT b.id, b.slug, b.title, b.excerpt, b.featured_image_url as "featuredImageUrl", 
           b.featured_image_alt as "featuredImageAlt",
           b.status, b.language, b.reading_time as "readingTime",
           b.published_at as "publishedAt", b.created_at as "createdAt",
           u.id as "authorId", u.name as "authorName", u.avatar_url as "authorAvatarUrl",
           c.id as "categoryId", c.name as "categoryName", c.slug as "categorySlug",
           COUNT(*) OVER() as "totalCount"
    FROM blogs b
    JOIN users u ON b.author_id = u.id
    LEFT JOIN blog_categories c ON b.category_id = c.id
    WHERE b.deleted_at IS NULL
  `;
  const params: any[] = [];

  if (status && status !== 'ALL') {
    params.push(status);
    queryStr += ` AND b.status = $${params.length}`;
  }

  if (searchTerm && searchTerm.trim()) {
    params.push(`%${searchTerm.trim()}%`);
    const pIdx = params.length;
    queryStr += ` AND (
      b.title ILIKE $${pIdx} 
      OR b.excerpt ILIKE $${pIdx} 
      OR b.content ILIKE $${pIdx}
    )`;
  }

  if (language) {
    params.push(language);
    queryStr += ` AND b.language = $${params.length}`;
  }

  if (categoryId) {
    params.push(categoryId);
    queryStr += ` AND b.category_id = $${params.length}`;
  }

  if (fromDate) {
    params.push(fromDate);
    const pIdx = params.length;
    queryStr += ` AND (
      CASE 
        WHEN $${pIdx} ~ '^\\d{4}-\\d{2}-\\d{2}$' THEN b.created_at >= $${pIdx}::date
        ELSE b.created_at >= $${pIdx}::timestamptz
      END
    )`;
  }

  if (toDate) {
    params.push(toDate);
    const pIdx = params.length;
    queryStr += ` AND (
      CASE 
        WHEN $${pIdx} ~ '^\\d{4}-\\d{2}-\\d{2}$' THEN b.created_at < ($${pIdx}::date + INTERVAL '1 day')
        ELSE b.created_at <= $${pIdx}::timestamptz
      END
    )`;
  }

  if (parsedPage !== undefined) {
    const offset = (parsedPage - 1) * parsedLimit;
    queryStr += ` ORDER BY b.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parsedLimit, offset);
  } else {
    if (cursor) {
      params.push(cursor);
      queryStr += ` AND b.created_at < $${params.length}`;
    }
    queryStr += ` ORDER BY b.created_at DESC LIMIT $${params.length + 1}`;
    params.push(parsedLimit + 1);
  }

  const blogsRaw = await query<any>(queryStr, params);

  const totalCount = blogsRaw.length > 0 ? parseInt(String(blogsRaw[0].totalCount), 10) : 0;
  const totalPages = Math.ceil(totalCount / parsedLimit) || 1;

  let blogs = blogsRaw;
  let hasMore = false;
  let nextCursor: string | undefined = undefined;

  if (parsedPage !== undefined) {
    hasMore = parsedPage < totalPages;
  } else {
    hasMore = blogsRaw.length > parsedLimit;
    blogs = hasMore ? blogsRaw.slice(0, -1) : blogsRaw;
    nextCursor = hasMore ? (blogs[blogs.length - 1]?.createdAt as string | undefined) : undefined;
  }

  const formattedBlogs = blogs.map((b: any) => ({
    id: b.id,
    slug: b.slug,
    title: b.title,
    excerpt: b.excerpt,
    featuredImageUrl: b.featuredImageUrl,
    featuredImageAlt: b.featuredImageAlt,
    language: b.language,
    readingTime: b.readingTime,
    status: b.status,
    publishedAt: b.publishedAt,
    createdAt: b.createdAt,
    author: {
      id: b.authorId,
      name: b.authorName,
      avatar_url: b.authorAvatarUrl,
    },
    category: b.categoryId ? { id: b.categoryId, name: b.categoryName, slug: b.categorySlug } : undefined,
  }));

  res.json({
    success: true,
    data: formattedBlogs,
    meta: {
      total: totalCount,
      page: parsedPage || 1,
      totalPages,
      hasMore,
      cursor: nextCursor,
      limit: parsedLimit,
    },
  });
};

// ─── Get Blog Details ─────────────────────────────────────────────────────────
export const getBlogDetails = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

  const blog = await queryOne<any>(
    `SELECT b.id, b.slug, b.title, b.excerpt, b.content, b.content_json as "contentJson", 
            b.content_html as "contentHtml",
            b.featured_image_url as "featuredImageUrl", b.featured_image_alt as "featuredImageAlt",
            b.featured_image_caption as "featuredImageCaption",
            b.language, b.translation_group_id as "translationGroupId",
            b.tags, b.meta_title as "metaTitle", b.meta_description as "metaDescription",
            b.seo_title as "seoTitle", b.seo_description as "seoDescription",
            b.focus_keyword as "focusKeyword", b.secondary_keywords as "secondaryKeywords",
            b.canonical_url as "canonicalUrl",
            b.og_title as "ogTitle", b.og_description as "ogDescription",
            b.og_image_url as "ogImageUrl", b.og_image_alt as "ogImageAlt",
            b.twitter_card as "twitterCard", b.twitter_title as "twitterTitle",
            b.twitter_description as "twitterDescription", b.twitter_image_url as "twitterImageUrl",
            b.schema_type as "schemaType", b.no_index as "noIndex", b.no_follow as "noFollow",
            b.allow_index as "allowIndex", b.allow_follow as "allowFollow",
            b.generate_toc as "generateToc", b.reading_time as "readingTime",
            b.schema_data as "schemaData", b.status,
            b.published_at as "publishedAt", b.created_at as "createdAt", b.updated_at as "updatedAt",
            u.id as "authorId", u.name as "authorName", u.avatar_url as "authorAvatarUrl",
            c.id as "categoryId", c.name as "categoryName", c.slug as "categorySlug"
     FROM blogs b
     JOIN users u ON b.author_id = u.id
     LEFT JOIN blog_categories c ON b.category_id = c.id
     WHERE ${isUuid ? 'b.id = $1::uuid' : 'b.slug = $1'} AND b.deleted_at IS NULL`,
    [slug]
  );

  if (!blog) throw new NotFoundError('Blog not found');

  // Fetch relational tags
  const blogTags = await query<{ id: string; name: string; slug: string }>(
    `SELECT bt.id, bt.name, bt.slug 
     FROM blog_tags bt
     JOIN blog_tag_mapping btm ON btm.tag_id = bt.id
     WHERE btm.blog_id = $1
     ORDER BY bt.name`,
    [blog.id]
  );

  // Fetch FAQs
  const faqs = await query<{ id: string; question: string; answer: string; sortOrder: number }>(
    `SELECT id, question, answer, sort_order as "sortOrder"
     FROM blog_faq WHERE blog_id = $1 ORDER BY sort_order, created_at`,
    [blog.id]
  );

  // Fetch translations in same group
  let translations: Array<{ id: string; slug: string; language: string; title: string }> = [];
  if (blog.translationGroupId) {
    translations = await query<any>(
      `SELECT id, slug, language, title FROM blogs WHERE translation_group_id = $1 AND id != $2 AND deleted_at IS NULL`,
      [blog.translationGroupId, blog.id]
    );
  }

  const formattedBlog = {
    id: blog.id,
    slug: blog.slug,
    title: blog.title,
    excerpt: blog.excerpt,
    content: blog.content,
    contentJson: blog.contentJson,
    contentHtml: blog.contentHtml,
    language: blog.language || 'en',
    translationGroupId: blog.translationGroupId,
    translations,
    featuredImageUrl: blog.featuredImageUrl,
    featuredImageAlt: blog.featuredImageAlt,
    featuredImageCaption: blog.featuredImageCaption,
    tags: blog.tags,
    blogTags,
    faqs,
    metaTitle: blog.metaTitle,
    metaDescription: blog.metaDescription,
    seoTitle: blog.seoTitle,
    seoDescription: blog.seoDescription,
    focusKeyword: blog.focusKeyword,
    secondaryKeywords: blog.secondaryKeywords || [],
    canonicalUrl: blog.canonicalUrl,
    ogTitle: blog.ogTitle,
    ogDescription: blog.ogDescription,
    ogImageUrl: blog.ogImageUrl,
    ogImageAlt: blog.ogImageAlt,
    twitterCard: blog.twitterCard || 'summary_large_image',
    twitterTitle: blog.twitterTitle,
    twitterDescription: blog.twitterDescription,
    twitterImageUrl: blog.twitterImageUrl,
    schemaType: blog.schemaType,
    noIndex: blog.noIndex,
    noFollow: blog.noFollow,
    allowIndex: blog.allowIndex ?? true,
    allowFollow: blog.allowFollow ?? true,
    generateToc: blog.generateToc || false,
    readingTime: blog.readingTime,
    status: blog.status,
    publishedAt: blog.publishedAt,
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt,
    author: {
      id: blog.authorId,
      name: blog.authorName,
      avatar_url: blog.authorAvatarUrl,
    },
    category: blog.categoryId
      ? { id: blog.categoryId, name: blog.categoryName, slug: blog.categorySlug }
      : undefined,
  };

  res.json({ success: true, data: formattedBlog });
};

// ─── Create Blog (Admin) ──────────────────────────────────────────────────────
export const createBlog = async (req: Request, res: Response) => {
  const validation = CreateBlogSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError('Invalid input data', validation.error.format());
  }

  const data = validation.data;
  // @ts-ignore req.user exists from authenticate middleware
  const author_id = req.user?.userId;
  if (!author_id) throw new BadRequestError('User not authenticated properly');

  // Generate slug
  let slug: string;
  if (data.slug) {
    // Check uniqueness
    const existing = await queryOne('SELECT id FROM blogs WHERE slug = $1 AND deleted_at IS NULL', [data.slug]);
    if (existing) throw new BadRequestError('Slug already exists. Please choose a different slug.');
    slug = data.slug;
  } else {
    const baseSlug = slugify(data.title);
    slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
  }

  // Generate content_html and reading_time from contentJson
  let contentHtml: string | null = null;
  let readingTime: number | null = null;
  if (data.contentJson) {
    contentHtml = tiptapJsonToHtml(data.contentJson as Record<string, unknown>);
    const plainText = extractTextFromTiptap(data.contentJson as Record<string, unknown>);
    readingTime = calcReadingTime(plainText);
  } else if (data.content) {
    readingTime = calcReadingTime(data.content);
  }

  const blog = await withTransaction(async (client) => {
    const [created] = (await client.query(
      `INSERT INTO blogs (
        id, author_id, title, slug, excerpt, content, content_json, content_html,
        language, translation_group_id,
        featured_image_url, featured_image_alt, featured_image_caption,
        category_id, tags,
        meta_title, meta_description, 
        seo_title, seo_description, focus_keyword, secondary_keywords,
        canonical_url,
        og_title, og_description, og_image_url, og_image_alt,
        twitter_card, twitter_title, twitter_description, twitter_image_url,
        schema_type, no_index, no_follow, allow_index, allow_follow,
        generate_toc, reading_time,
        status, published_at
      ) VALUES (
        uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7,
        $8, $9,
        $10, $11, $12,
        $13, '{}',
        $14, $15,
        $16, $17, $18, $19,
        $20,
        $21, $22, $23, $24,
        $25, $26, $27, $28,
        $29, $30, $31, $32, $33,
        $34, $35,
        $36,
        CASE WHEN $36 = 'PUBLISHED'::blog_status THEN NOW() ELSE NULL END
      ) RETURNING id, slug, status`,
      [
        author_id, data.title, slug, data.excerpt || null,
        data.content || null,
        data.contentJson ? JSON.stringify(data.contentJson) : null,
        contentHtml,
        data.language || 'en', data.translationGroupId || null,
        data.featuredImageUrl || null, data.featuredImageAlt || null, data.featuredImageCaption || null,
        data.categoryId || null,
        data.metaTitle || null, data.metaDescription || null,
        data.seoTitle || null, data.seoDescription || null,
        data.focusKeyword || null, data.secondaryKeywords || [],
        data.canonicalUrl || null,
        data.ogTitle || null, data.ogDescription || null,
        data.ogImageUrl || null, data.ogImageAlt || null,
        data.twitterCard || 'summary_large_image',
        data.twitterTitle || null, data.twitterDescription || null, data.twitterImageUrl || null,
        data.schemaType || 'BlogPosting',
        data.noIndex || false, data.noFollow || false,
        data.allowIndex !== undefined ? data.allowIndex : true,
        data.allowFollow !== undefined ? data.allowFollow : true,
        data.generateToc || false,
        readingTime,
        data.status || 'DRAFT',
      ]
    )).rows;

    // Handle tags (tagIds)
    if (data.tagIds && data.tagIds.length > 0) {
      for (const tagId of data.tagIds) {
        await client.query(
          'INSERT INTO blog_tag_mapping (blog_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [created.id, tagId]
        );
      }
    }

    // Handle FAQs
    if (data.faqs && data.faqs.length > 0) {
      for (let i = 0; i < data.faqs.length; i++) {
        const faq = data.faqs[i];
        await client.query(
          `INSERT INTO blog_faq (id, blog_id, question, answer, sort_order)
           VALUES (uuid_generate_v4(), $1, $2, $3, $4)`,
          [created.id, faq.question, faq.answer, faq.sortOrder ?? i]
        );
      }
    }

    return created;
  });

  res.status(201).json({ success: true, data: blog, message: 'Blog created successfully' });
};

// ─── Update Blog (Admin) ──────────────────────────────────────────────────────
export const updateBlog = async (req: Request, res: Response) => {
  const { id } = req.params;

  console.log('--- UPDATE BLOG API CALL ---');
  console.log('Request body:', req.body);
  const validation = UpdateBlogSchema.safeParse(req.body);
  console.log('Validation success:', validation.success);
  if (!validation.success) {
    console.log('Validation error details:', validation.error.format());
    throw new ValidationError('Invalid input data', validation.error.format());
  }

  const data = validation.data;
  console.log('Parsed data:', data);
  if (Object.keys(data).length === 0) throw new BadRequestError('No data provided for update');

  const currentBlog = await queryOne<{
    featured_image_url: string | null;
    og_image_url: string | null;
    twitter_image_url: string | null;
  }>(
    `SELECT featured_image_url, og_image_url, twitter_image_url FROM blogs WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );

  if (!currentBlog) throw new NotFoundError('Blog not found');

  // Generate content_html and reading_time
  let contentHtml: string | null | undefined = undefined;
  let readingTime: number | null | undefined = undefined;
  if (data.contentJson) {
    contentHtml = tiptapJsonToHtml(data.contentJson as Record<string, unknown>);
    const plainText = extractTextFromTiptap(data.contentJson as Record<string, unknown>);
    readingTime = calcReadingTime(plainText);
  } else if (data.content !== undefined) {
    readingTime = calcReadingTime(data.content || '');
  }

  const updatedBlog = await withTransaction(async (client) => {
    const setClauses: string[] = [];
    const params: any[] = [];

    const fieldMapping: Record<string, string> = {
      title: 'title',
      excerpt: 'excerpt',
      content: 'content',
      featuredImageUrl: 'featured_image_url',
      featuredImageAlt: 'featured_image_alt',
      featuredImageCaption: 'featured_image_caption',
      categoryId: 'category_id',
      language: 'language',
      translationGroupId: 'translation_group_id',
      metaTitle: 'meta_title',
      metaDescription: 'meta_description',
      seoTitle: 'seo_title',
      seoDescription: 'seo_description',
      focusKeyword: 'focus_keyword',
      secondaryKeywords: 'secondary_keywords',
      canonicalUrl: 'canonical_url',
      ogTitle: 'og_title',
      ogDescription: 'og_description',
      ogImageUrl: 'og_image_url',
      ogImageAlt: 'og_image_alt',
      twitterCard: 'twitter_card',
      twitterTitle: 'twitter_title',
      twitterDescription: 'twitter_description',
      twitterImageUrl: 'twitter_image_url',
      schemaType: 'schema_type',
      noIndex: 'no_index',
      noFollow: 'no_follow',
      allowIndex: 'allow_index',
      allowFollow: 'allow_follow',
      generateToc: 'generate_toc',
      status: 'status',
    };

    for (const [key, value] of Object.entries(data)) {
      if (fieldMapping[key] !== undefined && value !== undefined) {
        params.push(value);
        setClauses.push(`${fieldMapping[key]} = $${params.length}`);
      }
    }

    // Handle contentJson
    if (data.contentJson !== undefined) {
      params.push(JSON.stringify(data.contentJson));
      setClauses.push(`content_json = $${params.length}`);
    }
    if (contentHtml !== undefined) {
      params.push(contentHtml);
      setClauses.push(`content_html = $${params.length}`);
    }
    if (readingTime !== undefined) {
      params.push(readingTime);
      setClauses.push(`reading_time = $${params.length}`);
    }

    if (data.status === 'PUBLISHED') {
      setClauses.push(`published_at = COALESCE(published_at, NOW())`);
    } else if (data.status === 'DRAFT') {
      setClauses.push(`published_at = NULL`);
    }

    if (setClauses.length === 0) throw new BadRequestError('No valid fields provided for update');

    params.push(id);
    const result = await client.query(
      `UPDATE blogs SET ${setClauses.join(', ')}
       WHERE id = $${params.length} AND deleted_at IS NULL
       RETURNING id, slug, status, featured_image_url, og_image_url, twitter_image_url`,
      params
    );
    const updated = result.rows[0];
    if (!updated) throw new NotFoundError('Blog not found');

    // Sync tags
    if (data.tagIds !== undefined) {
      await client.query('DELETE FROM blog_tag_mapping WHERE blog_id = $1', [id]);
      for (const tagId of data.tagIds) {
        await client.query(
          'INSERT INTO blog_tag_mapping (blog_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [id, tagId]
        );
      }
    }

    // Sync FAQs (full replace)
    if (data.faqs !== undefined) {
      await client.query('DELETE FROM blog_faq WHERE blog_id = $1', [id]);
      for (let i = 0; i < data.faqs.length; i++) {
        const faq = data.faqs[i];
        await client.query(
          `INSERT INTO blog_faq (id, blog_id, question, answer, sort_order)
           VALUES (uuid_generate_v4(), $1, $2, $3, $4)`,
          [id, faq.question, faq.answer, faq.sortOrder ?? i]
        );
      }
    }

    return updated;
  });

  // Cleanup old R2 images
  if (currentBlog.featured_image_url && currentBlog.featured_image_url !== data.featuredImageUrl) {
    await cleanupImageUrl(currentBlog.featured_image_url);
  }
  if (currentBlog.og_image_url && currentBlog.og_image_url !== data.ogImageUrl) {
    await cleanupImageUrl(currentBlog.og_image_url);
  }
  if (currentBlog.twitter_image_url && currentBlog.twitter_image_url !== data.twitterImageUrl) {
    await cleanupImageUrl(currentBlog.twitter_image_url);
  }

  res.json({ success: true, data: updatedBlog, message: 'Blog updated successfully' });
};

// ─── Delete Blog (Admin) ──────────────────────────────────────────────────────
export const deleteBlog = async (req: Request, res: Response) => {
  const { id } = req.params;

  const currentBlog = await queryOne<{
    featured_image_url: string | null;
    og_image_url: string | null;
    twitter_image_url: string | null;
  }>(
    `SELECT featured_image_url, og_image_url, twitter_image_url FROM blogs WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );

  if (!currentBlog) throw new NotFoundError('Blog not found');

  await query(`UPDATE blogs SET deleted_at = NOW() WHERE id = $1`, [id]);

  if (currentBlog.featured_image_url) await cleanupImageUrl(currentBlog.featured_image_url);
  if (currentBlog.og_image_url) await cleanupImageUrl(currentBlog.og_image_url);
  if (currentBlog.twitter_image_url) await cleanupImageUrl(currentBlog.twitter_image_url);

  res.json({ success: true, message: 'Blog deleted successfully' });
};

// ─── Categories CRUD ──────────────────────────────────────────────────────────

/** Default blog categories — seeded automatically if table is empty */
const DEFAULT_BLOG_CATEGORIES = [
  { name: 'Buying Guide',    slug: 'buying-guide' },
  { name: 'Selling Tips',    slug: 'selling-tips' },
  { name: 'Market Updates',  slug: 'market-updates' },
  { name: 'Legal & Finance', slug: 'legal-finance' },
  { name: 'Interior',        slug: 'interior' },
  { name: 'News',            slug: 'news' },
  { name: 'Investment',      slug: 'investment' },
  { name: 'Rewa Updates',    slug: 'rewa-updates' },
];

export const listBlogCategories = async (req: Request, res: Response) => {
  let categories = await query<any>(
    `SELECT id, name, slug, description, seo_title as "seoTitle", seo_description as "seoDescription",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM blog_categories ORDER BY name ASC`
  );

  // Auto-seed default categories if table is empty (handles fresh production DBs)
  if (categories.length === 0) {
    for (const cat of DEFAULT_BLOG_CATEGORIES) {
      await query(
        `INSERT INTO blog_categories (id, name, slug)
         VALUES (uuid_generate_v4(), $1, $2)
         ON CONFLICT (slug) DO NOTHING`,
        [cat.name, cat.slug]
      );
    }
    // Fetch again after seeding
    categories = await query<any>(
      `SELECT id, name, slug, description, seo_title as "seoTitle", seo_description as "seoDescription",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM blog_categories ORDER BY name ASC`
    );
  }

  res.json({ success: true, data: categories });
};


export const createBlogCategory = async (req: Request, res: Response) => {
  const validation = CreateBlogCategorySchema.safeParse(req.body);
  if (!validation.success) throw new ValidationError('Invalid input', validation.error.format());

  const data = validation.data;
  const slug = data.slug || slugify(data.name);

  const existing = await queryOne('SELECT id FROM blog_categories WHERE slug = $1', [slug]);
  if (existing) throw new BadRequestError('A category with this slug already exists');

  const [cat] = await query<any>(
    `INSERT INTO blog_categories (id, name, slug, description, seo_title, seo_description)
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5)
     RETURNING id, name, slug, description, seo_title as "seoTitle", seo_description as "seoDescription"`,
    [data.name, slug, data.description || null, data.seoTitle || null, data.seoDescription || null]
  );
  res.status(201).json({ success: true, data: cat });
};

export const updateBlogCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const validation = UpdateBlogCategorySchema.safeParse(req.body);
  if (!validation.success) throw new ValidationError('Invalid input', validation.error.format());

  const data = validation.data;
  const setClauses: string[] = [];
  const params: any[] = [];

  const fm: Record<string, string> = {
    name: 'name', slug: 'slug', description: 'description',
    seoTitle: 'seo_title', seoDescription: 'seo_description',
  };
  for (const [key, val] of Object.entries(data)) {
    if (fm[key] && val !== undefined) {
      params.push(val); setClauses.push(`${fm[key]} = $${params.length}`);
    }
  }
  if (!setClauses.length) throw new BadRequestError('No fields to update');

  params.push(id);
  const [cat] = await query<any>(
    `UPDATE blog_categories SET ${setClauses.join(', ')} WHERE id = $${params.length}
     RETURNING id, name, slug, description, seo_title as "seoTitle", seo_description as "seoDescription"`,
    params
  );
  if (!cat) throw new NotFoundError('Category not found');
  res.json({ success: true, data: cat });
};

export const deleteBlogCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  // Null-out category_id in blogs first
  await query('UPDATE blogs SET category_id = NULL WHERE category_id = $1', [id]);
  const result = await query('DELETE FROM blog_categories WHERE id = $1 RETURNING id', [id]);
  if (!result.length) throw new NotFoundError('Category not found');
  res.json({ success: true, message: 'Category deleted' });
};

// ─── Tags CRUD ────────────────────────────────────────────────────────────────
export const listBlogTags = async (req: Request, res: Response) => {
  const { search } = req.query;
  let queryStr = `SELECT id, name, slug, created_at as "createdAt" FROM blog_tags`;
  const params: any[] = [];
  if (search) {
    params.push(`%${search}%`);
    queryStr += ` WHERE name ILIKE $1`;
  }
  queryStr += ` ORDER BY name ASC LIMIT 100`;
  const tags = await query<any>(queryStr, params);
  res.json({ success: true, data: tags });
};

export const createBlogTag = async (req: Request, res: Response) => {
  const validation = CreateBlogTagSchema.safeParse(req.body);
  if (!validation.success) throw new ValidationError('Invalid input', validation.error.format());

  const data = validation.data;
  const slug = data.slug || slugify(data.name);

  const [tag] = await query<any>(
    `INSERT INTO blog_tags (id, name, slug)
     VALUES (uuid_generate_v4(), $1, $2)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
     RETURNING id, name, slug`,
    [data.name.trim(), slug]
  );
  res.status(201).json({ success: true, data: tag });
};

export const deleteBlogTag = async (req: Request, res: Response) => {
  const { id } = req.params;
  await query('DELETE FROM blog_tag_mapping WHERE tag_id = $1', [id]);
  const result = await query('DELETE FROM blog_tags WHERE id = $1 RETURNING id', [id]);
  if (!result.length) throw new NotFoundError('Tag not found');
  res.json({ success: true, message: 'Tag deleted' });
};

// ─── FAQ CRUD ─────────────────────────────────────────────────────────────────
export const listBlogFaqs = async (req: Request, res: Response) => {
  const { id: blogId } = req.params;
  const faqs = await query<any>(
    `SELECT id, blog_id as "blogId", question, answer, sort_order as "sortOrder",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM blog_faq WHERE blog_id = $1 ORDER BY sort_order, created_at`,
    [blogId]
  );
  res.json({ success: true, data: faqs });
};

export const addBlogFaq = async (req: Request, res: Response) => {
  const { id: blogId } = req.params;
  const validation = BlogFaqItemSchema.safeParse(req.body);
  if (!validation.success) throw new ValidationError('Invalid FAQ data', validation.error.format());

  const data = validation.data;
  const [faq] = await query<any>(
    `INSERT INTO blog_faq (id, blog_id, question, answer, sort_order)
     VALUES (uuid_generate_v4(), $1, $2, $3, $4)
     RETURNING id, blog_id as "blogId", question, answer, sort_order as "sortOrder"`,
    [blogId, data.question, data.answer, data.sortOrder ?? 0]
  );
  res.status(201).json({ success: true, data: faq });
};

export const updateBlogFaq = async (req: Request, res: Response) => {
  const { faqId } = req.params;
  const validation = BlogFaqItemSchema.partial().safeParse(req.body);
  if (!validation.success) throw new ValidationError('Invalid FAQ data', validation.error.format());

  const data = validation.data;
  const setClauses: string[] = [];
  const params: any[] = [];

  if (data.question !== undefined) { params.push(data.question); setClauses.push(`question = $${params.length}`); }
  if (data.answer !== undefined) { params.push(data.answer); setClauses.push(`answer = $${params.length}`); }
  if (data.sortOrder !== undefined) { params.push(data.sortOrder); setClauses.push(`sort_order = $${params.length}`); }

  if (!setClauses.length) throw new BadRequestError('No fields to update');

  params.push(faqId);
  const [faq] = await query<any>(
    `UPDATE blog_faq SET ${setClauses.join(', ')} WHERE id = $${params.length}
     RETURNING id, question, answer, sort_order as "sortOrder"`,
    params
  );
  if (!faq) throw new NotFoundError('FAQ not found');
  res.json({ success: true, data: faq });
};

export const deleteBlogFaq = async (req: Request, res: Response) => {
  const { faqId } = req.params;
  const result = await query('DELETE FROM blog_faq WHERE id = $1 RETURNING id', [faqId]);
  if (!result.length) throw new NotFoundError('FAQ not found');
  res.json({ success: true, message: 'FAQ deleted' });
};

export const reorderBlogFaqs = async (req: Request, res: Response) => {
  const { id: blogId } = req.params;
  const validation = BlogFaqReorderSchema.safeParse(req.body);
  if (!validation.success) throw new ValidationError('Invalid reorder data', validation.error.format());

  await withTransaction(async (client) => {
    for (const item of validation.data.faqs) {
      await client.query(
        'UPDATE blog_faq SET sort_order = $1 WHERE id = $2 AND blog_id = $3',
        [item.sortOrder, item.id, blogId]
      );
    }
  });

  res.json({ success: true, message: 'FAQs reordered' });
};
