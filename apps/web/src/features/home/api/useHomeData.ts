import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { Poster, CompanyCommunication } from '@rewa-bhoomi/types';

export const homeQueryKeys = {
  posters: ['posters'] as const,
  communication: ['communication'] as const,
};

/**
 * Fetch and cache posters data in memory.
 * Will only hit API on hard refresh or after staleTime (10 minutes).
 */
export function usePosters() {
  return useQuery<Poster[]>({
    queryKey: homeQueryKeys.posters,
    queryFn: async () => {
      const data = await apiGet<Poster[]>('/posters');
      if (Array.isArray(data)) {
        return data.filter((p) => p.is_active);
      }
      return [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    gcTime: 30 * 60 * 1000, // 30 minutes in garbage collection
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Fetch and cache company communication details (Phone, Email, Address, Socials).
 * Shared globally across Home, WhatsApp button, Footer, and Contact page.
 */
export function useCompanyCommunication() {
  return useQuery<CompanyCommunication | null>({
    queryKey: homeQueryKeys.communication,
    queryFn: async () => {
      try {
        const data = await apiGet<CompanyCommunication>('/communication');
        return data || null;
      } catch (err) {
        return null;
      }
    },
    staleTime: 15 * 60 * 1000, // 15 minutes cache
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
