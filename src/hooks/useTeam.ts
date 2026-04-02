import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useTeam() {
  return useQuery({
    queryKey: ['team'],
    queryFn: async () => {
      const res = await fetch('/api/ui_team');
      if (!res.ok) throw new Error('Failed to fetch team members');
      return res.json();
    },
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (telegramId: string) => {
      const res = await fetch('/api/ui_team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to invite member');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      toast.success('Member added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ telegramId, role }: { telegramId: number, role: string }) => {
      const res = await fetch('/api/ui_team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      toast.success('Role updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
}
