import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { User, Lock, Bell, Globe, Palette, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSettings } from "@/contexts/SettingsContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Settings = () => {
  const { language, currency, setLanguage, setCurrency, t } = useSettings();

  return (
    <DashboardLayout>
    <div className="p-4 lg:p-6 space-y-5 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">{t("settings")}</h2>
        <p className="text-sm text-muted-foreground">{t("manage_account_desc")}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-5">
        <TabsList className="bg-muted">
          <TabsTrigger value="profile" className="gap-1.5 text-xs">
            <User className="w-3.5 h-3.5" /> Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5 text-xs">
            <Lock className="w-3.5 h-3.5" /> Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 text-xs">
            <Bell className="w-3.5 h-3.5" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5 text-xs">
            <Palette className="w-3.5 h-3.5" /> Appearance
          </TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Profile Information</h3>
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                S
              </div>
              <div>
                <Button variant="outline" size="sm" className="text-xs">Change Photo</Button>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG. Max 2MB.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Full Name</Label>
                <Input defaultValue="Safiul Alom" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Display Name</Label>
                <Input defaultValue="Safiul" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input defaultValue="safiul@example.com" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input defaultValue="+880 1712-345678" className="h-9 text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Telegram ID</Label>
              <Input defaultValue="@safiulalom" className="h-9 text-sm" disabled />
              <p className="text-xs text-muted-foreground">Connected via Telegram bot</p>
            </div>
            <div className="flex justify-end">
              <Button size="sm" className="gap-1.5">
                <Save className="w-3.5 h-3.5" /> Save Changes
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Change Password</h3>
            <div className="space-y-4 max-w-sm">
              <div className="space-y-1.5">
                <Label className="text-xs">Current Password</Label>
                <Input type="password" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">New Password</Label>
                <Input type="password" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Confirm New Password</Label>
                <Input type="password" className="h-9 text-sm" />
              </div>
              <Button size="sm" className="gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Update Password
              </Button>
            </div>

            <div className="border-t border-border pt-4 mt-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Two-Factor Authentication</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">Enable 2FA</p>
                  <p className="text-xs text-muted-foreground">Add extra security to your account</p>
                </div>
                <Switch />
              </div>
            </div>

            <div className="border-t border-border pt-4 mt-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Active Sessions</h3>
              <div className="space-y-2">
                {[
                  { device: 'Telegram Bot', location: 'API', active: true },
                  { device: 'Chrome - Windows', location: 'Dhaka, BD', active: true },
                ].map((session, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm text-foreground">{session.device}</p>
                      <p className="text-xs text-muted-foreground">{session.location}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-xs text-muted-foreground">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Notification Preferences</h3>
            {[
              { label: 'Telegram Notifications', desc: 'Receive confirmations via bot', default: true },
              { label: 'Daily Summary', desc: 'Get a daily report at 9 PM', default: true },
              { label: 'Pending Reminders', desc: 'Remind about unresolved entries', default: false },
              { label: 'Lenden Alerts', desc: 'Notify when receivable is overdue', default: true },
              { label: 'Budget Warnings', desc: 'Alert when exceeding budget limits', default: false },
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
            <h3 className="text-sm font-semibold text-foreground">Appearance</h3>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-foreground">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
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
