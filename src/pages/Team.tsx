import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Shield, Plus, MoreVertical, UserCheck, Eye, Edit, Loader2, UserPlus, Check, X, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/contexts/SettingsContext";
import { useTeam, useInviteMember, useUpdateMemberRole, useTeamAction } from "@/hooks/useTeam";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const roleIcons: Record<string, React.ReactNode> = {
  OWNER: <Shield className="w-3 h-3" />,
  EDITOR: <Edit className="w-3 h-3" />,
  VIEWER: <Eye className="w-3 h-3" />,
};

const Team = () => {
  const { t } = useSettings();
  const { data, isLoading } = useTeam();
  const inviteMember = useInviteMember();
  const updateRole = useUpdateMemberRole();
  const teamAction = useTeamAction();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [telegramId, setTelegramId] = useState("");

  const members = data?.team || [];
  const myFamilies = data?.myFamilies || [];
  const activeFamilyId = data?.activeFamilyId;

  const pendingInvitations = myFamilies.filter((f: any) => f.status === "PENDING");
  const acceptedFamilies = myFamilies.filter((f: any) => f.status === "ACCEPTED");

  const roles = [
    { role: 'OWNER', desc: t('owner_desc'), count: members.filter((m: any) => m.role === 'OWNER').length },
    { role: 'EDITOR', desc: t('editor_desc'), count: members.filter((m: any) => m.role === 'EDITOR').length },
    { role: 'VIEWER', desc: t('viewer_desc'), count: members.filter((m: any) => m.role === 'VIEWER').length },
  ];

  const handleInvite = async () => {
    if (!telegramId) return;
    try {
      await inviteMember.mutateAsync(telegramId);
      setInviteOpen(false);
      setTelegramId("");
    } catch (err) {}
  };

  const handleUpdateRole = async (targetId: number, newRole: string) => {
    try {
      await updateRole.mutateAsync({ telegramId: targetId, role: newRole });
    } catch (err) {}
  };

  const handleAction = async (action: 'ACCEPT_INVITATION' | 'REJECT_INVITATION' | 'SWITCH_TEAM', familyId: string) => {
    try {
      await teamAction.mutateAsync({ action, familyId });
    } catch (err) {}
  };

  return (
    <DashboardLayout>
    <div className="p-4 lg:p-6 space-y-8 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t("team")}</h2>
          <p className="text-sm text-muted-foreground">{t("manage_team_desc")}</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setInviteOpen(true)}>
          <Plus className="w-4 h-4" /> {t("invite_member")}
        </Button>
      </div>

      {/* Pending Invitations Section */}
      {pendingInvitations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" /> {t("pending_invitations")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingInvitations.map((inv: any) => (
              <div key={inv.family_id} className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{inv.name || 'Shared Team'}</p>
                  <p className="text-xs text-muted-foreground">{t("invited_as")} {inv.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleAction('REJECT_INVITATION', inv.family_id)}>
                    <X className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => handleAction('ACCEPT_INVITATION', inv.family_id)}>
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Teams Switcher Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <SwitchCamera className="w-4 h-4 text-primary" /> {t("my_teams_profiles")}
        </h3>
        <div className="flex flex-wrap gap-3">
          {acceptedFamilies.map((fam: any) => (
            <button
              key={fam.family_id}
              onClick={() => handleAction('SWITCH_TEAM', fam.family_id)}
              className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-2 ${
                fam.family_id === activeFamilyId 
                ? 'bg-primary border-primary text-primary-foreground shadow-sm' 
                : 'bg-card border-border text-foreground hover:border-primary/50'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${fam.family_id === activeFamilyId ? 'bg-primary-foreground' : 'bg-muted-foreground'}`} />
              {t(fam.name) || fam.name || (fam.family_id === activeFamilyId ? 'Active Team' : 'Switch Team')}
              {fam.role === 'OWNER' && <Shield className="w-3 h-3 ml-0.5 opacity-70" />}
            </button>
          ))}
        </div>
      </div>

      {/* Invite Member Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("invite_member")}</DialogTitle>
            <DialogDescription>
              {t("invite_member_desc_telegram")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="telegramId" className="text-sm font-medium">{t("telegram_user_id")}</label>
              <Input
                id="telegramId"
                placeholder="e.g. 123456789"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">{t("telegram_id_help")}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>{t("cancel")}</Button>
            <Button onClick={handleInvite} disabled={inviteMember.isPending || !telegramId}>
              {inviteMember.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
              {t("send_invitation")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Roles cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {roles.map((r) => (
          <div key={r.role} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              {roleIcons[r.role]}
              <h4 className="text-sm font-semibold text-foreground uppercase">{r.role}</h4>
            </div>
            <p className="text-xs text-muted-foreground">{r.desc}</p>
            <p className="text-xs text-muted-foreground mt-2">{r.count} {t("member")}</p>
          </div>
        ))}
      </div>

      {/* Members Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{t("member")}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{t("role")}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">ID</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
               <tr>
               <td colSpan={4} className="py-10 text-center">
                 <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
               </td>
             </tr>
            ) : members.map((member: any) => (
              <tr key={member.telegramId} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary capitalize">
                      {member.firstName ? member.firstName[0] : (member.username ? member.username[0] : 'U')}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{member.firstName || member.username || 'User'}</p>
                      <p className="text-xs text-muted-foreground">@{member.username || 'unknown'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="gap-1 text-xs font-mono uppercase">
                    {roleIcons[member.role] || <Eye className="w-3 h-3" />} {member.role}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {member.telegramId}
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{t("manage_role")}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleUpdateRole(member.telegramId, 'OWNER')}>
                        <Shield className="w-4 h-4 mr-2" /> OWNER
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateRole(member.telegramId, 'EDITOR')}>
                        <Edit className="w-4 h-4 mr-2" /> EDITOR
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateRole(member.telegramId, 'VIEWER')}>
                        <Eye className="w-4 h-4 mr-2" /> VIEWER
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {!isLoading && members.length === 0 && (
              <tr>
                <td colSpan={4} className="py-10 text-center text-muted-foreground">{t("no_members_found")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    </DashboardLayout>
  );
};

export default Team;
