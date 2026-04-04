import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { User, Lock, Bell, Globe, Palette, Save, Loader2, Database, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSettings } from "@/contexts/SettingsContext";
import { useUser, useUpdateProfile } from "@/hooks/useUser";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/dashboard/ConfirmModal";

const Settings = () => {
  const { language, currency, setLanguage, setCurrency, t } = useSettings();
  const { data: userData, isLoading: userLoading } = useUser();
  const updateProfile = useUpdateProfile();
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  });

  const [tgSyncId, setTgSyncId] = useState("");
  const [tgSyncCode, setTgSyncCode] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [preferences, setPreferences] = useState<any>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (userData?.user?.preferences) {
      setPreferences(userData.user.preferences);
    }
  }, [userData]);

  const handlePreferenceChange = async (key: string, value: boolean) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    try {
      await updateProfile.mutateAsync({
        preferences: newPrefs
      });
    } catch (err) {
      setPreferences(preferences);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
       const res = await fetch("/api/ui_user", { method: "DELETE" });
       const data = await res.json();
       if (data.ok) {
         toast.success(data.message);
         setTimeout(() => window.location.href = "/api/ui_logout", 2000);
       } else {
         toast.error(data.error || "Failed to delete account");
       }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  useEffect(() => {
    if (userData?.user) {
      setFormData({
        firstName: userData.user.firstName || "",
        lastName: userData.user.lastName || "",
        email: userData.user.email || "",
        phone: userData.user.phone || ""
      });
    }
  }, [userData]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone
      });
    } catch (err) {}
  };

  const handleSyncTelegram = async () => {
    if (!tgSyncId || !tgSyncCode) {
      toast.error(t("enter_id_code"));
      return;
    }

    setIsSyncing(true);
    try {
      const res = await fetch("/api/auth/link_telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramUserId: tgSyncId, code: tgSyncCode })
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(t("sync_success"));
        window.location.reload(); // Refresh to get updated user data
      } else {
        toast.error(data.error || t("sync_failed"));
      }
    } catch (err) {
      toast.error(t("sync_failed"));
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <DashboardLayout>
    <div className="p-4 lg:p-6 space-y-5 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">{t("settings")}</h2>
        <p className="text-sm text-muted-foreground">{t("manage_account_desc")}</p>
      </div>

    <Tabs defaultValue="profile" className="space-y-5">
        <div className="w-full overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="bg-muted inline-flex w-auto sm:w-full sm:flex h-auto p-1">
            <TabsTrigger value="profile" className="gap-1.5 text-xs py-2 px-4 min-w-fit">
              <User className="w-3.5 h-3.5" /> {t("profile")}
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5 text-xs py-2 px-4 min-w-fit">
              <Lock className="w-3.5 h-3.5" /> {t("security")}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5 text-xs py-2 px-4 min-w-fit">
              <Bell className="w-3.5 h-3.5" /> {t("notifications")}
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-1.5 text-xs py-2 px-4 min-w-fit">
              <Database className="w-3.5 h-3.5" /> {t("data")}
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-1.5 text-xs py-2 px-4 min-w-fit">
              <Palette className="w-3.5 h-3.5" /> {t("appearance")}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Profile */}
        <TabsContent value="profile">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t("profile_info")}</h3>
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary capitalize">
                {formData.firstName?.[0] || userData?.user?.username?.[0] || 'U'}
              </div>
              <div>
                <Button variant="outline" size="sm" className="text-xs">{t("change_photo")}</Button>
                <p className="text-xs text-muted-foreground mt-1">{t("photo_help")}</p>
              </div>
            </div>
            {userLoading ? (
               <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("first_name")}</Label>
                  <Input 
                    value={formData.firstName} 
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                    className="h-9 text-sm" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("last_name")}</Label>
                  <Input 
                    value={formData.lastName}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                    className="h-9 text-sm" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("email_label")}</Label>
                  <Input 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="h-9 text-sm" 
                    type="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("phone_label")}</Label>
                  <Input 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="h-9 text-sm" 
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={updateProfile.isPending}>
                {updateProfile.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {t("save_changes")}
              </Button>
            </div>
          </div>

          {/* Telegram Sync Section - Only for Google users not already fully synced */}
          {userData?.user?.provider === 'google' && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#0088cc]/10 rounded-lg">
                  <svg className="w-4 h-4 fill-[#0088cc]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.882-.662 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-foreground">{t("telegram_sync")}</h3>
              </div>
              
              <p className="text-xs text-muted-foreground">{t("sync_telegram_desc")}</p>
              
              {userData.user.linkedTelegramId ? (
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-primary/10">
                   <div className="flex flex-col gap-0.5">
                     <span className="text-[10px] uppercase font-bold text-primary tracking-wider">{t("already_synced")}</span>
                     <span className="text-sm font-mono">{userData.user.linkedTelegramId}</span>
                   </div>
                   <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t("telegram_user_id")}</Label>
                        <Input 
                          placeholder="e.g. 123456789" 
                          className="h-9 text-sm"
                          value={tgSyncId}
                          onChange={e => setTgSyncId(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t("login_otp_code")}</Label>
                        <Input 
                          placeholder="6-digit code" 
                          className="h-9 text-sm"
                          maxLength={6}
                          value={tgSyncCode}
                          onChange={e => setTgSyncCode(e.target.value)}
                        />
                      </div>
                   </div>
                   <p className="text-[10px] text-muted-foreground italic">{t("how_to_get_id_code")}</p>
                   <Button 
                    size="sm" 
                    className="w-full sm:w-auto bg-[#0088cc] hover:bg-[#0077b3] gap-1.5"
                    onClick={handleSyncTelegram}
                    disabled={isSyncing}
                   >
                    {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    {t("link_now")}
                   </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t("update_password")}</h3>
            <div className="space-y-4 max-w-sm">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("current_password")}</Label>
                <Input type="password" placeholder="••••••••" className="h-9 text-sm" disabled />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("new_password")}</Label>
                <Input type="password" placeholder="••••••••" className="h-9 text-sm" disabled />
              </div>
              <Button size="sm" className="gap-1.5" disabled>
                <Lock className="w-3.5 h-3.5" /> {t("update_password")}
              </Button>
              <p className="text-[10px] text-muted-foreground italic">{t("password_managed_externally")}</p>
            </div>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50/30 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-red-600">{t("delete_account")}</h3>
            <p className="text-xs text-red-600/80">{t("delete_account_desc")}</p>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : null}
              {t("delete_account")}
            </Button>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t("notification_prefs")}</h3>
            {[
              { id: 'telegram_notifications', label: t('telegram_notif'), desc: t('telegram_notif_desc') },
              { id: 'daily_summary_9pm', label: t('daily_summary'), desc: t('daily_summary_desc') },
              { id: 'lenden_alerts', label: t('lenden_alerts'), desc: t('lenden_alerts_desc') },
            ].map((pref) => (
              <div key={pref.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-foreground">{pref.label}</p>
                  <p className="text-xs text-muted-foreground">{pref.desc}</p>
                </div>
                <Switch 
                  checked={preferences[pref.id] === true} 
                  onCheckedChange={(checked) => handlePreferenceChange(pref.id, checked)}
                />
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Data Management */}
        <TabsContent value="data">
          <div className="rounded-xl border border-border bg-card p-5 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{t("data_management")}</h3>
                <p className="text-xs text-muted-foreground">{t("data_desc")}</p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{t("export_data")}</p>
                  <p className="text-[11px] text-muted-foreground">{t("export_desc")}</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="gap-2 h-9 px-4 rounded-xl hover:bg-primary/5 hover:text-primary transition-all shadow-sm"
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/ui_data_export");
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      const date = new Date().toISOString().split('T')[0];
                      a.download = `life-os-export-${date}.json`;
                      a.click();
                      toast.success(t("export_success"));
                    } catch (e) {
                      toast.error(t("export_failed"));
                    }
                  }}
                >
                  <Download className="w-3.5 h-3.5" /> {t("export")}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{t("import_data")}</p>
                  <p className="text-[11px] text-muted-foreground">{t("import_desc")}</p>
                </div>
                <div>
                  <input 
                    type="file" 
                    id="import-file" 
                    className="hidden" 
                    accept=".json" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      const reader = new FileReader();
                      reader.onload = async (event) => {
                        try {
                          const json = JSON.parse(event.target?.result as string);
                          const res = await fetch("/api/ui_data_import", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ importedData: json })
                          });
                          const data = await res.json();
                          if (data.ok) {
                            toast.success(t("import_success"));
                            window.location.reload();
                          } else {
                            toast.error(data.error || t("import_failed"));
                          }
                        } catch (err) {
                          toast.error(t("invalid_json"));
                        }
                      };
                      reader.readAsText(file);
                    }}
                  />
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-2 h-9 px-4 rounded-xl hover:bg-green-500/5 hover:text-green-600 transition-all shadow-sm"
                    onClick={() => document.getElementById("import-file")?.click()}
                  >
                    <Upload className="w-3.5 h-3.5" /> {t("import")}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-lg">
              <p className="text-[10px] text-yellow-700 leading-relaxed font-medium">
                <strong>{t("safety_tip")}:</strong> {t("import_merge_tip")}
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t("appearance")}</h3>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-foreground">{t("dark_mode")}</p>
                <p className="text-xs text-muted-foreground">{t("dark_mode_desc")}</p>
              </div>
              <ThemeToggle />
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">{t("currency")} & {t("language")}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("currency")}</Label>
                  <Select value={currency} onValueChange={(v) => setCurrency(v as any)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder={t("select_currency")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BDT">BDT (৳)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("language")}</Label>
                  <Select value={language} onValueChange={(v) => setLanguage(v as any)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder={t("select_language")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="bn">বাংলা (Bangla)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>

    <ConfirmModal 
      isOpen={isDeleteDialogOpen}
      onOpenChange={setIsDeleteDialogOpen}
      onConfirm={handleDeleteAccount}
      title={t("delete_account")}
      description={t("delete_account_confirm")}
      confirmText={t("delete_account")}
      variant="destructive"
    />
    </DashboardLayout>
  );
};

export default Settings;
