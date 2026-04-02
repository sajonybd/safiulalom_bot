import { useQuery } from '@tanstack/react-query';

export function usePeople() {
  return useQuery({
    queryKey: ['people'],
    queryFn: async () => {
      const res = await fetch('/api/ui_people');
      if (!res.ok) throw new Error('Failed to fetch people balances');
      return res.json();
    },
  });
}

export function usePerson(person: string) {
  return useQuery({
    queryKey: ['people', person],
    queryFn: async () => {
      const res = await fetch(`/api/ui_people?person=${encodeURIComponent(person)}`);
      if (!res.ok) throw new Error('Failed to fetch person details');
      return res.json();
    },
    enabled: !!person,
  });
}
