import { useQuery } from '@tanstack/react-query';

export function useSummary() {
  return useQuery({
    queryKey: ['summary'],
    queryFn: async () => {
      const res = await fetch('/api/ui_summary');
      if (!res.ok) throw new Error('Failed to fetch summary');
      return res.json();
    },
  });
}
