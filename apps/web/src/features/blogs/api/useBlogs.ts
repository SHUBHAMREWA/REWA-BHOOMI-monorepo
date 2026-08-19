import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { Blog, BlogCategory, BlogTag, BlogFaq, CreateBlogInput, UpdateBlogInput } from '@rewa-bhoomi/types';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BlogFilters {
  limit?: number;
  page?: number;
  cursor?: string;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  language?: string;
  categoryId?: string;
}

export interface BlogPaginationMeta {
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  cursor?: string;
  limit: number;
}

export interface BlogsWithMetaResponse {
  data: Blog[];
  meta: BlogPaginationMeta;
}

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const blogKeys = {
  all: ['blogs'] as const,
  lists: () => [...blogKeys.all, 'list'] as const,
  list: (filters: BlogFilters) => [...blogKeys.lists(), filters] as const,
  details: () => [...blogKeys.all, 'detail'] as const,
  detail: (slug: string) => [...blogKeys.details(), slug] as const,
  categories: () => [...blogKeys.all, 'categories'] as const,
  tags: (search?: string) => [...blogKeys.all, 'tags', search] as const,
};

// ─── Blog Hooks ──────────────────────────────────────────────────────────────

export const useBlogs = (filters: BlogFilters = {}) => {
  return useQuery({
    queryKey: blogKeys.list(filters),
    queryFn: async () => {
      const res = await apiGet<Blog[]>('/blogs', filters as Record<string, unknown>);
      return res;
    },
  });
};

export const useBlogsWithMeta = (filters: BlogFilters = {}) => {
  return useQuery({
    queryKey: blogKeys.list(filters),
    queryFn: async (): Promise<BlogsWithMetaResponse> => {
      const cleanParams: Record<string, any> = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '' && v !== null) {
          cleanParams[k] = v;
        }
      });

      const response = await apiClient.get<{
        success: true;
        data: Blog[];
        meta: BlogPaginationMeta;
      }>('/blogs', { params: cleanParams });

      return {
        data: response.data.data || [],
        meta: response.data.meta || {
          total: response.data.data?.length || 0,
          page: filters.page || 1,
          totalPages: 1,
          hasMore: false,
          limit: filters.limit || 10,
        },
      };
    },
  });
};

export const useBlog = (slug: string) => {
  return useQuery({
    queryKey: blogKeys.detail(slug),
    queryFn: () => apiGet<Blog>(`/blogs/${slug}`),
    enabled: !!slug,
  });
};

export const useCreateBlog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBlogInput) => apiPost<Blog>('/blogs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
    },
  });
};

export const useUpdateBlog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBlogInput }) =>
      apiPatch<Blog>(`/blogs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: blogKeys.details() });
    },
  });
};

export const useDeleteBlog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/blogs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
    },
  });
};

// ─── Category Hooks ───────────────────────────────────────────────────────────

export const useBlogCategories = () => {
  return useQuery({
    queryKey: blogKeys.categories(),
    queryFn: () => apiGet<BlogCategory[]>('/blogs/categories'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreateBlogCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; slug?: string; description?: string; seoTitle?: string; seoDescription?: string }) =>
      apiPost<BlogCategory>('/blogs/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.categories() });
    },
  });
};

export const useUpdateBlogCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ name: string; description: string; seoTitle: string; seoDescription: string }> }) =>
      apiPatch<BlogCategory>(`/blogs/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.categories() });
    },
  });
};

export const useDeleteBlogCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/blogs/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.categories() });
    },
  });
};

// ─── Tag Hooks ────────────────────────────────────────────────────────────────

export const useBlogTags = (search?: string) => {
  return useQuery({
    queryKey: blogKeys.tags(search),
    queryFn: () => apiGet<BlogTag[]>('/blogs/tags', search ? { search } : undefined),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateBlogTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; slug?: string }) =>
      apiPost<BlogTag>('/blogs/tags', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.tags() });
    },
  });
};

export const useDeleteBlogTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/blogs/tags/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.tags() });
    },
  });
};
