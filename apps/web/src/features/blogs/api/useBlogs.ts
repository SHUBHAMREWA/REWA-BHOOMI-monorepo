import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { Blog, PaginatedResponse, CreateBlogInput, UpdateBlogInput } from '@rewa-bhoomi/types';

export const blogKeys = {
  all: ['blogs'] as const,
  lists: () => [...blogKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...blogKeys.lists(), filters] as const,
  details: () => [...blogKeys.all, 'detail'] as const,
  detail: (slug: string) => [...blogKeys.details(), slug] as const,
};

export const useBlogs = (filters: { limit?: number; cursor?: string; status?: string } = {}) => {
  return useQuery({
    queryKey: blogKeys.list(filters),
    queryFn: async () => {
      // The API response shape from controller wraps the array in `data`
      // Since apiGet returns response.data.data directly, we might need a custom type if apiGet expects only the nested object.
      // Actually `apiGet` returns `T`, which is mapped to `response.data.data`. But the controller returns:
      // { success: true, data: [...], meta: {...} }. So apiGet returns `data` array if we pass `T` as array.
      // Wait, apiGet returns response.data.data. So it strips `meta`. 
      // Let's use apiClient directly if we need meta, but for now we can rely on standard fetch or adjust apiGet.
      // We'll use custom fetch to get the full response with meta if needed, but for simplicity let's stick to the structure.
      const res = await apiGet<Blog[]>('/blogs', filters);
      return res; // Note: if we need pagination meta, we should ideally fetch raw or adjust apiGet.
    },
  });
};

export const useBlogsWithMeta = (filters: { limit?: number; cursor?: string; status?: string } = {}) => {
  return useQuery({
    queryKey: blogKeys.list(filters),
    queryFn: async () => {
      // We import apiClient from @/lib/api to get the full response including meta
      const { apiClient } = await import('@/lib/api');
      const response = await apiClient.get<{ success: true; data: Blog[]; meta: any }>('/blogs', { params: filters });
      return { data: response.data.data, meta: response.data.meta };
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
    mutationFn: ({ id, data }: { id: string; data: UpdateBlogInput }) => apiPatch<Blog>(`/blogs/${id}`, data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
      queryClient.invalidateQueries({ queryKey: blogKeys.details() }); // Ideally invalidate specific slug
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
