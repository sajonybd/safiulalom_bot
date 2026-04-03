import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { User, Lock, Bell, Globe, Palette, Save, Loader2 } from "lucide-react";
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
            <div className="space-y-1.5 pt-2">
              <Label className="text-xs">{t("telegram_user_id")}</Label>
              <Input value={userData?.user?.telegramId || ""} className="h-9 text-sm font-mono" disabled />
              <p className="text-[10px] text-muted-foreground">{t("connected_via")} {userData?.user?.provider || 'Telegram'}</p>
            </div>
            <div className="flex justify-end pt-2">
              <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={updateProfile.isPending}>
                {updateProfile.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {t("save_changes")}
              </Button>
            </div>
          </div>
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
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t("notification_prefs")}</h3>
            {[
              { label: t('telegram_notif'), desc: t('telegram_notif_desc'), default: true },
              { label: t('daily_summary'), desc: t('daily_summary_desc'), default: true },
              { label: t('lenden_alerts'), desc: t('lenden_alerts_desc'), default: true },
            ].map((pref) => (
              <div key={pref.label} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-foreground">{pref.label}</p>
                  <p className="text-xs text-muted-foreground">{pref.desc}</p>
                </div>
                <Switch defaultChecked={pref.default} />
              </div>
            ))}
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
    </DashboardLayout>
  );
};

export default Settings;
