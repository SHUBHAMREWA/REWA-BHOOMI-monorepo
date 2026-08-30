import { useMutation } from '@tanstack/react-query';
import { apiPost } from '@/lib/api';

export const useUploadMedia = () => {
  return useMutation({
    mutationFn: async (payload: File | { imageUrl: string }) => {
      const { apiClient } = await import('@/lib/api');
      
      if (payload instanceof File) {
        const formData = new FormData();
        formData.append('file', payload);
        const response = await apiClient.post<{ success: true; data: { url: string } }>('/media/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data.data;
      } else {
        const response = await apiClient.post<{ success: true; data: { url: string } }>('/media/upload', {
          imageUrl: payload.imageUrl,
        });
        return response.data.data;
      }
    },
  });
};


export const useDeleteMedia = () => {
  return useMutation({
    mutationFn: (url: string) => apiPost('/media/delete', { url }),
  });
};
