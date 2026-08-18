import { useMutation } from '@tanstack/react-query';
import { apiPost } from '@/lib/api';

export const useUploadMedia = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      // We cannot use apiPost directly with FormData since it sets Content-Type to application/json by default
      // We will use the underlying apiClient to bypass default headers
      const { apiClient } = await import('@/lib/api');
      const response = await apiClient.post<{ success: true; data: { url: string } }>('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    },
  });
};

export const useDeleteMedia = () => {
  return useMutation({
    mutationFn: (url: string) => apiPost('/media/delete', { url }),
  });
};
