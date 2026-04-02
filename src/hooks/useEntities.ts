import { useQuery } from '@tanstack/react-query';

export function useEntities(type?: string) {
  return useQuery({
    queryKey: ['entities', type],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      const res = await fetch(`/api/ui_entities?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch entities');
      return res.json();
    },
  });
}
