import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useTeam() {
  return useQuery({
    queryKey: ['team'],
    queryFn: async () => {
      const res = await fetch('/api/ui_team');
      if (!res.ok) throw new Error('Failed to fetch team data');
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
      toast.success('Invitation sent successfully');
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
        body: JSON.stringify({ action: 'UPDATE_ROLE', telegramId, role }),
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

export function useTeamAction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ action, familyId }: { action: 'ACCEPT_INVITATION' | 'REJECT_INVITATION' | 'SWITCH_TEAM', familyId: string }) => {
      const res = await fetch('/api/ui_team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, familyId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      
      if (variables.action === 'SWITCH_TEAM') {
        toast.success('Switched team successfully');
        window.location.reload(); // Force reload to refresh all data context
      } else if (variables.action === 'ACCEPT_INVITATION') {
        toast.success('Invitation accepted');
        window.location.reload();
      } else {
        toast.success('Invitation rejected');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
}
